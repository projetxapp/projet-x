import { defineConfig, devices } from '@playwright/test';

/**
 * Web E2E (landing, signup, swipe) against a running app + the local Supabase stack
 * (`npm run db:start`, then `npm run web` or a static build served on E2E_BASE_URL).
 * Emails are read from the local Mailpit (Supabase "inbucket") API.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8081',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
    colorScheme: 'dark',
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
});
