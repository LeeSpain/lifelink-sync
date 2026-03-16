import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Clock, Shield, Package, Heart, ChevronRight, Lock, Mail, RotateCcw } from 'lucide-react';

const stories = [
  {
    emoji: '👩‍🦳',
    bg: 'bg-red-100',
    headingKey: 'giftSection.mumHeading',
    headingFallback: 'She lives alone and I worry every day',
    descKey: 'giftSection.mumDesc',
    descFallback: 'Give your mum CLARA — she gets 24/7 protection, you get peace of mind. No technical setup needed for her.',
  },
  {
    emoji: '👨‍🦳',
    bg: 'bg-blue-100',
    headingKey: 'giftSection.dadHeading',
    headingFallback: "He's stubborn about asking for help",
    descKey: 'giftSection.dadDesc',
    descFallback: 'CLARA works quietly in the background. One button if anything goes wrong. Your dad keeps his independence.',
  },
  {
    emoji: '💑',
    bg: 'bg-purple-100',
    headingKey: 'giftSection.partnerHeading',
    headingFallback: 'The most thoughtful gift I could think of',
    descKey: 'giftSection.partnerDesc',
    descFallback: "Whether it's for a partner, a grandparent, or a lone worker — CLARA is the gift that keeps them safe every day.",
  },
];

// giftOptions moved inside component to access t()

const personas = [
  { emoji: '👩‍🦳', labelKey: 'giftSection.forMum', fallback: 'For Mum' },
  { emoji: '👨‍🦳', labelKey: 'giftSection.forDad', fallback: 'For Dad' },
  { emoji: '👴👵', labelKey: 'giftSection.forGrandparents', fallback: 'For Grandparents' },
  { emoji: '💑', labelKey: 'giftSection.forPartner', fallback: 'For a Partner' },
  { emoji: '👷', labelKey: 'giftSection.forColleague', fallback: 'For a Colleague' },
];

const GiftSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const giftOptions = [
    {
      key: 'monthly',
      icon: Clock,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      title: t('giftSection.monthlyTitle', '1 Month Gift'),
      sub: t('giftSection.monthlySub', 'Perfect to try together'),
      price: '€9.99',
      border: 'border-gray-200 hover:border-red-300 bg-white',
    },
    {
      key: 'annual',
      icon: Shield,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      title: t('giftSection.annualTitle', '12 Month Gift'),
      sub: t('giftSection.annualSub', 'Save €19.98 · 2 months free'),
      price: '€99.90',
      border: 'border-red-200 bg-red-50 hover:border-red-400',
      badge: t('giftSection.mostPopular', 'Most Popular'),
      badgeColor: 'bg-red-500',
    },
    {
      key: 'bundle',
      icon: Package,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-400',
      title: t('giftSection.bundleTitle', 'Bundle + Pendant'),
      sub: t('giftSection.bundleSub', '12 months + SOS pendant shipped'),
      price: t('giftSection.comingSoon', 'Coming Soon'),
      border: 'border-gray-200 bg-gray-50 opacity-60 cursor-default',
      badge: t('giftSection.comingSoon', 'Coming Soon'),
      badgeColor: 'bg-gray-400',
      disabled: true,
    },
    {
      key: 'voucher',
      icon: Heart,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      title: t('giftSection.voucherTitle', 'Gift Voucher'),
      sub: t('giftSection.voucherSub', 'They choose when to activate'),
      price: '€99.90',
      border: 'border-gray-200 hover:border-purple-300 bg-white',
    },
  ];

  return (
    <section className="py-20 bg-white border-t border-gray-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">

        {/* Top Label */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-red-100 mb-4">
            🎁 {t('giftSection.label', 'Gift Protection')}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-poppins mb-4">
            {t('giftSection.heading', 'Give the gift of peace of mind')}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-inter">
            {t('giftSection.subtitle', 'The most meaningful present you can give someone you love — knowing CLARA is watching over them 24/7.')}
          </p>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">

          {/* Left — Emotional Stories */}
          <div className="space-y-6">
            {stories.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 ${s.bg} rounded-full flex items-center justify-center text-2xl`}>
                  {s.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t(s.headingKey, s.headingFallback)}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-inter">{t(s.descKey, s.descFallback)}</p>
                </div>
              </div>
            ))}

            {/* Quote */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 relative">
              <span className="text-red-200 text-6xl font-serif leading-none absolute top-4 left-6 select-none" aria-hidden="true">"</span>
              <p className="text-gray-700 italic text-sm leading-relaxed pt-6 pl-4 font-inter">
                {t('giftSection.quote', 'I bought the annual gift for my mum in Málaga. She was set up in 10 minutes and I finally sleep at night knowing CLARA is with her.')}
              </p>
              <p className="text-gray-400 text-xs mt-3 pl-4 font-medium">— {t('giftSection.quoteAuthor', 'James T., Amsterdam')}</p>
            </div>
          </div>

          {/* Right — Gift Options */}
          <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('giftSection.chooseGift', 'Choose a gift')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('giftSection.noCardNeeded', 'No card needed to redeem. Active within minutes.')}</p>

            <div className="space-y-3 mb-6">
              {giftOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => !(opt as any).disabled && navigate(`/gift?package=${opt.key}`)}
                    disabled={(opt as any).disabled}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all relative ${(opt as any).disabled ? '' : 'cursor-pointer'} ${opt.border}`}
                  >
                    {opt.badge && (
                      <span className={`absolute -top-2 -right-2 ${opt.badgeColor} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                        {opt.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${opt.iconBg} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${opt.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-sm">{opt.title}</div>
                        <div className="text-gray-400 text-xs">{opt.sub}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{opt.price}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => navigate('/gift')}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-base font-semibold"
            >
              {t('giftSection.viewAll', 'View all gift options →')}
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4">
              <span className="text-xs text-gray-400 flex items-center gap-1"><Lock className="w-3 h-3" /> {t('giftSection.secureCheckout', 'Secure checkout')}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {t('giftSection.instantDelivery', 'Instant delivery')}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> {t('giftSection.refundPolicy', '7-day refund')}</span>
            </div>
          </div>
        </div>

        {/* Persona Chips */}
        <div className="flex flex-wrap justify-center gap-3">
          {personas.map((p) => (
            <button
              key={p.fallback}
              onClick={() => navigate('/gift')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <span>{p.emoji}</span>
              <span>{t(p.labelKey, p.fallback)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GiftSection;
