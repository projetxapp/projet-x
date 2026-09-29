import { expect, test } from '@playwright/test';

import { gotoHydrated, latestEmail, linkFrom, login } from './helpers';

// Seeded account reserved for this test (supabase/seed.sql).
const EMAIL = 'camille@projetx.test';

test('forgot password → email → new password → sign in with it', async ({ page }) => {
  const password = `nouveau-${Date.now()}`;
  const since = Date.now();
  await gotoHydrated(page, '/reset');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByRole('button', { name: /Envoyer le lien/ }).click();
  await expect(page.getByText(/(email|lien).*(envoy|arriv)/i).first()).toBeVisible();

  const mail = await latestEmail(EMAIL, since);
  const link = linkFrom(mail.html, '/update-password');
  expect(link).toContain('type=recovery');

  await gotoHydrated(page, link.replace(/^https?:\/\/[^/]+/, ''));
  await page.getByLabel('Nouveau mot de passe').fill(password);
  await page.getByLabel('Confirmation').fill(password);
  await page.getByRole('button', { name: /Mettre à jour/ }).click();
  await page.waitForURL(/\/(home|login)/, { timeout: 30_000 });

  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await login(page, EMAIL, password);
  await expect(page.getByText(/Camille/).first()).toBeVisible();
});
