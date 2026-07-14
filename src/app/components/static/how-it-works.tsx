import { WaveDivider } from '../ds-primitives';
import { UserPlus, Key, CreditCard, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useI18n } from '../i18n-provider';

export function HowItWorksPage() {
  const { t } = useI18n();

  const steps = [
    {
      icon: UserPlus,
      number: 1,
      title: t('howItWorksStep1Title'),
      description: t('howItWorksStep1Desc'),
      details: [
        t('howItWorksStep1Detail1'),
        t('howItWorksStep1Detail2'),
        t('howItWorksStep1Detail3'),
      ],
    },
    {
      icon: Key,
      number: 2,
      title: t('howItWorksStep2Title'),
      description: t('howItWorksStep2Desc'),
      details: [
        t('howItWorksStep2Detail1'),
        t('howItWorksStep2Detail2'),
        t('howItWorksStep2Detail3'),
      ],
    },
    {
      icon: CreditCard,
      number: 3,
      title: t('howItWorksStep3Title'),
      description: t('howItWorksStep3Desc'),
      details: [
        t('howItWorksStep3Detail1'),
        t('howItWorksStep3Detail2'),
        t('howItWorksStep3Detail3'),
      ],
    },
    {
      icon: CheckCircle,
      number: 4,
      title: t('howItWorksStep4Title'),
      description: t('howItWorksStep4Desc'),
      details: [
        t('howItWorksStep4Detail1'),
        t('howItWorksStep4Detail2'),
        t('howItWorksStep4Detail3'),
      ],
    },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: 'var(--eco-surface)' }}>
        <div className="max-w-[900px] mx-auto text-center">
          <h1
            className="text-[26px] sm:text-[40px] tracking-tight mb-4"
            style={{ color: 'var(--eco-text)' }}
          >
            {t('howItWorksTitle')}
          </h1>
          <p
            className="text-[16px] max-w-[600px] mx-auto"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {t('howItWorksSubtitle')}
          </p>
        </div>
      </div>
      <WaveDivider flip />

      {/* Steps */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector line (except for last item) */}
                {idx < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute left-[28px] top-[60px] w-0.5 h-[calc(100%+24px)]"
                    style={{ background: 'var(--eco-border)' }}
                  />
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Icon & Number */}
                  <div className="shrink-0 flex flex-col items-center md:items-start">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-2 relative z-10"
                      style={{ background: 'var(--eco-primary)' }}
                    >
                      <Icon size={26} style={{ color: '#fff' }} />
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
                      style={{
                        background: 'var(--eco-surface)',
                        color: 'var(--eco-text)',
                        border: '2px solid var(--eco-primary)',
                      }}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-[22px] mb-3" style={{ color: 'var(--eco-text)' }}>
                      {step.title}
                    </h2>
                    <p
                      className="text-[14px] leading-relaxed mb-4"
                      style={{ color: 'var(--eco-text-secondary)' }}
                    >
                      {step.description}
                    </p>

                    {/* Details */}
                    <div className="flex flex-wrap gap-2">
                      {step.details.map((detail) => (
                        <span
                          key={detail}
                          className="px-3 py-1.5 rounded-lg text-[12px]"
                          style={{
                            background: 'var(--eco-surface)',
                            color: 'var(--eco-text-secondary)',
                          }}
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Important Notice */}
        <div
          className="mt-12 p-6 rounded-xl border-2"
          style={{ background: 'var(--eco-surface)', borderColor: 'var(--eco-warning-500)' }}
        >
          <div className="flex items-start gap-4">
            <AlertCircle
              size={24}
              className="shrink-0 mt-1"
              style={{ color: 'var(--eco-warning-500)' }}
            />
            <div>
              <h3 className="text-[16px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {t('howItWorksNoticeTitle')}
              </h3>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {t('howItWorksNoticeDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Support CTA */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: 'var(--eco-brand-50)' }}>
          <div className="flex items-start gap-4">
            <MessageSquare
              size={24}
              className="shrink-0 mt-1"
              style={{ color: 'var(--eco-primary)' }}
            />
            <div>
              <h3 className="text-[16px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {t('howItWorksHelpTitle')}
              </h3>
              <p className="text-[14px] mb-4" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('howItWorksHelpDesc')}
              </p>
              <a
                href="/support/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] transition-colors"
                style={{ background: 'var(--eco-primary)', color: '#fff', textDecoration: 'none' }}
              >
                {t('howItWorksCreateTicketCta')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <WaveDivider />
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: 'var(--eco-surface)' }}>
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-[24px] sm:text-[28px] mb-3" style={{ color: 'var(--eco-text)' }}>
            {t('howItWorksReadyTitle')}
          </h2>
          <p className="text-[14px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('howItWorksReadyDesc')}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[15px] transition-colors"
            style={{ background: 'var(--eco-primary)', color: '#fff', textDecoration: 'none' }}
          >
            {t('howItWorksViewCatalogCta')}
          </a>
        </div>
      </div>
    </div>
  );
}
