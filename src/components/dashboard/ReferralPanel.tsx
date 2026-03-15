import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Copy, Mail, MessageCircle, Star, Gift, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ReferralData {
  referralCode: string;
  activeCount: number;
  totalReferred: number;
  rewardApplied: boolean;
}

const REQUIRED_REFERRALS = 5;

export default function ReferralPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData>({
    referralCode: '',
    activeCount: 0,
    totalReferred: 0,
    rewardApplied: false,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchReferralData();
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;
    setLoading(false);

    try {
      // Try to get referral code from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      // Try to count referrals (table may not exist yet)
      let activeCount = 0;
      let totalReferred = 0;
      let rewardApplied = false;

      try {
        const { data: referrals, error } = await (supabase as any)
          .from('referrals')
          .select('id, status, reward_applied')
          .eq('referrer_user_id', user.id);

        if (!error && referrals) {
          totalReferred = referrals.length;
          activeCount = referrals.filter(
            (r: any) => r.status === 'active' || r.status === 'subscribed'
          ).length;
          rewardApplied = referrals.some((r: any) => r.reward_applied);
        }
      } catch {
        // Table doesn't exist yet — show panel with 0 referrals
      }

      const code = profile?.referral_code || generateFallbackCode(user.id);

      setData({ referralCode: code, activeCount, totalReferred, rewardApplied });
    } catch {
      // Profiles query failed — generate fallback
      setData(prev => ({
        ...prev,
        referralCode: generateFallbackCode(user?.id || ''),
      }));
    }
  };

  const generateFallbackCode = (userId: string): string => {
    const hash = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
    return `CLARA${hash}`;
  };

  const shareUrl = `https://lifelink-sync.com/join?ref=${data.referralCode}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: t('referral.linkCopied', { defaultValue: 'Link copied!' }),
        description: t('referral.linkCopiedDesc', { defaultValue: 'Share it with friends and family.' }),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl, toast, t]);

  const handleWhatsApp = useCallback(() => {
    const message = t('referral.whatsappMessage', {
      defaultValue: 'Join LifeLink Sync — 24/7 AI emergency protection for you and your family. Use my referral link: {{url}}',
      url: shareUrl,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }, [shareUrl, t]);

  const handleEmail = useCallback(() => {
    const subject = t('referral.emailSubject', {
      defaultValue: 'I want you to have CLARA — 24/7 emergency protection',
    });
    const body = t('referral.emailBody', {
      defaultValue: 'Hi,\n\nI use LifeLink Sync for 24/7 AI emergency protection and I think you should too. CLARA keeps me safe and connected to my family.\n\nSign up with my link and we both benefit:\n{{url}}\n\nStay safe!',
      url: shareUrl,
    });
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
  }, [shareUrl, t]);

  // Trigger celebration when user first sees 5 gold stars
  useEffect(() => {
    if (data.activeCount >= REQUIRED_REFERRALS && !celebrating) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [data.activeCount]);

  const starsComplete = data.activeCount >= REQUIRED_REFERRALS;

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('referral.pageTitle', { defaultValue: 'Refer & Earn' })}
        </h1>
        <p className="text-muted-foreground">
          {t('referral.pageSubtitle', { defaultValue: 'Share LifeLink Sync and earn a free year' })}
        </p>
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
              <Gift className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {t('referral.title', { defaultValue: 'Refer Friends, Earn a Free Year' })}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('referral.subtitle', { defaultValue: 'Refer 5 friends who subscribe and get 12 months free' })}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 5 Stars Display */}
          <div className="text-center">
            <div className="flex justify-center gap-3 sm:gap-4 mb-4">
              {Array.from({ length: REQUIRED_REFERRALS }).map((_, i) => {
                const isGold = i < data.activeCount;
                return (
                  <div
                    key={i}
                    className={cn(
                      'relative transition-all duration-700 ease-out',
                      isGold ? 'scale-110' : 'scale-100',
                      celebrating && isGold && 'animate-bounce',
                    )}
                    style={{
                      animationDelay: celebrating ? `${i * 100}ms` : undefined,
                    }}
                  >
                    <Star
                      className={cn(
                        'h-10 w-10 sm:h-12 sm:w-12 transition-all duration-700',
                        isGold
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'text-gray-300 dark:text-gray-600 fill-gray-200 dark:fill-gray-700',
                      )}
                    />
                    {isGold && (
                      <div className="absolute inset-0 animate-pulse">
                        <Star className="h-10 w-10 sm:h-12 sm:w-12 text-amber-300/30 fill-amber-300/20 blur-sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-lg font-semibold">
              {t('referral.progress', {
                defaultValue: '{{count}} of {{total}} active referrals',
                count: data.activeCount,
                total: REQUIRED_REFERRALS,
              })}
            </p>
          </div>

          {/* Nudge Banners */}
          {data.activeCount === REQUIRED_REFERRALS - 1 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
              <p className="text-amber-800 dark:text-amber-200 font-semibold text-lg">
                {t('referral.almostThere', { defaultValue: 'One more person and your next year is free!' })}
              </p>
              <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">
                {t('referral.almostThereDesc', { defaultValue: 'Share your link below — you are so close!' })}
              </p>
            </div>
          )}

          {starsComplete && (
            <div className={cn(
              'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center transition-all duration-500',
              celebrating && 'ring-2 ring-green-400 ring-offset-2',
            )}>
              <p className="text-green-800 dark:text-green-200 font-bold text-lg">
                🎉 {t('referral.complete', { defaultValue: '12 months free — applied to your account!' })}
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                {t('referral.completeDesc', { defaultValue: 'Thank you for spreading the word. Keep sharing to help more people stay safe.' })}
              </p>
            </div>
          )}

          {/* Share Section */}
          <div className="space-y-3">
            <p className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              {t('referral.yourLink', { defaultValue: 'Your referral link' })}
            </p>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 border">
              <code className="flex-1 text-sm truncate select-all">{shareUrl}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 min-w-[90px]"
              >
                {copied ? (
                  <><Check className="h-4 w-4 mr-1" /> {t('referral.copied', { defaultValue: 'Copied' })}</>
                ) : (
                  <><Copy className="h-4 w-4 mr-1" /> {t('referral.copyLink', { defaultValue: 'Copy' })}</>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:hover:bg-green-950/50 dark:text-green-400 dark:border-green-800"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
                {t('referral.shareWhatsApp', { defaultValue: 'WhatsApp' })}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleEmail}
              >
                <Mail className="h-4 w-4" />
                {t('referral.shareEmail', { defaultValue: 'Email' })}
              </Button>
            </div>
          </div>

          {/* How It Works Accordion */}
          <Accordion type="single" collapsible>
            <AccordionItem value="how-it-works" className="border rounded-xl px-4">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                {t('referral.howItWorks', { defaultValue: 'How it works' })}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pb-2">
                  {[
                    {
                      step: '1',
                      title: t('referral.step1Title', { defaultValue: 'Share your link' }),
                      desc: t('referral.step1Desc', { defaultValue: 'Send your unique referral link to friends and family via WhatsApp, email, or any way you like.' }),
                    },
                    {
                      step: '2',
                      title: t('referral.step2Title', { defaultValue: 'Friend signs up & subscribes' }),
                      desc: t('referral.step2Desc', { defaultValue: 'When they sign up using your link and start a paid subscription, your referral counts.' }),
                    },
                    {
                      step: '3',
                      title: t('referral.step3Title', { defaultValue: 'Star turns gold' }),
                      desc: t('referral.step3Desc', { defaultValue: 'Each active referral lights up a star. Watch your progress grow!' }),
                    },
                    {
                      step: '4',
                      title: t('referral.step4Title', { defaultValue: 'All 5 gold = free year!' }),
                      desc: t('referral.step4Desc', { defaultValue: '12 months of LifeLink Sync is automatically added to your account. No action needed.' }),
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                        {item.step}
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
