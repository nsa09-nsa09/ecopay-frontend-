import {
  LayoutDashboard,
  ShieldCheck,
  Home,
  Users,
  MessageSquare,
  Scale,
  Undo2,
  FileText,
  Layers,
  Star,
  Info,
  Inbox,
  Newspaper,
  ScrollText,
  LineChart,
  Wallet,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { UserRole } from '../../lib/api';

export type StaffRole = Extract<UserRole, 'ADMIN' | 'SUPPORT'>;

/** Sidebar section an entry is listed under. Presentation only. */
export type AdminNavGroup = 'operations' | 'finance' | 'content' | 'system';

export const ADMIN_NAV_GROUPS: readonly { id: AdminNavGroup; labelKey: string }[] = [
  { id: 'operations', labelKey: 'adminNavGroupOperations' },
  { id: 'finance', labelKey: 'adminNavGroupFinance' },
  { id: 'content', labelKey: 'adminNavGroupContent' },
  { id: 'system', labelKey: 'adminNavGroupSystem' },
];

export interface AdminNavItem {
  /** i18n key used for the link label. */
  labelKey: string;
  /** Router path. */
  path: string;
  /** Lucide icon component. */
  icon: typeof LayoutDashboard;
  /** Roles allowed to see this nav entry and access the route. */
  roles: readonly StaffRole[];
  /**
   * Optional KPI field name to pull a count from
   * GET /admin/dashboard/kpis. Renders as a sidebar badge when > 0.
   */
  badgeKpi?: 'pendingModeration' | 'openDisputes';
  /** Sidebar section. */
  group: AdminNavGroup;
}

/**
 * Single source of truth for admin sidebar links AND route guards.
 *
 * Role mapping mirrors backend security config:
 *   /api/v1/staff/**  → ADMIN, SUPPORT
 *   /api/v1/admin/**  → ADMIN only
 *
 * Among the admin sections, only Tickets calls staff endpoints — so it is
 * the only entry SUPPORT can use. All other entries call /api/v1/admin/**
 * and are ADMIN-only.
 */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { labelKey: 'dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN'], group: 'operations' },
  {
    labelKey: 'moderationQueue',
    path: '/admin/moderation',
    icon: ShieldCheck,
    roles: ['ADMIN'],
    badgeKpi: 'pendingModeration',
    group: 'operations',
  },
  { labelKey: 'rooms', path: '/admin/rooms', icon: Home, roles: ['ADMIN'], group: 'operations' },
  { labelKey: 'users', path: '/admin/users', icon: Users, roles: ['ADMIN'], group: 'operations' },
  { labelKey: 'adminCatalog', path: '/admin/catalog', icon: Layers, roles: ['ADMIN'], group: 'content' },
  { labelKey: 'adminPricingNav', path: '/admin/pricing', icon: LineChart, roles: ['ADMIN'], group: 'finance' },
  { labelKey: 'adminServiceReviews', path: '/admin/service-reviews', icon: Star, roles: ['ADMIN'], group: 'content' },
  { labelKey: 'tickets', path: '/admin/tickets', icon: MessageSquare, roles: ['ADMIN', 'SUPPORT'], group: 'operations' },
  { labelKey: 'adminFeedbackNav', path: '/admin/feedback', icon: Inbox, roles: ['ADMIN'], group: 'operations' },
  {
    labelKey: 'disputes',
    path: '/admin/disputes',
    icon: Scale,
    roles: ['ADMIN'],
    badgeKpi: 'openDisputes',
    group: 'operations',
  },
  { labelKey: 'refunds', path: '/admin/refunds', icon: Undo2, roles: ['ADMIN'], group: 'finance' },
  { labelKey: 'adminFinanceNav', path: '/admin/finance', icon: Wallet, roles: ['ADMIN'], group: 'finance' },
  { labelKey: 'adminLogs', path: '/admin/logs', icon: FileText, roles: ['ADMIN'], group: 'system' },
  { labelKey: 'adminAboutNav', path: '/admin/about', icon: Info, roles: ['ADMIN'], group: 'content' },
  { labelKey: 'adminNewsNav', path: '/admin/news', icon: Newspaper, roles: ['ADMIN'], group: 'content' },
  { labelKey: 'adminStoriesNav', path: '/admin/stories', icon: Sparkles, roles: ['ADMIN'], group: 'content' },
  { labelKey: 'adminLegalNav', path: '/admin/legal', icon: ScrollText, roles: ['ADMIN'], group: 'content' },
  { labelKey: 'adminBackToSite', path: '/', icon: ExternalLink, roles: ['ADMIN', 'SUPPORT'], group: 'system' },
];

export function findNavItem(pathname: string): AdminNavItem | undefined {
  // Match on exact prefix so /admin/users/123 still resolves to /admin/users.
  return ADMIN_NAV_ITEMS.find((it) => pathname === it.path || pathname.startsWith(it.path + '/'));
}

export function isRoleAllowedFor(item: AdminNavItem, role: string | null | undefined): boolean {
  return role != null && (item.roles as readonly string[]).includes(role);
}

/**
 * Default landing page after staff login: dashboard for ADMIN, tickets for
 * SUPPORT (the only section they can actually use today).
 */
export function defaultLandingForRole(role: string | null | undefined): string {
  if (role === 'SUPPORT') return '/admin/tickets';
  return '/admin/dashboard';
}
