import { expect, test } from '@playwright/test';

import { login } from './helpers';

// Uses the deterministic local seed (supabase/seed.sql): EcoTrack's founder super-liked the demo account.
test('swipe: real scores, pass, like → match popup → conversation', async ({ page }) => {
  await login(page);
  await page.goto('/swipe');
  const topCard = page.locator('[aria-label^="Profil "]').last();
  await expect(topCard).toHaveAttribute('aria-label', /% compatible/);

  const first = await topCard.getAttribute('aria-label');
  await page.getByTestId('swipe-pass').click();
  await expect(page.locator('[aria-label^="Profil "]').last()).not.toHaveAttribute(
    'aria-label',
    first!,
  );

  const sendMessage = page.getByTestId('match-send-message');
  for (let i = 0; i < 12 && !(await sendMessage.isVisible()); i++) {
    await page.getByTestId('swipe-like').click();
    await page.waitForTimeout(900);
  }
  await expect(page.getByText("C'est un Match !")).toBeVisible();
  await sendMessage.click();
  await expect(page).toHaveURL(/\/chat\//);
  await page.getByTestId('chat-input').fill('Hello depuis le test E2E 👋');
  await page.getByTestId('chat-send').click();
  await expect(page.getByText('Hello depuis le test E2E 👋')).toBeVisible();
});
