import { expect, test } from '@playwright/test';

test('landing: hero, three profiles and CTA to signup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("l'entrepreneuriat");
  await expect(page.getByText('Talents', { exact: true })).toBeVisible();
  await expect(page.getByText('Porteurs de projet', { exact: true })).toBeVisible();
  await expect(page.getByText('Investisseurs', { exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/Projet X/);
  // The CTA is a real link (works before / without hydration).
  const cta = page.getByTestId('landing-cta');
  await expect(cta).toHaveAttribute('href', '/signup');
  await cta.click();
  await expect(page).toHaveURL(/\/signup/);
});

test('legal pages are public', async ({ page }) => {
  await page.goto('/cgu');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    "Conditions générales d'utilisation",
  );
  await page.goto('/confidentialite');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Politique de confidentialité',
  );
});
