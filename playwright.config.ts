import { defineConfig, devices } from '@playwright/test';

// Release matrix:
// - `chromium`: full regression, responsive and accessibility suites
//   (tests/e2e/*.spec.ts) on Desktop Chrome.
// - critical cross-browser/device suite (tests/e2e/matrix) on Desktop
//   Chromium, Firefox and WebKit, Pixel 7 (mobile Chrome), iPhone 15 and
//   iPad (gen 7) WebKit, plus one phone and one tablet in landscape.
// Every project listed here runs in CI; do not claim support for a browser
// that is not exercised below.
const MATRIX = /matrix[\\/].*\.spec\.ts$/;
const DESKTOP_SUITES = /e2e[\\/][^\\/]+\.spec\.ts$/;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
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
    {
      name: 'chromium',
      testMatch: DESKTOP_SUITES,
      use: { ...devices['Desktop Chrome'] },
    },
    { name: 'matrix-chromium', testMatch: MATRIX, use: { ...devices['Desktop Chrome'] } },
    { name: 'matrix-firefox', testMatch: MATRIX, use: { ...devices['Desktop Firefox'] } },
    { name: 'matrix-webkit', testMatch: MATRIX, use: { ...devices['Desktop Safari'] } },
    { name: 'matrix-mobile-chrome', testMatch: MATRIX, use: { ...devices['Pixel 7'] } },
    { name: 'matrix-iphone', testMatch: MATRIX, use: { ...devices['iPhone 15'] } },
    {
      name: 'matrix-iphone-landscape',
      testMatch: MATRIX,
      use: { ...devices['iPhone 15 landscape'] },
    },
    { name: 'matrix-ipad', testMatch: MATRIX, use: { ...devices['iPad (gen 7)'] } },
    {
      name: 'matrix-ipad-landscape',
      testMatch: MATRIX,
      use: { ...devices['iPad (gen 7) landscape'] },
    },
  ],
});
