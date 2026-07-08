import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './components/layout';
import { HomePage } from './components/catalog/home';
import { OperatorPage } from './components/catalog/operator';
import { LoginPage } from './components/auth/login';
import { RegisterPage } from './components/auth/register';
import { ForgotPasswordPage } from './components/auth/forgot-password';
import { ResetPasswordConfirmPage } from './components/auth/reset-password-confirm';
import { VerifyEmailPage } from './components/auth/verify-email';
import { RoomDetailPage } from './components/rooms/room-detail';
import { CreateRoomPage } from './components/rooms/create-room';
import { MyRoomsPage } from './components/rooms/my-rooms';
import { MemberDetailPage } from './components/rooms/member-detail';
import { OwnerDetailPage } from './components/rooms/owner-detail';
import { RoomFullPage, PaymentFailedPage, RoomBlockedPage } from './components/rooms/error-states';
import { ProfilePage } from './components/profile/profile';
import { SupportPage, NewTicketPage } from './components/support/support';
import { FeedbackPage } from './components/support/feedback';
import { AboutPage } from './components/static/about';
import { NewsPage } from './components/static/news';
import { TermsPage } from './components/static/terms';
import { PrivacyPage } from './components/static/privacy';
import { HowItWorksPage } from './components/static/how-it-works';
import { AdminLoginPage } from './components/admin/admin-login';
import { AdminDashboardPage } from './components/admin/admin-dashboard';
import { AdminFinancePage } from './components/admin/admin-finance';
import { AdminModerationPage } from './components/admin/admin-moderation';
import { AdminRoomsPage } from './components/admin/admin-rooms';
import { AdminUsersPage } from './components/admin/admin-users';
import { AdminTicketsPage } from './components/admin/admin-tickets';
import { AdminFeedbackPage } from './components/admin/admin-feedback';
import { AdminDisputesPage } from './components/admin/admin-disputes';
import { AdminLogsPage } from './components/admin/admin-logs';
import { AdminCatalogPage } from './components/admin/admin-catalog';
import { AdminServiceReviewsPage } from './components/admin/admin-service-reviews';
import { AdminAboutPage } from './components/admin/admin-about';
import { AdminLegalPage } from './components/admin/admin-legal';
import { AdminNewsPage } from './components/admin/admin-news';
import { AdminPricingPage } from './components/admin/admin-pricing';
import { AdminRoute } from './components/admin/admin-route';
import {
  PaymentRoomDetailsPage,
  PaymentCheckoutPage,
  PaymentConfirmationPage,
  PaymentPendingPage,
  RefundStatusPage,
  OwnerPayoutPage,
} from './components/payments/payments';
import { PaymentReturnPage } from './components/payments/payment-return';
import { CardConnectedPage } from './components/payments/card-connected';
import { PublicUserProfilePage } from './components/reputation/public-profile';
import { I18nTypographyFixPage } from './components/static/i18n-typography-fix';
import { StatesSlaEdgeCasesPage } from './components/static/states-sla-edge-cases';
import { PrivacyAuditPatternsPage } from './components/static/privacy-audit-patterns';
import { DisputesUserAdminPage } from './components/static/disputes-user-admin';
import { NotificationsInboxPage } from './components/static/notifications-inbox';
import { QualityPassStatesPage } from './components/static/quality-pass-states';
import { AccessibilityContentSafetyPage } from './components/static/accessibility-content-safety';
import { ComponentAuditPage } from './components/static/component-audit-variants';
import { QaReleaseReadinessPage } from './components/static/qa-release-readiness';
import { GovernanceRulesPage } from './components/static/governance-rules';
import { PaymentHistoryPage } from './components/static/payment-history-receipts';
import { GeoBestOperatorPage } from './components/static/geo-best-operator';
import { NotificationPreferencesPage } from './components/static/notification-preferences';
import { DataContractsApiMappingPage } from './components/static/data-contracts-api-mapping';
import { CopyLibraryPage } from './components/static/copy-library';
import { BuildChecklistPage } from './components/static/build-checklist';
import { AnalyticsEventTrackingPage } from './components/static/analytics-event-tracking';

function ErrorFallback() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--eco-text)' }}>
      <h2>Something went wrong</h2>
      <p style={{ color: 'var(--eco-text-secondary)' }}>Please try again or go back.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    ErrorBoundary: ErrorFallback,
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
      { path: 'rooms/full', Component: RoomFullPage },
      { path: 'rooms/payment-failed', Component: PaymentFailedPage },
      { path: 'rooms/blocked', Component: RoomBlockedPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'support', Component: SupportPage },
      { path: 'support/new', Component: NewTicketPage },
      { path: 'feedback', Component: FeedbackPage },
      { path: 'about', Component: AboutPage },
      { path: 'news', Component: NewsPage },
      { path: 'terms', Component: TermsPage },
      { path: 'privacy', Component: PrivacyPage },
      { path: 'how-it-works', Component: HowItWorksPage },
      { path: 'payment/room', Component: PaymentRoomDetailsPage },
      { path: 'payment/checkout', Component: PaymentCheckoutPage },
      // Freedom Pay redirect-back targets (success_url / failure_url) — wired to
      // the live reconciliation page.
      { path: 'payment/confirmation', Component: PaymentReturnPage },
      { path: 'payment/failure', Component: PaymentReturnPage },
      // Static design reference for the old confirmation mockup.
      { path: 'payment/confirmation-demo', Component: PaymentConfirmationPage },
      { path: 'payment/pending', Component: PaymentPendingPage },
      { path: 'payment/refund', Component: RefundStatusPage },
      { path: 'payment/payout', Component: OwnerPayoutPage },
      // FreedomPay redirect-back target after connecting a payout card.
      { path: 'payment/card-connected', Component: CardConnectedPage },
      { path: 'user/:id', Component: PublicUserProfilePage },
      { path: 'u/:publicId', Component: PublicUserProfilePage },
      { path: 'i18n-typography', Component: I18nTypographyFixPage },
      { path: 'states-sla', Component: StatesSlaEdgeCasesPage },
      { path: 'privacy-audit', Component: PrivacyAuditPatternsPage },
      { path: 'disputes-flows', Component: DisputesUserAdminPage },
      { path: 'notifications-inbox', Component: NotificationsInboxPage },
      { path: 'quality-pass', Component: QualityPassStatesPage },
      { path: 'accessibility-safety', Component: AccessibilityContentSafetyPage },
      { path: 'component-audit', Component: ComponentAuditPage },
      { path: 'qa-release', Component: QaReleaseReadinessPage },
      { path: 'governance', Component: GovernanceRulesPage },
      { path: 'payment-history', Component: PaymentHistoryPage },
      { path: 'geo-operator', Component: GeoBestOperatorPage },
      { path: 'notification-prefs', Component: NotificationPreferencesPage },
      { path: 'data-contracts', Component: DataContractsApiMappingPage },
      { path: 'copy-library', Component: CopyLibraryPage },
      { path: 'build-checklist', Component: BuildChecklistPage },
      { path: 'analytics-events', Component: AnalyticsEventTrackingPage },
    ],
  },
  {
    path: '/admin-login',
    Component: AdminLoginPage,
    ErrorBoundary: ErrorFallback,
  },
  {
    path: '/admin',
    Component: AdminRoute,
    ErrorBoundary: ErrorFallback,
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
      { path: 'legal', Component: AdminLegalPage },
    ],
  },
]);
