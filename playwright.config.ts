import { defineConfig, devices } from '@playwright/test';

// Release matrix (every project runs in `npm run test:e2e`, hence in the
// release gate and CI):
// - `chromium`: full regression, payment, responsive and accessibility suites
//   (tests/e2e/*.spec.ts) on Desktop Chrome.
// - the `matrix-*` projects run the launch-critical suite on Desktop Chromium,
//   Firefox and WebKit, Pixel 7 (mobile Chrome), iPhone 15 and iPad (gen 7)
//   WebKit, plus one phone and one tablet in landscape. That suite is
//   tests/e2e/matrix plus every test tagged `@critical` in its title.
// CI must provision the browser binaries first:
//   npx playwright install --with-deps chromium firefox webkit
// Do not claim support for a browser that is not exercised below.
const MATRIX = /matrix[\/].*\.spec\.ts$/;
const DESKTOP_SUITES = /e2e[\/][^\/]+\.spec\.ts$/;
const CRITICAL = /@critical/;

/** Matrix projects: the whole matrix suite, plus `@critical` tests from the other suites. */
const matrix = (name: string, device: (typeof devices)[string]) => ({
  name,
  testMatch: [MATRIX, DESKTOP_SUITES],
  grep: CRITICAL,
  use: { ...device },
});

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  // Mobile WebKit cold-loads lazy chunks noticeably slower than Chromium, and
  // the critical matrix runs several projects serially; the default 5s
  // assertion timeout is too tight under load (the flows themselves pass —
  // verified in isolation). 10s gives headroom without masking a stuck render.
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    // Full regression on Chromium.
    {
      name: 'chromium',
      testMatch: DESKTOP_SUITES,
      use: { ...devices['Desktop Chrome'] },
    },
    // Launch-critical suite across the browser / device matrix.
    matrix('matrix-chromium', devices['Desktop Chrome']),
    matrix('matrix-firefox', devices['Desktop Firefox']),
    matrix('matrix-webkit', devices['Desktop Safari']),
    matrix('matrix-mobile-chrome', devices['Pixel 7']),
    matrix('matrix-iphone', devices['iPhone 15']),
    matrix('matrix-iphone-landscape', devices['iPhone 15 landscape']),
    matrix('matrix-ipad', devices['iPad (gen 7)']),
    matrix('matrix-ipad-landscape', devices['iPad (gen 7) landscape']),
  ],
});
