import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { AppLayout } from './components/layout';
import { HomePage } from './components/catalog/home';
import { RouteFallback } from './components/route-fallback';

// Eager: layout, error boundary, home page (root catalog — loaded immediately).
// Everything else is code-split via React.lazy so each page ships as its own chunk.

const OperatorPage = lazy(() =>
  import('./components/catalog/operator').then((m) => ({ default: m.OperatorPage })),
);
const LoginPage = lazy(() =>
  import('./components/auth/login').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./components/auth/register').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./components/auth/forgot-password').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordConfirmPage = lazy(() =>
  import('./components/auth/reset-password-confirm').then((m) => ({
    default: m.ResetPasswordConfirmPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import('./components/auth/verify-email').then((m) => ({ default: m.VerifyEmailPage })),
);
const RoomDetailPage = lazy(() =>
  import('./components/rooms/room-detail').then((m) => ({ default: m.RoomDetailPage })),
);
const CreateRoomPage = lazy(() =>
  import('./components/rooms/create-room').then((m) => ({ default: m.CreateRoomPage })),
);
const MyRoomsPage = lazy(() =>
  import('./components/rooms/my-rooms').then((m) => ({ default: m.MyRoomsPage })),
);
const MemberDetailPage = lazy(() =>
  import('./components/rooms/member-detail').then((m) => ({ default: m.MemberDetailPage })),
);
const OwnerDetailPage = lazy(() =>
  import('./components/rooms/owner-detail').then((m) => ({ default: m.OwnerDetailPage })),
);
const ProfilePage = lazy(() =>
  import('./components/profile/profile').then((m) => ({ default: m.ProfilePage })),
);
const SupportPage = lazy(() =>
  import('./components/support/support').then((m) => ({ default: m.SupportPage })),
);
const NewTicketPage = lazy(() =>
  import('./components/support/support').then((m) => ({ default: m.NewTicketPage })),
);
const FeedbackPage = lazy(() =>
  import('./components/support/feedback').then((m) => ({ default: m.FeedbackPage })),
);
const AboutPage = lazy(() =>
  import('./components/static/about').then((m) => ({ default: m.AboutPage })),
);
const NewsPage = lazy(() =>
  import('./components/static/news').then((m) => ({ default: m.NewsPage })),
);
const NewsDetailPage = lazy(() =>
  import('./components/static/news').then((m) => ({ default: m.NewsDetailPage })),
);
const TermsPage = lazy(() =>
  import('./components/static/terms').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import('./components/static/privacy').then((m) => ({ default: m.PrivacyPage })),
);
const HowItWorksPage = lazy(() =>
  import('./components/static/how-it-works').then((m) => ({ default: m.HowItWorksPage })),
);
const SecurityPage = lazy(() =>
  import('./components/static/security').then((m) => ({ default: m.SecurityPage })),
);
const AdminLoginPage = lazy(() =>
  import('./components/admin/admin-login').then((m) => ({ default: m.AdminLoginPage })),
);
const AdminDashboardPage = lazy(() =>
  import('./components/admin/admin-dashboard').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminFinancePage = lazy(() =>
  import('./components/admin/admin-finance').then((m) => ({ default: m.AdminFinancePage })),
);
const AdminModerationPage = lazy(() =>
  import('./components/admin/admin-moderation').then((m) => ({ default: m.AdminModerationPage })),
);
const AdminRoomsPage = lazy(() =>
  import('./components/admin/admin-rooms').then((m) => ({ default: m.AdminRoomsPage })),
);
const AdminUsersPage = lazy(() =>
  import('./components/admin/admin-users').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminTicketsPage = lazy(() =>
  import('./components/admin/admin-tickets').then((m) => ({ default: m.AdminTicketsPage })),
);
const AdminFeedbackPage = lazy(() =>
  import('./components/admin/admin-feedback').then((m) => ({ default: m.AdminFeedbackPage })),
);
const AdminDisputesPage = lazy(() =>
  import('./components/admin/admin-disputes').then((m) => ({ default: m.AdminDisputesPage })),
);
const AdminLogsPage = lazy(() =>
  import('./components/admin/admin-logs').then((m) => ({ default: m.AdminLogsPage })),
);
const AdminCatalogPage = lazy(() =>
  import('./components/admin/admin-catalog').then((m) => ({ default: m.AdminCatalogPage })),
);
const AdminServiceReviewsPage = lazy(() =>
  import('./components/admin/admin-service-reviews').then((m) => ({
    default: m.AdminServiceReviewsPage,
  })),
);
const AdminAboutPage = lazy(() =>
  import('./components/admin/admin-about').then((m) => ({ default: m.AdminAboutPage })),
);
const AdminLegalPage = lazy(() =>
  import('./components/admin/admin-legal').then((m) => ({ default: m.AdminLegalPage })),
);
const AdminNewsPage = lazy(() =>
  import('./components/admin/admin-news').then((m) => ({ default: m.AdminNewsPage })),
);
const AdminStoriesPage = lazy(() =>
  import('./components/admin/admin-stories').then((m) => ({ default: m.AdminStoriesPage })),
);
const AdminPricingPage = lazy(() =>
  import('./components/admin/admin-pricing').then((m) => ({ default: m.AdminPricingPage })),
);
const AdminRoute = lazy(() =>
  import('./components/admin/admin-route').then((m) => ({ default: m.AdminRoute })),
);
const RefundStatusPage = lazy(() =>
  import('./components/payments/payments').then((m) => ({ default: m.RefundStatusPage })),
);
const OwnerPayoutPage = lazy(() =>
  import('./components/payments/payments').then((m) => ({ default: m.OwnerPayoutPage })),
);
const PaymentReturnPage = lazy(() =>
  import('./components/payments/payment-return').then((m) => ({ default: m.PaymentReturnPage })),
);
const PaymentHistoryPage = lazy(() =>
  import('./components/payments/payment-history').then((m) => ({ default: m.PaymentHistoryPage })),
);
const CardConnectedPage = lazy(() =>
  import('./components/payments/card-connected').then((m) => ({ default: m.CardConnectedPage })),
);
const PublicUserProfilePage = lazy(() =>
  import('./components/reputation/public-profile').then((m) => ({
    default: m.PublicUserProfilePage,
  })),
);
const NotificationsInboxPage = lazy(() =>
  import('./components/notifications/notifications-inbox').then((m) => ({
    default: m.NotificationsInboxPage,
  })),
);
const NotificationPreferencesPage = lazy(() =>
  import('./components/notifications/notification-preferences').then((m) => ({
    default: m.NotificationPreferencesPage,
  })),
);

const internalStaticRoutes =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_INTERNAL_PAGES === 'true'
    ? [
        {
          path: 'i18n-typography',
          Component: lazy(() =>
            import('./components/static/i18n-typography-fix').then((m) => ({
              default: m.I18nTypographyFixPage,
            })),
          ),
        },
        {
          path: 'states-sla',
          Component: lazy(() =>
            import('./components/static/states-sla-edge-cases').then((m) => ({
              default: m.StatesSlaEdgeCasesPage,
            })),
          ),
        },
        {
          path: 'privacy-audit',
          Component: lazy(() =>
            import('./components/static/privacy-audit-patterns').then((m) => ({
              default: m.PrivacyAuditPatternsPage,
            })),
          ),
        },
        {
          path: 'disputes-flows',
          Component: lazy(() =>
            import('./components/static/disputes-user-admin').then((m) => ({
              default: m.DisputesUserAdminPage,
            })),
          ),
        },
        {
          path: 'quality-pass',
          Component: lazy(() =>
            import('./components/static/quality-pass-states').then((m) => ({
              default: m.QualityPassStatesPage,
            })),
          ),
        },
        {
          path: 'accessibility-safety',
          Component: lazy(() =>
            import('./components/static/accessibility-content-safety').then((m) => ({
              default: m.AccessibilityContentSafetyPage,
            })),
          ),
        },
        {
          path: 'component-audit',
          Component: lazy(() =>
            import('./components/static/component-audit-variants').then((m) => ({
              default: m.ComponentAuditPage,
            })),
          ),
        },
        {
          path: 'qa-release',
          Component: lazy(() =>
            import('./components/static/qa-release-readiness').then((m) => ({
              default: m.QaReleaseReadinessPage,
            })),
          ),
        },
        {
          path: 'governance',
          Component: lazy(() =>
            import('./components/static/governance-rules').then((m) => ({
              default: m.GovernanceRulesPage,
            })),
          ),
        },
        {
          path: 'geo-operator',
          Component: lazy(() =>
            import('./components/static/geo-best-operator').then((m) => ({
              default: m.GeoBestOperatorPage,
            })),
          ),
        },
        {
          path: 'data-contracts',
          Component: lazy(() =>
            import('./components/static/data-contracts-api-mapping').then((m) => ({
              default: m.DataContractsApiMappingPage,
            })),
          ),
        },
        {
          path: 'copy-library',
          Component: lazy(() =>
            import('./components/static/copy-library').then((m) => ({ default: m.CopyLibraryPage })),
          ),
        },
        {
          path: 'build-checklist',
          Component: lazy(() =>
            import('./components/static/build-checklist').then((m) => ({
              default: m.BuildChecklistPage,
            })),
          ),
        },
        {
          path: 'analytics-events',
          Component: lazy(() =>
            import('./components/static/analytics-event-tracking').then((m) => ({
              default: m.AnalyticsEventTrackingPage,
            })),
          ),
        },
        {
          path: 'payment/confirmation-demo',
          Component: lazy(() =>
            import('./components/payments/payments').then((m) => ({
              default: m.PaymentConfirmationPage,
            })),
          ),
        },
      ]
    : [];

function ErrorFallback() {
  // The error boundary can render outside the i18n provider, so read the
  // persisted language directly instead of using the hook.
  let lang = 'ru';
  try {
    lang = localStorage.getItem('ecopay-language') ?? 'ru';
  } catch {
    /* storage unavailable — keep default */
  }
  const title =
    lang === 'kz'
      ? 'Бірдеңе дұрыс болмады'
      : lang === 'en'
        ? 'Something went wrong'
        : 'Что-то пошло не так';
  const body =
    lang === 'kz'
      ? 'Қайталап көріңіз немесе артқа оралыңыз.'
      : lang === 'en'
        ? 'Please try again or go back.'
        : 'Попробуйте ещё раз или вернитесь назад.';
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--eco-text)' }}>
      <h2>{title}</h2>
      <p style={{ color: 'var(--eco-text-secondary)' }}>{body}</p>
    </div>
  );
}

// Renders <Outlet/> inside a Suspense boundary so that lazy children can share
// one fallback. The eager HomePage never suspends, so it just passes through.
function SuspenseOutlet() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    ErrorBoundary: ErrorFallback,
    children: [
      {
        Component: SuspenseOutlet,
        children: [
          { index: true, Component: HomePage },
          // /browse is decommissioned — selection now happens via service-match on
          // the home catalog tiles. Keep the route to avoid 404s on old links.
          { path: 'browse', element: <Navigate to="/" replace /> },
          { path: 'operator/:id', Component: OperatorPage },
          { path: 'login', Component: LoginPage },
          { path: 'register', Component: RegisterPage },
          { path: 'forgot-password', Component: ForgotPasswordPage },
          { path: 'reset-password/confirm', Component: ResetPasswordConfirmPage },
          { path: 'verify-email', Component: VerifyEmailPage },
          { path: 'room/:id', Component: RoomDetailPage },
          { path: 'rooms', Component: MyRoomsPage },
          { path: 'rooms/create', Component: CreateRoomPage },
          { path: 'rooms/member/:id', Component: MemberDetailPage },
          { path: 'rooms/owner/:id', Component: OwnerDetailPage },
          { path: 'profile', Component: ProfilePage },
          { path: 'support', Component: SupportPage },
          { path: 'support/new', Component: NewTicketPage },
          { path: 'feedback', Component: FeedbackPage },
          { path: 'about', Component: AboutPage },
          { path: 'news', Component: NewsPage },
          { path: 'news/:id', Component: NewsDetailPage },
          { path: 'terms', Component: TermsPage },
          { path: 'privacy', Component: PrivacyPage },
          { path: 'how-it-works', Component: HowItWorksPage },
          { path: 'security', Component: SecurityPage },
          { path: 'sceurity', element: <Navigate to="/security" replace /> },
          // Freedom Pay redirect-back targets (success_url / failure_url) — wired to
          // the live reconciliation page.
          { path: 'payment/confirmation', Component: PaymentReturnPage },
          { path: 'payment/failure', Component: PaymentReturnPage },
          { path: 'payment/refund', Component: RefundStatusPage },
          { path: 'payment/payout', Component: OwnerPayoutPage },
          { path: 'payments/history', Component: PaymentHistoryPage },
          // FreedomPay redirect-back target after connecting a payout card.
          { path: 'payment/card-connected', Component: CardConnectedPage },
          { path: 'user/:id', Component: PublicUserProfilePage },
          { path: 'u/:publicId', Component: PublicUserProfilePage },
          { path: 'notifications-inbox', Component: NotificationsInboxPage },
          { path: 'notification-prefs', Component: NotificationPreferencesPage },
          ...internalStaticRoutes,
        ],
      },
    ],
  },
  {
    path: '/admin-login',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <AdminLoginPage />
      </Suspense>
    ),
    ErrorBoundary: ErrorFallback,
  },
  {
    path: '/admin',
    Component: AdminRoute,
    ErrorBoundary: ErrorFallback,
    children: [
      {
        Component: SuspenseOutlet,
        children: [
          { path: 'dashboard', Component: AdminDashboardPage },
          { path: 'moderation', Component: AdminModerationPage },
          { path: 'rooms', Component: AdminRoomsPage },
          { path: 'users', Component: AdminUsersPage },
          { path: 'tickets', Component: AdminTicketsPage },
          { path: 'feedback', Component: AdminFeedbackPage },
          { path: 'disputes', Component: AdminDisputesPage },
          { path: 'refunds', Component: AdminDisputesPage },
          { path: 'finance', Component: AdminFinancePage },
          { path: 'logs', Component: AdminLogsPage },
          { path: 'catalog', Component: AdminCatalogPage },
          { path: 'pricing', Component: AdminPricingPage },
          { path: 'service-reviews', Component: AdminServiceReviewsPage },
          { path: 'about', Component: AdminAboutPage },
          { path: 'news', Component: AdminNewsPage },
          { path: 'stories', Component: AdminStoriesPage },
          { path: 'legal', Component: AdminLegalPage },
        ],
      },
    ],
  },
]);
