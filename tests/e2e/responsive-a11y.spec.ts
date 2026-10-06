import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { horizontalOverflow, installMockBackend, type Role } from './support/mock-backend';

// Responsive sweep and accessibility smoke checks (Chromium). Real device
// engines (WebKit/Firefox/mobile) are covered by tests/e2e/matrix.

const WIDTHS = [320, 360, 390, 412, 768, 1024, 1440];

const ROUTES: Array<{ path: string; role: Role; ready: (page: Page) => Promise<void> }> = [
  {
    path: '/',
    role: 'ANON',
    ready: (p) => expect(p.getByRole('button', { name: /StreamPlus/ }).first()).toBeVisible(),
  },
  {
    path: '/login',
    role: 'ANON',
    ready: (p) => expect(p.getByRole('textbox').first()).toBeVisible(),
  },
  {
    path: '/register',
    role: 'ANON',
    ready: (p) => expect(p.getByRole('textbox').first()).toBeVisible(),
  },
  {
    path: '/how-it-works',
    role: 'ANON',
    ready: (p) => expect(p.locator('main h1, main h2').first()).toBeVisible(),
  },
  {
    path: '/rooms/member/100',
    role: 'USER',
    ready: (p) => expect(p.getByRole('button', { name: /^Pay\s/ })).toBeVisible(),
  },
  {
    path: '/payment/confirmation?intentId=w1&roomId=100',
    role: 'USER',
    ready: (p) => expect(p.getByRole('status').first()).toBeVisible(),
  },
  {
    path: '/payments/history',
    role: 'USER',
    ready: (p) => expect(p.getByText('Family plan room').first()).toBeVisible(),
  },
  {
    path: '/payment/payout',
    role: 'USER',
    ready: (p) => expect(p.getByRole('button', { name: 'Connect payout card' })).toBeVisible(),
  },
  {
    path: '/admin/dashboard',
    role: 'ADMIN',
    ready: (p) => expect(p.getByRole('heading', { name: 'Business' })).toBeVisible(),
  },
  {
    path: '/admin/finance',
    role: 'ADMIN',
    ready: (p) => expect(p.getByRole('button', { name: 'PAYMENT REVIEW' })).toBeVisible(),
  },
];

/** Pairs of visible header controls whose boxes intersect (one hides the other). */
async function headerOverlaps(page: Page) {
  return page.evaluate(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('nav a, nav button, nav input'),
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !el.closest('#eco-mobile-menu');
    });
    // Skip elements nested in another candidate (e.g. a button inside a link).
    const roots = els.filter((el) => !els.some((other) => other !== el && other.contains(el)));
    const hits: string[] = [];
    for (let i = 0; i < roots.length; i += 1) {
      for (let j = i + 1; j < roots.length; j += 1) {
        const a = roots[i].getBoundingClientRect();
        const b = roots[j].getBoundingClientRect();
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 1 && overlapY > 1) {
          const name = (el: HTMLElement) =>
            (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 20);
          hits.push(`${name(roots[i])}/${name(roots[j])}`);
        }
      }
    }
    return hits;
  });
}

for (const width of WIDTHS) {
  test(`no horizontal page overflow at ${width}px`, async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    const failures: string[] = [];
    for (const route of ROUTES) {
      const context = await browser.newContext({
        baseURL,
        viewport: { width, height: width < 768 ? 800 : 900 },
      });
      const page = await context.newPage();
      await installMockBackend(page, { role: route.role, intentStatuses: { w1: ['SUCCESS'] } });
      await page.goto(route.path);
      await route.ready(page);
      const overflow = await horizontalOverflow(page);
      if (overflow > 1) failures.push(`${route.path}: ${overflow}px`);
      const overlaps = await headerOverlaps(page);
      if (overlaps.length) failures.push(`${route.path}: header overlap ${overlaps.join(', ')}`);
      await context.close();
    }
    expect(failures).toEqual([]);
  });
}

test('primary buttons meet the WCAG 2.2 minimum target size on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await installMockBackend(page, { role: 'USER' });
  for (const path of ['/', '/rooms/member/100', '/payment/payout']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          const visible =
            rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
          return visible && (rect.width < 24 || rect.height < 24);
        })
        .map(
          (el) =>
            el.getAttribute('aria-label') || el.textContent?.trim() || el.outerHTML.slice(0, 60),
        ),
    );
    expect(small, `${path} small targets`).toEqual([]);
  }
});

test('reduced motion disables decorative animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installMockBackend(page, { role: 'ANON' });
  await page.goto('/');
  const behavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(behavior).toBe('auto');
});

// Color contrast of the brand palette is tracked separately (design decision);
// every other WCAG 2.x A/AA rule must pass on these production-critical pages.
const AXE_DISABLED_RULES = ['color-contrast'];

for (const route of [
  { path: '/', role: 'ANON' as Role },
  { path: '/login', role: 'ANON' as Role },
  { path: '/register', role: 'ANON' as Role },
  { path: '/rooms/member/100', role: 'USER' as Role },
  { path: '/payment/confirmation?intentId=a1&roomId=100', role: 'USER' as Role },
  { path: '/payment/payout', role: 'USER' as Role },
  { path: '/admin/dashboard', role: 'ADMIN' as Role },
]) {
  test(`axe: no serious accessibility violations on ${route.path}`, async ({ page }) => {
    await installMockBackend(page, { role: route.role, intentStatuses: { a1: ['PENDING'] } });
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .disableRules(AXE_DISABLED_RULES)
      .analyze();
    const serious = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map(
        (v) =>
          `${v.id}: ${v.nodes
            .map((n) => n.target.join(' '))
            .slice(0, 5)
            .join(' | ')}`,
      );
    expect(serious).toEqual([]);
  });
}
