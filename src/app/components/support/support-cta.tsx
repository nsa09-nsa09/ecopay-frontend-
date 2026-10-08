import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ds-primitives';
import { useI18n } from '../i18n-provider';

/**
 * Wide "need help?" banner used on the public About page. Routes to the support
 * composer; unauthenticated visitors are forwarded to login by the route guard.
 * Colours come from brand tokens so it stays readable in either theme (brand-50
 * is a light surface with dark --eco-text on top — never a light-on-light pair).
 */
export function SupportCta() {
  const { t } = useI18n();
  return (
    <div
      className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"
      style={{
        borderRadius: 16,
        background: 'var(--eco-brand-50)',
        border: '1px solid color-mix(in srgb, var(--eco-primary) 35%, transparent)',
      }}
    >
      <div className="flex flex-col gap-1">
        <h3
          className="text-[20px] sm:text-[22px] leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
        >
          {t('supportCtaTitle')}
        </h3>
        <p className="text-[14px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('supportCtaText')}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <Link to="/support/new" className="group w-full sm:w-auto">
          <Button variant="primary" size="lg" className="w-full justify-center sm:w-auto">
            {t('supportCtaButton')}
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="transition-transform duration-150 group-hover:translate-x-[3px] group-focus-within:translate-x-[3px]"
            />
          </Button>
        </Link>
        <Link
          to="/support"
          className="text-[13px] underline-offset-2 hover:underline"
          style={{ color: 'var(--eco-primary)' }}
        >
          {t('supportCtaMyTickets')}
        </Link>
      </div>
    </div>
  );
}
