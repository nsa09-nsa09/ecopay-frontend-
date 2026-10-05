import { defineConfig, devices } from '@playwright/test';

// The full regression suite runs on Chromium only (fast, deterministic).
// A small launch-critical suite — tagged `@critical` in the spec titles —
// additionally runs on every supported browser and device so a WebKit- or
// mobile-only regression in a money / auth / phantom-success flow is caught
// before release. CI must provision the browser binaries first:
//   npx playwright install --with-deps chromium firefox webkit
const CRITICAL = /@critical/;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  // Mobile WebKit cold-loads lazy chunks noticeably slower than Chromium, and
  // the critical matrix runs several projects serially; the default 5s
  // assertion timeout is too tight for the last mobile project under load
  // (the flows themselves pass — verified in isolation). 10s gives headroom
  // without masking a genuinely stuck render.
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    // Full regression + critical suite.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Critical-only suite across the browser / device matrix.
    {
      name: 'firefox-critical',
      grep: CRITICAL,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-critical',
      grep: CRITICAL,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome-critical',
      grep: CRITICAL,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'iphone-webkit-critical',
      grep: CRITICAL,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'ipad-webkit-critical',
      grep: CRITICAL,
      use: { ...devices['iPad Pro 11'] },
    },
  ],
});
