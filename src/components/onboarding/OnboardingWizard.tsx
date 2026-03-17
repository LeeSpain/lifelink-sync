import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Shield, Check, ChevronRight, Plus, Minus,
  Loader2, Lock, Star, Mail, RefreshCw, RotateCcw,
  User, Heart, Gift
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

const features = ['Full CLARA AI', 'SOS — app, pendant & voice', 'Up to 5 emergency contacts', 'Live GPS sharing', 'Medical profile', 'Conference bridge', 'Tablet dashboard', '1 Family Link FREE']
const trialFeatures = ['All features included', 'No credit card needed', 'Cancel anytime', 'Upgrade anytime']

const nextSteps = [
  { emoji: '👥', title: 'Add emergency contacts', desc: 'Who should CLARA alert?', path: '/member-dashboard/profile' },
  { emoji: '🏥', title: 'Set up medical profile', desc: 'Blood type, allergies, medications', path: '/member-dashboard/profile' },
  { emoji: '📱', title: 'Get the app', desc: 'Install CLARA on your phone', path: '/member-dashboard/products' },
]

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(0)
  const [whoFor, setWhoFor] = useState<WhoFor>(null)
  const [plan, setPlan] = useState<Plan>('individual')
  const [billing, setBilling] = useState<Billing>('month')
  const [addons, setAddons] = useState<Addons>({ familyLinks: 0, dailyWellbeing: false, medicationReminder: false })
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
  const [userId, setUserId] = useState<string | null>(null)
  const [emailSentTo, setEmailSentTo] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Navigation helpers — trial skips add-ons (step 2)
  const getPrevStep = (current: number) => {
    if (current === 3 && plan === 'trial') return 1
    return current - 1
  }

  const getStepLabel = (current: number) => {
    if (plan === 'trial') {
      const labels: Record<number, string> = { 0: 'Who is this for', 1: 'Choose your plan', 3: 'Your details', 4: 'Confirm email', 6: 'All set' }
      return labels[current] || ''
    }
    const labels: Record<number, string> = { 0: 'Who is this for', 1: 'Choose your plan', 2: 'Add-ons', 3: 'Your details', 4: 'Confirm email', 5: 'Payment', 6: 'All set' }
    return labels[current] || ''
  }

  const getStepNumber = (current: number) => {
    if (plan === 'trial') {
      const map: Record<number, number> = { 1: 2, 3: 3, 4: 4, 6: 5 }
      return map[current] || 1
    }
    const map: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 }
    return map[current] || 1
  }

  const totalSteps = plan === 'trial' ? 5 : 7

  // Progress percentage
  const progressPct = step === 0 ? 0 : Math.round((getStepNumber(step) / totalSteps) * 100)

  // Restore state after email confirmation redirect
  useEffect(() => {
    const confirmed = searchParams.get('confirmed')
    if (confirmed === 'true') {
      const saved = localStorage.getItem(WIZARD_STATE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          setWhoFor(state.whoFor); setPlan(state.plan); setBilling(state.billing)
          setAddons(state.addons); setFullName(state.fullName); setEmail(state.email)
          setPhone(state.phone); setProtectedName(state.protectedName || '')
          setProtectedEmail(state.protectedEmail || ''); setReferralCode(state.referralCode || '')
          if (state.plan === 'trial') { activateTrialAndComplete() } else { setStep(5) }
        } catch { setStep(6) }
        localStorage.removeItem(WIZARD_STATE_KEY)
        return
      }
      setStep(6); return
    }
    if (searchParams.get('plan') === 'trial') setPlan('trial')
    if (searchParams.get('billing') === 'annual') setBilling('year')
    if (searchParams.get('for') === 'family') { setWhoFor('family'); setStep(1) }
    const ref = searchParams.get('ref')
    if (ref) { setReferralCode(ref); setShowReferral(true) }
  }, [])

  const activateTrialAndComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        await supabase.functions.invoke('activate-trial', { body: { user_id: user.id } })
        setUserId(user.id)
      }
    } catch { /* best effort */ }
    setStep(6)
  }

  useEffect(() => { if (step === 6) markOnboardingComplete() }, [step])

  const markOnboardingComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        await supabase.from('profiles')
          .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
      }
    } catch { /* best effort */ }
  }

  const basePrice = billing === 'year' ? 99.90 : 9.99
  const addonTotal = (addons.dailyWellbeing ? 2.99 : 0) + (addons.medicationReminder ? 2.99 : 0) + (addons.familyLinks * 2.99)
  const total = plan === 'trial' ? 0 : basePrice + addonTotal
  const claraComplete = addons.dailyWellbeing && addons.medicationReminder
  const firstName = fullName.split(' ')[0] || ''

  const checkReferral = async (code: string) => {
    if (!code) return
    const { data } = await supabase.from('profiles').select('id').eq('referral_code', code).single()
    setReferralValid(!!data)
  }

  const saveWizardState = () => {
    localStorage.setItem(WIZARD_STATE_KEY, JSON.stringify({
      whoFor, plan, billing, addons, fullName, email, phone, protectedName, protectedEmail, referralCode,
    }))
  }

  const handleCreateAccount = async () => {
    if (!gdpr1 || !gdpr2) { toast.error('Please accept the required terms'); return }
    setIsLoading(true)
    try {
      saveWizardState()
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding?confirmed=true`,
          data: { full_name: fullName, phone, who_for: whoFor, protected_person_name: protectedName }
        }
      })
      if (error) throw error
      setUserId(data.user?.id || null)
      setEmailSentTo(email)
      setStep(4)
    } catch (error: any) {
      toast.error(error.message || 'Could not create account')
      localStorage.removeItem(WIZARD_STATE_KEY)
    } finally { setIsLoading(false) }
  }

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup', email: emailSentTo || email,
        options: { emailRedirectTo: `${window.location.origin}/onboarding?confirmed=true` }
      })
      if (error) throw error
      toast.success('Confirmation email resent!')
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
      }, 1000)
    } catch (error: any) { toast.error(error.message || 'Could not resend email') }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#f8fafc',
        backgroundImage: 'radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }}
    >
      <Navigation />

      <div className="max-w-xl mx-auto px-4 pt-24 pb-16">

        {/* ── Wizard Card ── */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-300/40 border border-gray-100/80 ring-1 ring-black/5 overflow-hidden">

          {/* Red accent line at top */}
          <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />

          {/* Progress bar */}
          {step > 0 && step < 6 && (
            <>
              <div className="h-1 bg-gray-100">
                <div className="h-1 bg-red-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="px-8 pt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Step {getStepNumber(step)} of {totalSteps}</span>
                <span className="text-xs font-medium text-gray-400">{getStepLabel(step)}</span>
              </div>
            </>
          )}

          {/* ── STEP 0: WHO IS THIS FOR ── */}
          {step === 0 && (
            <div key={0} className="wizard-step">
              <div className="px-8 pt-8 pb-6 text-center border-b border-gray-50">
                <div className="inline-flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">LifeLink Sync</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Who are you setting this up for?</h1>
                <p className="text-sm text-gray-500 mb-2">Your answer helps us personalise your experience. Takes 2 minutes.</p>
              </div>
              <div className="px-8 py-8 space-y-3">
                {/* For myself */}
                <button onClick={() => { setWhoFor('myself'); setStep(1) }} className="w-full group flex items-center gap-4 p-5 rounded-2xl border border-gray-200 bg-white hover:border-red-400 hover:shadow-md hover:shadow-red-500/10 transition-all duration-200 text-left relative">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pr-10">
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-red-700">Protect myself</p>
                    <p className="text-xs text-gray-400 mt-0.5">Set up CLARA for your own safety and peace of mind</p>
                  </div>
                  <div className="absolute right-5 w-8 h-8 rounded-full bg-gray-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                  </div>
                </button>

                {/* For someone I love */}
                <button onClick={() => { setWhoFor('family'); setStep(1) }} className="w-full group flex items-center gap-4 p-5 rounded-2xl border border-gray-200 bg-white hover:border-red-400 hover:shadow-md hover:shadow-red-500/10 transition-all duration-200 text-left relative">
                  <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pr-10">
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-red-700">Protect a loved one</p>
                    <p className="text-xs text-gray-400 mt-0.5">Set up and manage CLARA for a parent, partner or family member</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2.5 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-200">Guardian account</span>
                  </div>
                  <div className="absolute right-5 w-8 h-8 rounded-full bg-gray-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                  </div>
                </button>

                {/* As a gift */}
                <button onClick={() => navigate('/gift')} className="w-full group flex items-center gap-4 p-5 rounded-2xl border border-gray-200 bg-white hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-200 text-left relative">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pr-10">
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-amber-700">Give as a gift</p>
                    <p className="text-xs text-gray-400 mt-0.5">Buy a gift subscription — they set it up themselves</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">No account needed</span>
                  </div>
                  <div className="absolute right-5 w-8 h-8 rounded-full bg-gray-50 group-hover:bg-amber-50 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: CHOOSE PLAN ── */}
          {step === 1 && (
            <div key={1} className="wizard-step">
              <div className="px-8 pt-6 pb-0">
                <button onClick={() => setStep(0)} className="text-xs text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">← Back</button>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Choose your plan</h2>
                <p className="text-sm text-gray-500">Every plan includes a 7-day free trial</p>
              </div>

              <div className="mx-8 my-6 flex rounded-xl bg-gray-100 p-1">
                <button onClick={() => setBilling('month')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${billing === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Monthly</button>
                <button onClick={() => setBilling('year')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${billing === 'year' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  Annual
                  {billing === 'year' && <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">-17%</span>}
                </button>
              </div>

              <div className="px-8 pb-8 space-y-3">
                {/* Individual Plan */}
                <div onClick={() => { setPlan('individual'); setStep(2) }} className="cursor-pointer rounded-2xl border-2 border-gray-100 p-5 hover:border-red-400 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -translate-y-16 translate-x-16 group-hover:bg-red-100 transition-colors" />
                  <div className="flex items-start justify-between relative">
                    <div>
                      <p className="font-bold text-gray-900">Individual Plan</p>
                      <p className="text-xs text-gray-400 mt-0.5">Full protection, all features</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">€{billing === 'year' ? '99.90' : '9.99'}</p>
                      <p className="text-xs text-gray-400">per {billing === 'year' ? 'year' : 'month'}</p>
                    </div>
                  </div>
                  {billing === 'year' && <div className="mt-2 inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-200">✨ 2 months FREE — save €19.98</div>}
                  <div className="mt-4 grid grid-cols-2 gap-1.5 relative">
                    {features.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-green-600" /></div>
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between relative">
                    <span className="text-xs text-gray-400">7-day free trial included</span>
                    <span className="flex items-center gap-1 text-red-500 text-sm font-medium group-hover:gap-2 transition-all">Select <ChevronRight className="w-4 h-4" /></span>
                  </div>
                </div>

                {/* Free Trial — skips add-ons, goes straight to details */}
                <div onClick={() => { setPlan('trial'); setStep(3) }} className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 p-5 hover:border-gray-300 transition-all group bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">Free Trial</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try everything free for 7 days</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200">NO CARD</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {trialFeatures.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Check className="w-3 h-3 text-blue-400 flex-shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">Upgrade anytime during or after trial <ChevronRight className="w-3 h-3" /></p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: ADD-ONS (individual plan only) ── */}
          {step === 2 && (
            <div key={2} className="wizard-step">
              <div className="px-8 pt-6">
                <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">← Back</button>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Enhance your protection</h2>
                <p className="text-sm text-gray-500 mb-6">Powerful extras. Cancel anytime.</p>
              </div>

              <div className="px-8 space-y-3">
                {/* Family Links */}
                <div className="rounded-2xl border-2 border-gray-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-lg">👨‍👩‍👧</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-900">Family Links</p>
                        <span className="text-xs font-semibold text-gray-400">€2.99/link</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Extra family members who receive your SOS alerts</p>
                      <p className="text-xs text-green-600 mt-1">1st link already FREE with your plan</p>
                      <div className="flex items-center gap-3 mt-3">
                        <button onClick={() => setAddons(a => ({ ...a, familyLinks: Math.max(0, a.familyLinks - 1) }))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-6 text-center font-bold text-sm">{addons.familyLinks}</span>
                        <button onClick={() => setAddons(a => ({ ...a, familyLinks: Math.min(10, a.familyLinks + 1) }))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        <span className="text-gray-400 text-xs">extra links</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Wellbeing */}
                <div className={`rounded-2xl border-2 transition-all duration-200 ${addons.dailyWellbeing ? 'border-red-400 bg-red-50/30' : 'border-gray-100 bg-white'}`}>
                  <div className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors text-lg ${addons.dailyWellbeing ? 'bg-red-100' : 'bg-gray-50'}`}>💛</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-sm ${addons.dailyWellbeing ? 'text-red-800' : 'text-gray-900'}`}>Daily Wellbeing</p>
                        <button onClick={() => setAddons(a => ({ ...a, dailyWellbeing: !a.dailyWellbeing }))} className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${addons.dailyWellbeing ? 'bg-red-500' : 'bg-gray-200'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${addons.dailyWellbeing ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">CLARA checks in daily. Tracks mood, sleep & pain. Sends digest to family.</p>
                      <span className={`text-xs font-semibold ${addons.dailyWellbeing ? 'text-red-600' : 'text-gray-400'}`}>€2.99/month</span>
                    </div>
                  </div>
                </div>

                {/* Medication Reminder */}
                <div className={`rounded-2xl border-2 transition-all duration-200 ${addons.medicationReminder ? 'border-red-400 bg-red-50/30' : 'border-gray-100 bg-white'}`}>
                  <div className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors text-lg ${addons.medicationReminder ? 'bg-red-100' : 'bg-gray-50'}`}>💊</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-sm ${addons.medicationReminder ? 'text-red-800' : 'text-gray-900'}`}>Medication Reminder</p>
                        <button onClick={() => setAddons(a => ({ ...a, medicationReminder: !a.medicationReminder }))} className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${addons.medicationReminder ? 'bg-red-500' : 'bg-gray-200'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${addons.medicationReminder ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">CLARA reminds you to take medication. Logs it. Alerts family if missed.</p>
                      <span className={`text-xs font-semibold ${addons.medicationReminder ? 'text-red-600' : 'text-gray-400'}`}>€2.99/month</span>
                    </div>
                  </div>
                </div>
              </div>

              {claraComplete && (
                <div className="mx-8 mt-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-sm font-bold text-green-800">CLARA Complete unlocked!</p>
                    <p className="text-xs text-green-600">Weekly AI wellbeing reports — included at no extra charge</p>
                  </div>
                </div>
              )}

              <div className="mx-8 mt-4 bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Order summary</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-600"><span>Individual Plan ({billing === 'year' ? 'annual' : 'monthly'})</span><span>€{billing === 'year' ? '99.90' : '9.99'}</span></div>
                  {addons.dailyWellbeing && <div className="flex justify-between text-xs text-gray-600"><span>Daily Wellbeing</span><span>€2.99</span></div>}
                  {addons.medicationReminder && <div className="flex justify-between text-xs text-gray-600"><span>Medication Reminder</span><span>€2.99</span></div>}
                  {addons.familyLinks > 0 && <div className="flex justify-between text-xs text-gray-600"><span>Family Links ×{addons.familyLinks}</span><span>€{(addons.familyLinks * 2.99).toFixed(2)}</span></div>}
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-sm font-bold text-red-600">€{total.toFixed(2)}/{billing === 'year' ? 'yr' : 'mo'}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6">
                <Button onClick={() => setStep(3)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-semibold text-sm shadow-lg shadow-red-500/25 transition-all hover:shadow-red-500/40">
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: YOUR DETAILS ── */}
          {step === 3 && (
            <div key={3} className="wizard-step px-8 py-6">
              <button onClick={() => setStep(getPrevStep(3))} className="text-xs text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">← Back</button>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Your details</h2>
              <p className="text-sm text-gray-500 mb-6">Create your account to get started</p>

              <div className="space-y-4">
                {whoFor === 'family' && (
                  <div className="pb-4 border-b border-gray-100 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Who are you protecting?</p>
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 block">Their name *</Label>
                      <Input value={protectedName} onChange={e => setProtectedName(e.target.value)} placeholder="e.g. Margaret" className="rounded-xl border-gray-200 focus:border-red-400 focus:ring-red-400/20 h-11 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 block">Their email <span className="text-gray-400 font-normal normal-case">(optional)</span></Label>
                      <Input type="email" value={protectedEmail} onChange={e => setProtectedEmail(e.target.value)} placeholder="margaret@email.com" className="rounded-xl border-gray-200 focus:border-red-400 focus:ring-red-400/20 h-11 text-sm" />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 block">Full name *</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="rounded-xl border-gray-200 focus:border-red-400 focus:ring-red-400/20 h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 block">Email address *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="rounded-xl border-gray-200 focus:border-red-400 focus:ring-red-400/20 h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 block">Password *</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className="rounded-xl border-gray-200 focus:border-red-400 focus:ring-red-400/20 h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5 block">Phone <span className="text-gray-400 font-normal normal-case">(optional)</span></Label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 612 345 678" className="rounded-xl border-gray-200 focus:border-red-400 focus:ring-red-400/20 h-11 text-sm" />
                  <p className="text-xs text-gray-400 mt-1">For WhatsApp updates from CLARA</p>
                </div>

                <div>
                  <button onClick={() => setShowReferral(!showReferral)} className="text-xs text-red-500 hover:text-red-600 font-semibold">Have a referral code? +</button>
                  {showReferral && (
                    <div className="mt-2">
                      <Input value={referralCode} onChange={e => { setReferralCode(e.target.value); checkReferral(e.target.value) }} placeholder="e.g. CLARA4X8K" className="rounded-xl border-gray-200 h-11 text-sm" />
                      {referralCode && <p className={`text-xs mt-1 ${referralValid ? 'text-green-600' : 'text-red-500'}`}>{referralValid ? '✅ Referral applied!' : '❌ Code not found'}</p>}
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-3 border-t border-gray-100">
                  {[
                    { checked: gdpr1, set: setGdpr1, label: <>I agree to the <a href="/privacy" className="text-red-500 underline" target="_blank" rel="noreferrer">Privacy Policy</a> and <a href="/terms" className="text-red-500 underline" target="_blank" rel="noreferrer">Terms</a> *</> },
                    { checked: gdpr2, set: setGdpr2, label: 'I consent to receive safety-related emails *' },
                    { checked: gdpr3, set: setGdpr3, label: 'I\'d like to receive news and offers (optional)' },
                  ].map((item, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer group">
                      <div
                        onClick={() => item.set(!item.checked)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${item.checked ? 'bg-red-500 border-red-500' : 'border-gray-300 group-hover:border-red-400'}`}
                      >
                        {item.checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs text-gray-600 leading-relaxed">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateAccount}
                disabled={isLoading || !fullName || !email || !password || !gdpr1 || !gdpr2}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-red-500/25 mt-6"
              >
                {isLoading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating your account...</span>
                  : 'Create My Account →'}
              </Button>
              <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1"><Lock className="w-3 h-3" />Secured with SSL encryption</p>
            </div>
          )}

          {/* ── STEP 4: CHECK YOUR EMAIL ── */}
          {step === 4 && (
            <div key={4} className="wizard-step px-8 py-10 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-1">We've sent a confirmation link to:</p>
              <p className="text-base font-semibold text-gray-900 mb-6">{emailSentTo || email}</p>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-left max-w-sm mx-auto">
                {[
                  'Open your email inbox',
                  'Click the confirmation link from LifeLink Sync',
                  "You'll be brought back here to finish setup",
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
                    <span className="text-blue-500 font-bold text-sm mt-0.5 flex-shrink-0">{i + 1}</span>
                    <p className="text-gray-700 text-xs">{s}</p>
                  </div>
                ))}
              </div>

              <p className="text-gray-400 text-xs mb-4">Don't see it? Check your spam folder.</p>
              <button onClick={handleResendEmail} disabled={resendCooldown > 0} className="inline-flex items-center gap-2 text-xs text-red-600 font-medium hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend confirmation email'}
              </button>
            </div>
          )}

          {/* ── STEP 5: PAYMENT ── */}
          {step === 5 && (
            <div key={5} className="wizard-step">
              <div className="px-8 pt-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Start your free trial</h2>
                <p className="text-sm text-gray-500">You won't be charged until your 7-day trial ends</p>
              </div>

              <div className="mx-8 mt-6 mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span className="text-xl flex-shrink-0">⏰</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Trial starts today — free for 7 days</p>
                  <p className="text-xs text-amber-600 mt-0.5">First charge of €{total.toFixed(2)} on {new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}. Cancel anytime before then.</p>
                </div>
              </div>

              <div className="mx-8 bg-gray-50 rounded-2xl p-4 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Order summary</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-600"><span>Individual Plan ({billing === 'year' ? 'annual' : 'monthly'})</span><span>€{billing === 'year' ? '99.90' : '9.99'}</span></div>
                  {addons.dailyWellbeing && <div className="flex justify-between text-xs text-gray-600"><span>Daily Wellbeing</span><span>€2.99</span></div>}
                  {addons.medicationReminder && <div className="flex justify-between text-xs text-gray-600"><span>Medication Reminder</span><span>€2.99</span></div>}
                  {addons.familyLinks > 0 && <div className="flex justify-between text-xs text-gray-600"><span>Family Links ×{addons.familyLinks}</span><span>€{(addons.familyLinks * 2.99).toFixed(2)}</span></div>}
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900"><span>Total after trial</span><span className="text-red-600">€{total.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="px-8 pb-8">
                <Button
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      const { data: { user } } = await supabase.auth.getUser()
                      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                        body: { user_id: user?.id || userId, plan: 'individual', billing_interval: billing, addons, trial_period_days: 7 }
                      })
                      if (error) throw error
                      if (data?.url) { window.location.href = data.url } else { setStep(6) }
                    } catch { setStep(6) } finally { setIsLoading(false) }
                  }}
                  disabled={isLoading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-red-500/25"
                >
                  {isLoading
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Setting up payment...</span>
                    : <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" />Start My Free Trial →</span>}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-3">Powered by Stripe · Bank-level security</p>
              </div>
            </div>
          )}

          {/* ── STEP 6: ALL SET ── */}
          {step === 6 && (
            <div key={6} className="wizard-step px-8 py-10 text-center">
              <div className="relative inline-flex mb-6">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                  <Shield className="w-12 h-12 text-red-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">You're protected! 🛡️</h2>
              <p className="text-sm text-gray-500 mb-8">Welcome to LifeLink Sync{firstName ? `, ${firstName}` : ''}. CLARA is now watching over you.</p>

              {whoFor === 'family' && protectedEmail && (
                <p className="text-xs text-gray-400 mb-6">📧 Invite sent to {protectedName}</p>
              )}

              <div className="space-y-3 mb-8">
                {nextSteps.map(item => (
                  <button key={item.title} onClick={() => navigate(item.path)} className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:border-red-200 border border-gray-100 transition-all group text-left">
                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-xl flex-shrink-0 group-hover:border-red-200">{item.emoji}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-red-700">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              <Button onClick={() => navigate('/member-dashboard')} className="w-full bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-semibold">
                Go to my dashboard →
              </Button>
            </div>
          )}
        </div>

        {/* ── Trust signals ── */}
        <div className="flex items-center justify-center gap-6 mt-6 flex-wrap px-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-400"><Lock className="w-3.5 h-3.5" />SSL Secured</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400"><Shield className="w-3.5 h-3.5" />GDPR Compliant</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400"><Star className="w-3.5 h-3.5" />7-day free trial</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400"><RotateCcw className="w-3.5 h-3.5" />Cancel anytime</span>
        </div>
      </div>
    </div>
  )
}
