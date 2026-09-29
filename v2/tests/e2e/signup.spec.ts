import { expect, test } from '@playwright/test';

import { gotoHydrated, latestEmail, linkFrom } from './helpers';

test('signup → onboarding → confirmation email → signed in on the right account', async ({
  page,
}) => {
  const email = `e2e.${Date.now()}@projetx.test`;
  await gotoHydrated(page, '/signup');

  // Step 1: infos
  await page.getByTestId('field-first-name').fill('Zoé');
  await page.getByTestId('field-last-name').fill('Testeuse');
  await page.getByTestId('field-age').fill('20');
  await page.getByTestId('field-email').fill(email);
  await page.getByTestId('field-password').fill('motdepasse-e2e-1');
  await page.getByTestId('onboarding-next').click();

  // Step 2: roles
  await page.getByTestId('role-talent').click();
  await page.getByTestId('onboarding-next').click();

  // Talent step (skills optional), photo (skippable), recap → create.
  await page.getByText('+ Figma', { exact: true }).first().click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();

  await expect(page).toHaveURL(/verify-email/);

  const mail = await latestEmail(email);
  expect(mail.subject).toMatch(/Confirme/i);
  const link = linkFrom(mail.html, '/confirm');
  expect(link).toContain('token_hash=');

  await page.goto(link.replace(/^https?:\/\/[^/]+/, ''));
  await page.waitForURL('**/home', { timeout: 30_000 });
  await expect(page.getByText(/Zoé/).first()).toBeVisible();
  await expect(page.getByText(/Mode talent/)).toBeVisible();
});
