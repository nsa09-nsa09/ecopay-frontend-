import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { AppLayout } from './components/layout';
import { HomePage } from './components/catalog/home';
import { RouteFallback } from './components/route-fallback';
import { RouteErrorFallback } from './components/route-error';

/**
 * React.lazy with one delayed retry: a transient network failure while
 * fetching a route chunk should not drop the user onto the error screen.
 * Persistent failures (stale deploy) reach RouteErrorFallback, which reloads
 * once to pick up the new build.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyRoute<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch(
      () =>
        new Promise<{ default: T }>((resolve, reject) => {
          setTimeout(() => factory().then(resolve, reject), 1500);
        }),
    ),
  );
}

// Eager: layout, error boundary, home page (root catalog — loaded immediately).
// Everything else is code-split via React.lazy so each page ships as its own chunk.

const OperatorPage = lazyRoute(() =>
  import('./components/catalog/operator').then((m) => ({ default: m.OperatorPage })),
);
const LoginPage = lazyRoute(() =>
  import('./components/auth/login').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazyRoute(() =>
  import('./components/auth/register').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazyRoute(() =>
  import('./components/auth/forgot-password').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordConfirmPage = lazyRoute(() =>
  import('./components/auth/reset-password-confirm').then((m) => ({
    default: m.ResetPasswordConfirmPage,
  })),
);
const VerifyEmailPage = lazyRoute(() =>
  import('./components/auth/verify-email').then((m) => ({ default: m.VerifyEmailPage })),
);
const RoomDetailPage = lazyRoute(() =>
  import('./components/rooms/room-detail').then((m) => ({ default: m.RoomDetailPage })),
);
const CreateRoomPage = lazyRoute(() =>
  import('./components/rooms/create-room').then((m) => ({ default: m.CreateRoomPage })),
);
const MyRoomsPage = lazyRoute(() =>
  import('./components/rooms/my-rooms').then((m) => ({ default: m.MyRoomsPage })),
);
const MemberDetailPage = lazyRoute(() =>
  import('./components/rooms/member-detail').then((m) => ({ default: m.MemberDetailPage })),
);
const OwnerDetailPage = lazyRoute(() =>
  import('./components/rooms/owner-detail').then((m) => ({ default: m.OwnerDetailPage })),
);
const ProfilePage = lazyRoute(() =>
  import('./components/profile/profile').then((m) => ({ default: m.ProfilePage })),
);
const SupportPage = lazyRoute(() =>
  import('./components/support/support').then((m) => ({ default: m.SupportPage })),
);
const NewTicketPage = lazyRoute(() =>
  import('./components/support/support').then((m) => ({ default: m.NewTicketPage })),
);
const FeedbackPage = lazyRoute(() =>
  import('./components/support/feedback').then((m) => ({ default: m.FeedbackPage })),
);
const AboutPage = lazyRoute(() =>
  import('./components/static/about').then((m) => ({ default: m.AboutPage })),
);
const NewsPage = lazyRoute(() =>
  import('./components/static/news').then((m) => ({ default: m.NewsPage })),
);
const NewsDetailPage = lazyRoute(() =>
  import('./components/static/news').then((m) => ({ default: m.NewsDetailPage })),
);
const TermsPage = lazyRoute(() =>
  import('./components/static/terms').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazyRoute(() =>
  import('./components/static/privacy').then((m) => ({ default: m.PrivacyPage })),
);
const HowItWorksPage = lazyRoute(() =>
  import('./components/static/how-it-works').then((m) => ({ default: m.HowItWorksPage })),
);
const SecurityPage = lazyRoute(() =>
  import('./components/static/security').then((m) => ({ default: m.SecurityPage })),
);
const AdminLoginPage = lazyRoute(() =>
  import('./components/admin/admin-login').then((m) => ({ default: m.AdminLoginPage })),
);
const AdminDashboardPage = lazyRoute(() =>
  import('./components/admin/admin-dashboard').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminFinancePage = lazyRoute(() =>
  import('./components/admin/admin-finance').then((m) => ({ default: m.AdminFinancePage })),
);
const AdminModerationPage = lazyRoute(() =>
  import('./components/admin/admin-moderation').then((m) => ({ default: m.AdminModerationPage })),
);
const AdminRoomsPage = lazyRoute(() =>
  import('./components/admin/admin-rooms').then((m) => ({ default: m.AdminRoomsPage })),
);
const AdminUsersPage = lazyRoute(() =>
  import('./components/admin/admin-users').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminTicketsPage = lazyRoute(() =>
  import('./components/admin/admin-tickets').then((m) => ({ default: m.AdminTicketsPage })),
);
const AdminFeedbackPage = lazyRoute(() =>
  import('./components/admin/admin-feedback').then((m) => ({ default: m.AdminFeedbackPage })),
);
const AdminDisputesPage = lazyRoute(() =>
  import('./components/admin/admin-disputes').then((m) => ({ default: m.AdminDisputesPage })),
);
const AdminLogsPage = lazyRoute(() =>
  import('./components/admin/admin-logs').then((m) => ({ default: m.AdminLogsPage })),
);
const AdminCatalogPage = lazyRoute(() =>
  import('./components/admin/admin-catalog').then((m) => ({ default: m.AdminCatalogPage })),
);
const AdminServiceReviewsPage = lazyRoute(() =>
  import('./components/admin/admin-service-reviews').then((m) => ({
    default: m.AdminServiceReviewsPage,
  })),
);
const AdminAboutPage = lazyRoute(() =>
  import('./components/admin/admin-about').then((m) => ({ default: m.AdminAboutPage })),
);
const AdminLegalPage = lazyRoute(() =>
  import('./components/admin/admin-legal').then((m) => ({ default: m.AdminLegalPage })),
);
const AdminNewsPage = lazyRoute(() =>
  import('./components/admin/admin-news').then((m) => ({ default: m.AdminNewsPage })),
);
const AdminStoriesPage = lazyRoute(() =>
  import('./components/admin/admin-stories').then((m) => ({ default: m.AdminStoriesPage })),
);
const AdminPricingPage = lazyRoute(() =>
  import('./components/admin/admin-pricing').then((m) => ({ default: m.AdminPricingPage })),
);
const AdminRoute = lazyRoute(() =>
  import('./components/admin/admin-route').then((m) => ({ default: m.AdminRoute })),
);
const RefundStatusPage = lazyRoute(() =>
  import('./components/payments/payments').then((m) => ({ default: m.RefundStatusPage })),
);
const OwnerPayoutPage = lazyRoute(() =>
  import('./components/payments/payments').then((m) => ({ default: m.OwnerPayoutPage })),
);
const PaymentReturnPage = lazyRoute(() =>
  import('./components/payments/payment-return').then((m) => ({ default: m.PaymentReturnPage })),
);
const PaymentHistoryPage = lazyRoute(() =>
  import('./components/payments/payment-history').then((m) => ({ default: m.PaymentHistoryPage })),
);
const CardConnectedPage = lazyRoute(() =>
  import('./components/payments/card-connected').then((m) => ({ default: m.CardConnectedPage })),
);
const PublicUserProfilePage = lazyRoute(() =>
  import('./components/reputation/public-profile').then((m) => ({
    default: m.PublicUserProfilePage,
  })),
);
const NotificationsInboxPage = lazyRoute(() =>
  import('./components/notifications/notifications-inbox').then((m) => ({
    default: m.NotificationsInboxPage,
  })),
);
const NotificationPreferencesPage = lazyRoute(() =>
  import('./components/notifications/notification-preferences').then((m) => ({
    default: m.NotificationPreferencesPage,
  })),
);
const NotFoundPage = lazyRoute(() =>
  import('./components/static/not-found').then((m) => ({ default: m.NotFoundPage })),
);
const AdminNotFoundPage = lazyRoute(() =>
  import('./components/static/not-found').then((m) => ({ default: m.AdminNotFoundPage })),
);

const internalStaticRoutes =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_INTERNAL_PAGES === 'true'
    ? [
        {
          path: 'i18n-typography',
          Component: lazyRoute(() =>
            import('./components/static/i18n-typography-fix').then((m) => ({
              default: m.I18nTypographyFixPage,
            })),
          ),
        },
        {
          path: 'states-sla',
          Component: lazyRoute(() =>
            import('./components/static/states-sla-edge-cases').then((m) => ({
              default: m.StatesSlaEdgeCasesPage,
            })),
          ),
        },
        {
          path: 'privacy-audit',
          Component: lazyRoute(() =>
            import('./components/static/privacy-audit-patterns').then((m) => ({
              default: m.PrivacyAuditPatternsPage,
            })),
          ),
        },
        {
          path: 'disputes-flows',
          Component: lazyRoute(() =>
            import('./components/static/disputes-user-admin').then((m) => ({
              default: m.DisputesUserAdminPage,
            })),
          ),
        },
        {
          path: 'quality-pass',
          Component: lazyRoute(() =>
            import('./components/static/quality-pass-states').then((m) => ({
              default: m.QualityPassStatesPage,
            })),
          ),
        },
        {
          path: 'accessibility-safety',
          Component: lazyRoute(() =>
            import('./components/static/accessibility-content-safety').then((m) => ({
              default: m.AccessibilityContentSafetyPage,
            })),
          ),
        },
        {
          path: 'component-audit',
          Component: lazyRoute(() =>
            import('./components/static/component-audit-variants').then((m) => ({
              default: m.ComponentAuditPage,
            })),
          ),
        },
        {
          path: 'qa-release',
          Component: lazyRoute(() =>
            import('./components/static/qa-release-readiness').then((m) => ({
              default: m.QaReleaseReadinessPage,
            })),
          ),
        },
        {
          path: 'governance',
          Component: lazyRoute(() =>
            import('./components/static/governance-rules').then((m) => ({
              default: m.GovernanceRulesPage,
            })),
          ),
        },
        {
          path: 'geo-operator',
          Component: lazyRoute(() =>
            import('./components/static/geo-best-operator').then((m) => ({
              default: m.GeoBestOperatorPage,
            })),
          ),
        },
        {
          path: 'data-contracts',
          Component: lazyRoute(() =>
            import('./components/static/data-contracts-api-mapping').then((m) => ({
              default: m.DataContractsApiMappingPage,
            })),
          ),
        },
        {
          path: 'copy-library',
          Component: lazyRoute(() =>
            import('./components/static/copy-library').then((m) => ({ default: m.CopyLibraryPage })),
          ),
        },
        {
          path: 'build-checklist',
          Component: lazyRoute(() =>
            import('./components/static/build-checklist').then((m) => ({
              default: m.BuildChecklistPage,
            })),
          ),
        },
        {
          path: 'analytics-events',
          Component: lazyRoute(() =>
            import('./components/static/analytics-event-tracking').then((m) => ({
              default: m.AnalyticsEventTrackingPage,
            })),
          ),
        },
        {
          path: 'payment/confirmation-demo',
          Component: lazyRoute(() =>
            import('./components/payments/payments').then((m) => ({
              default: m.PaymentConfirmationPage,
            })),
          ),
        },
      ]
    : [];

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
    ErrorBoundary: RouteErrorFallback,
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
          // Catch-all: any unmapped public URL renders the localized 404 inside
          // the normal layout + ErrorBoundary, not React Router's English screen.
          { path: '*', Component: NotFoundPage },
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
    ErrorBoundary: RouteErrorFallback,
  },
  {
    path: '/admin',
    Component: AdminRoute,
    ErrorBoundary: RouteErrorFallback,
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
          // Admin catch-all: unmapped /admin/* keeps the admin shell (via
          // AdminNotFoundPage → AdminLayout) and leaks no admin data.
          { path: '*', Component: AdminNotFoundPage },
        ],
      },
    ],
  },
]);
