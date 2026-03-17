import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Shield, Check,
  ChevronRight, Plus, Minus,
  Loader2, Lock, Star, Mail, RefreshCw
} from 'lucide-react'
import Navigation from '../Navigation'

type WhoFor = 'myself' | 'family' | null
type Plan = 'individual' | 'trial'
type Billing = 'month' | 'year'

interface Addons {
  familyLinks: number
  dailyWellbeing: boolean
  medicationReminder: boolean
}

const WIZARD_STATE_KEY = 'lifelink_onboarding_state'

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(0)
  const [whoFor, setWhoFor] = useState<WhoFor>(null)
  const [plan, setPlan] = useState<Plan>('individual')
  const [billing, setBilling] = useState<Billing>('month')
  const [addons, setAddons] = useState<Addons>({
    familyLinks: 0,
    dailyWellbeing: false,
    medicationReminder: false,
  })
  const [protectedName, setProtectedName] = useState('')
  const [protectedEmail, setProtectedEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [referralValid, setReferralValid] = useState(false)
  const [showReferral, setShowReferral] = useState(false)
  const [gdpr1, setGdpr1] = useState(false)
  const [gdpr2, setGdpr2] = useState(false)
  const [gdpr3, setGdpr3] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string|null>(null)
  const [emailSentTo, setEmailSentTo] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // ── Restore state after email confirmation redirect ──
  useEffect(() => {
    const confirmed = searchParams.get('confirmed')
    if (confirmed === 'true') {
      const saved = localStorage.getItem(WIZARD_STATE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          setWhoFor(state.whoFor)
          setPlan(state.plan)
          setBilling(state.billing)
          setAddons(state.addons)
          setFullName(state.fullName)
          setEmail(state.email)
          setPhone(state.phone)
          setProtectedName(state.protectedName || '')
          setProtectedEmail(state.protectedEmail || '')
          setReferralCode(state.referralCode || '')
          // Email confirmed — go to payment (individual) or success (trial)
          if (state.plan === 'trial') {
            activateTrialAndComplete()
          } else {
            setStep(5) // payment step
          }
        } catch {
          // Corrupted state — go to success anyway
          setStep(6)
        }
        localStorage.removeItem(WIZARD_STATE_KEY)
        return
      }
      // No saved state but confirmed — check if user is logged in
      setStep(6)
      return
    }

    // Normal URL params
    if (searchParams.get('plan') === 'trial')
      setPlan('trial')
    if (searchParams.get('billing') === 'annual')
      setBilling('year')
    if (searchParams.get('for') === 'family') {
      setWhoFor('family')
      setStep(1)
    }
    const ref = searchParams.get('ref')
    if (ref) {
      setReferralCode(ref)
      setShowReferral(true)
    }
  }, [])

  // Activate trial helper
  const activateTrialAndComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        await supabase.functions.invoke('activate-trial', {
          body: { user_id: user.id }
        })
        setUserId(user.id)
      }
    } catch {
      // Best effort
    }
    setStep(6) // success
  }

  // Mark onboarding complete when reaching success step
  useEffect(() => {
    if (step === 6) {
      markOnboardingComplete()
    }
  }, [step])

  const markOnboardingComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
      }
    } catch {
      // Best effort — doesn't block the user
    }
  }

  // Price calculation
  const basePrice = billing === 'year' ? 99.90 : 9.99
  const addonTotal =
    (addons.dailyWellbeing ? 2.99 : 0) +
    (addons.medicationReminder ? 2.99 : 0) +
    (addons.familyLinks * 2.99)
  const total = plan === 'trial' ? 0 :
    basePrice + addonTotal
  const claraComplete =
    addons.dailyWellbeing && addons.medicationReminder

  // Referral validation
  const checkReferral = async (code: string) => {
    if (!code) return
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', code)
      .single()
    setReferralValid(!!data)
  }

  // Save wizard state to localStorage before signUp
  const saveWizardState = () => {
    localStorage.setItem(WIZARD_STATE_KEY, JSON.stringify({
      whoFor, plan, billing, addons, fullName, email, phone,
      protectedName, protectedEmail, referralCode,
    }))
  }

  // Account creation — now includes emailRedirectTo
  const handleCreateAccount = async () => {
    if (!gdpr1 || !gdpr2) {
      toast.error('Please accept the required terms')
      return
    }
    setIsLoading(true)
    try {
      // Save state so we can restore after email confirmation
      saveWizardState()

      const redirectUrl = `${window.location.origin}/onboarding?confirmed=true`

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone,
            who_for: whoFor,
            protected_person_name: protectedName,
          }
        }
      })
      if (error) throw error
      setUserId(data.user?.id || null)
      setEmailSentTo(email)

      // Go to "check your email" step
      setStep(4)

    } catch (error: any) {
      toast.error(error.message || 'Could not create account')
      localStorage.removeItem(WIZARD_STATE_KEY)
    } finally {
      setIsLoading(false)
    }
  }

  // Resend confirmation email
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailSentTo || email,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding?confirmed=true`
        }
      })
      if (error) throw error
      toast.success('Confirmation email resent!')
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Could not resend email')
    }
  }

  const progressSteps = [
    'Who For', 'Plan', 'Add-ons',
    'Details', 'Confirm', 'Payment', 'Done'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">

        {/* Progress dots */}
        {step > 0 && step < 6 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {progressSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-xs font-bold transition-all
                  ${i < step
                    ? 'bg-red-500 text-white'
                    : i === step
                    ? 'bg-red-500 text-white ring-4 ring-red-100'
                    : 'bg-gray-200 text-gray-400'}
                `}>
                  {i < step
                    ? <Check className="w-4 h-4" />
                    : i + 1}
                </div>
                {i < progressSteps.length - 1 && (
                  <div className={`w-6 h-0.5 ${i < step ? 'bg-red-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 0: WHO IS THIS FOR ── */}
        {step === 0 && (
          <div>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Who are you setting this up for?
              </h1>
              <p className="text-gray-500">
                We'll personalise everything based on your answer
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => { setWhoFor('myself'); setStep(1) }}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-red-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-2xl">🙋</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">For myself</h3>
                    <p className="text-gray-500 text-sm">I want CLARA to protect me</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-400 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => { setWhoFor('family'); setStep(1) }}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-red-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-2xl">❤️</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">For someone I love</h3>
                    <p className="text-gray-500 text-sm">I'll set up and manage CLARA for a family member</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-400 transition-colors" />
                </div>
                <div className="mt-3 ml-18">
                  <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">Guardian account</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/gift')}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-amber-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 text-2xl">🎁</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">As a gift</h3>
                    <p className="text-gray-500 text-sm">Buy a gift subscription for someone special — no account needed</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-400 transition-colors" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1: CHOOSE PLAN ── */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Choose your plan</h1>
              <p className="text-gray-500">7-day free trial with every plan</p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-8 bg-gray-100 rounded-full p-1 w-fit mx-auto">
              <button
                onClick={() => setBilling('month')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billing === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >Monthly</button>
              <button
                onClick={() => setBilling('year')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billing === 'year' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                Annual
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Save €19.98</span>
              </button>
            </div>

            <div className="grid gap-4">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-red-300 transition-all">
                {billing === 'year' && (
                  <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-4">✨ 2 MONTHS FREE</div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Individual Plan</h3>
                    <p className="text-gray-400 text-sm mt-1">Full protection, all features</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-900">€{billing === 'year' ? '99.90' : '9.99'}</span>
                    <span className="text-gray-400 text-sm">/{billing === 'year' ? 'year' : 'month'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {['Full CLARA AI', 'SOS — app, pendant & voice', 'Up to 5 emergency contacts', 'Live GPS sharing', 'Medical profile', 'Conference bridge', 'Tablet dashboard', '1 Family Link FREE'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <Button onClick={() => { setPlan('individual'); setStep(2) }} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl">
                  Select Plan →
                </Button>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
                <div className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-4">NO CARD REQUIRED</div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Free Trial</h3>
                    <p className="text-gray-400 text-sm mt-1">Try everything free for 7 days</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-900">FREE</span>
                    <span className="text-gray-400 text-sm"> /7 days</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {['All features included', 'No credit card needed', 'Cancel anytime', 'Upgrade anytime'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <Button onClick={() => { setPlan('trial'); setStep(2) }} variant="outline" className="w-full py-3 rounded-xl">
                  Start Free Trial →
                </Button>
              </div>
            </div>
            <button onClick={() => setStep(0)} className="mt-6 text-gray-400 text-sm mx-auto block hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* ── STEP 2: ADD-ONS ── */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Enhance your protection</h1>
              <p className="text-gray-500">Powerful extras. Cancel any add-on anytime.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">Family Links</h3>
                    <p className="text-gray-500 text-sm">Extra family members who receive your SOS alerts</p>
                    <p className="text-xs text-green-600 mt-1">1st link already FREE with your plan</p>
                  </div>
                  <span className="text-gray-900 font-semibold text-sm">€2.99/link</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => setAddons(a => ({ ...a, familyLinks: Math.max(0, a.familyLinks - 1) }))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus className="w-4 h-4" /></button>
                  <span className="w-8 text-center font-bold">{addons.familyLinks}</span>
                  <button onClick={() => setAddons(a => ({ ...a, familyLinks: Math.min(10, a.familyLinks + 1) }))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
                  <span className="text-gray-400 text-sm">extra links</span>
                </div>
              </div>

              <div className={`bg-white border-2 rounded-2xl p-5 transition-all ${addons.dailyWellbeing ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-gray-900">Daily Wellbeing</h3>
                    <p className="text-gray-500 text-sm mt-1">CLARA checks in daily. Tracks mood, sleep & pain. Sends digest to family.</p>
                    <span className="text-red-600 font-semibold text-sm">€2.99/month</span>
                  </div>
                  <button onClick={() => setAddons(a => ({ ...a, dailyWellbeing: !a.dailyWellbeing }))} className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${addons.dailyWellbeing ? 'bg-red-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${addons.dailyWellbeing ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className={`bg-white border-2 rounded-2xl p-5 transition-all ${addons.medicationReminder ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-gray-900">Medication Reminder</h3>
                    <p className="text-gray-500 text-sm mt-1">CLARA reminds you to take medication. Logs it. Alerts family if missed.</p>
                    <span className="text-red-600 font-semibold text-sm">€2.99/month</span>
                  </div>
                  <button onClick={() => setAddons(a => ({ ...a, medicationReminder: !a.medicationReminder }))} className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${addons.medicationReminder ? 'bg-red-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${addons.medicationReminder ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {claraComplete && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <Star className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-800">🎉 CLARA Complete unlocked!</p>
                  <p className="text-green-600 text-sm">Weekly AI wellbeing reports included — no extra charge</p>
                </div>
              </div>
            )}

            {plan === 'individual' && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="font-semibold text-gray-700 mb-3">Order summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Individual Plan ({billing === 'year' ? 'annual' : 'monthly'})</span>
                    <span>€{billing === 'year' ? '99.90' : '9.99'}</span>
                  </div>
                  {addons.dailyWellbeing && <div className="flex justify-between text-sm text-gray-600"><span>Daily Wellbeing</span><span>€2.99</span></div>}
                  {addons.medicationReminder && <div className="flex justify-between text-sm text-gray-600"><span>Medication Reminder</span><span>€2.99</span></div>}
                  {addons.familyLinks > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Family Links ×{addons.familyLinks}</span><span>€{(addons.familyLinks * 2.99).toFixed(2)}</span></div>}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>€{total.toFixed(2)}/{billing === 'year' ? 'year' : 'month'}</span>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={() => setStep(3)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl mb-3">Continue →</Button>
            <button onClick={() => setStep(1)} className="text-gray-400 text-sm mx-auto block hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* ── STEP 3: YOUR DETAILS ── */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Your details</h1>
              <p className="text-gray-500">Create your account to get started</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              {whoFor === 'family' && (
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Who are you protecting?</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Their name *</Label>
                      <Input value={protectedName} onChange={e => setProtectedName(e.target.value)} placeholder="e.g. Margaret" className="mt-1" />
                    </div>
                    <div>
                      <Label>Their email <span className="text-gray-400 font-normal ml-1">(optional — for invite)</span></Label>
                      <Input type="email" value={protectedEmail} onChange={e => setProtectedEmail(e.target.value)} placeholder="margaret@email.com" className="mt-1" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>Your full name *</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="mt-1" />
              </div>
              <div>
                <Label>Email address *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1" />
              </div>
              <div>
                <Label>Password *</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className="mt-1" />
              </div>
              <div>
                <Label>Phone number <span className="text-gray-400 font-normal ml-1">(optional)</span></Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 612 345 678" className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">For WhatsApp updates from CLARA</p>
              </div>

              <div>
                <button onClick={() => setShowReferral(!showReferral)} className="text-sm text-red-500 hover:text-red-600 font-medium">Have a referral code? +</button>
                {showReferral && (
                  <div className="mt-2">
                    <Input value={referralCode} onChange={e => { setReferralCode(e.target.value); checkReferral(e.target.value) }} placeholder="e.g. CLARA4X8K" />
                    {referralCode && <p className={`text-xs mt-1 ${referralValid ? 'text-green-600' : 'text-red-500'}`}>{referralValid ? '✅ Referral applied!' : '❌ Code not found'}</p>}
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-3 border-t border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={gdpr1} onChange={e => setGdpr1(e.target.checked)} className="mt-0.5 accent-red-500" />
                  <span className="text-sm text-gray-600">
                    I agree to the <a href="/privacy" className="text-red-500 underline" target="_blank" rel="noreferrer">Privacy Policy</a> and <a href="/terms" className="text-red-500 underline" target="_blank" rel="noreferrer">Terms of Service</a> *
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={gdpr2} onChange={e => setGdpr2(e.target.checked)} className="mt-0.5 accent-red-500" />
                  <span className="text-sm text-gray-600">I consent to receive safety-related emails from LifeLink Sync *</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={gdpr3} onChange={e => setGdpr3(e.target.checked)} className="mt-0.5 accent-red-500" />
                  <span className="text-sm text-gray-600">I'd like to receive news and offers (optional)</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleCreateAccount}
              disabled={isLoading || !fullName || !email || !password || !gdpr1 || !gdpr2}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl mt-6 text-base font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Creating your account...</span>
              ) : 'Create My Account →'}
            </Button>
            <button onClick={() => setStep(2)} className="mt-4 text-gray-400 text-sm mx-auto block hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* ── STEP 4: CHECK YOUR EMAIL ── */}
        {step === 4 && (
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-12 h-12 text-blue-500" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Check your email
            </h1>

            <p className="text-gray-500 mb-2 max-w-md mx-auto">
              We've sent a confirmation link to:
            </p>

            <p className="text-lg font-semibold text-gray-900 mb-6">
              {emailSentTo || email}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 max-w-md mx-auto text-left">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold text-lg mt-0.5">1</span>
                  <p className="text-gray-700 text-sm">Open your email inbox</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold text-lg mt-0.5">2</span>
                  <p className="text-gray-700 text-sm">Click the confirmation link from LifeLink Sync</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold text-lg mt-0.5">3</span>
                  <p className="text-gray-700 text-sm">You'll be brought back here to finish setup</p>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Don't see it? Check your spam folder.
            </p>

            <button
              onClick={handleResendEmail}
              disabled={resendCooldown > 0}
              className="inline-flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend confirmation email'}
            </button>
          </div>
        )}

        {/* ── STEP 5: PAYMENT (individual plan only) ── */}
        {step === 5 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Start your free trial</h1>
              <p className="text-gray-500">You won't be charged until your 7-day trial ends</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <p className="text-amber-800 text-sm">
                <strong>Trial starts today.</strong> First charge of €{total.toFixed(2)} on {new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
              <p className="font-semibold text-gray-700 mb-4">Order summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Individual Plan ({billing === 'year' ? 'annual' : 'monthly'})</span>
                  <span>€{billing === 'year' ? '99.90' : '9.99'}</span>
                </div>
                {addons.dailyWellbeing && <div className="flex justify-between text-sm text-gray-600"><span>Daily Wellbeing</span><span>€2.99</span></div>}
                {addons.medicationReminder && <div className="flex justify-between text-sm text-gray-600"><span>Medication Reminder</span><span>€2.99</span></div>}
                {addons.familyLinks > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Family Links ×{addons.familyLinks}</span><span>€{(addons.familyLinks * 2.99).toFixed(2)}</span></div>}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total after trial</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={async () => {
                setIsLoading(true)
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                    body: {
                      user_id: user?.id || userId,
                      plan: 'individual',
                      billing_interval: billing,
                      addons,
                      trial_period_days: 7,
                    }
                  })
                  if (error) throw error
                  if (data?.url) {
                    window.location.href = data.url
                  } else {
                    setStep(6)
                  }
                } catch {
                  setStep(6)
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-base font-semibold mb-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Setting up payment...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" />Start My Free Trial →</span>
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center">Secured by Stripe · No charge for 7 days</p>
            <button onClick={() => setStep(3)} className="mt-4 text-gray-400 text-sm mx-auto block hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* ── STEP 6: ALL SET ── */}
        {step === 6 && (
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-12 h-12 text-green-500" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              You're protected! 🛡️
            </h1>

            <p className="text-gray-500 mb-2">
              Welcome to LifeLink Sync{fullName ? `, ${fullName.split(' ')[0]}` : ''}.
            </p>

            {whoFor === 'family' && protectedEmail && (
              <p className="text-sm text-gray-400 mb-8">📧 Invite sent to {protectedName}</p>
            )}

            <div className="grid gap-4 mb-8 text-left mt-8">
              {[
                { emoji: '👥', title: 'Add emergency contacts', desc: 'Who should CLARA alert?', path: '/member-dashboard/profile' },
                { emoji: '🏥', title: 'Set up medical profile', desc: 'Blood type, allergies, medications', path: '/member-dashboard/profile' },
                { emoji: '📱', title: 'Get the app', desc: 'Install CLARA on your phone', path: '/member-dashboard/products' },
              ].map(item => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-red-300 hover:shadow-sm transition-all text-left"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              ))}
            </div>

            <Button
              onClick={() => navigate('/member-dashboard')}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-base font-semibold"
            >
              Go to my dashboard →
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
