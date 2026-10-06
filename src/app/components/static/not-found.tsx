import { Link } from 'react-router';
import { Compass, Home, LifeBuoy } from 'lucide-react';
import { Button } from '../ds-primitives';
import { useI18n } from '../i18n-provider';
import { AdminLayout } from '../admin/admin-layout';

/**
 * Public catch-all (404) page. Replaces React Router's built-in English
 * "Unexpected Application Error" screen for any unmapped public URL. Fully
 * localized, on-brand, with links back to home/catalog and support.
 */
export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <main
      className="min-h-[60vh] flex items-center justify-center px-4 py-16"
      style={{ color: 'var(--eco-text)' }}
    >
      <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
        <div
          aria-hidden="true"
          className="text-[64px] leading-none"
          style={{ fontWeight: 700, color: 'var(--eco-text-tertiary)' }}
        >
          404
        </div>
        <h1 className="text-[24px]" style={{ fontWeight: 650 }}>
          {t('notFoundTitle')}
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('notFoundBody')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              <Home size={16} aria-hidden="true" />
              {t('notFoundHome')}
            </Button>
          </Link>
          <Link to="/how-it-works" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              <Compass size={16} aria-hidden="true" />
              {t('notFoundCatalog')}
            </Button>
          </Link>
          <Link to="/support" className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full">
              <LifeBuoy size={16} aria-hidden="true" />
              {t('notFoundSupport')}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

/**
 * Admin catch-all (404) page. Keeps the admin shell (sidebar/topbar) so the
 * operator stays oriented, and leaks no admin data — just a localized message
 * and a link back to the dashboard.
 */
export function AdminNotFoundPage() {
  const { t } = useI18n();
  return (
    <AdminLayout>
      <div
        className="min-h-[50vh] flex items-center justify-center px-4 py-16"
        style={{ color: 'var(--eco-text)' }}
      >
        <div className="max-w-md w-full text-center flex flex-col items-center gap-4">
          <div
            aria-hidden="true"
            className="text-[56px] leading-none"
            style={{ fontWeight: 700, color: 'var(--eco-text-tertiary)' }}
          >
            404
          </div>
          <h1 className="text-[22px]" style={{ fontWeight: 650 }}>
            {t('adminNotFoundTitle')}
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('adminNotFoundBody')}
          </p>
          <Link to="/admin/dashboard" className="mt-2">
            <Button variant="primary">{t('adminNotFoundBack')}</Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
