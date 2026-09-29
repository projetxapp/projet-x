import { expect, type Page } from '@playwright/test';

export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';
export const DEMO = { email: 'demo@projetx.test', password: 'projetx-demo' };

/** Waits until React has hydrated the statically rendered page. */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector('html[data-hydrated="true"]', { timeout: 60_000 });
}

export async function login(page: Page, email = DEMO.email, password = DEMO.password) {
  await gotoHydrated(page, '/login');
  await page.getByLabel(/email/i).first().fill(email);
  await page
    .getByLabel(/mot de passe/i)
    .first()
    .fill(password);
  await page
    .getByRole('button', { name: /se connecter/i })
    .last()
    .click();
  await page.waitForURL('**/home');
}

type MailpitMessage = { ID: string; Subject: string; Created: string; To: { Address: string }[] };

/** Latest email sent to `to` (Supabase local Mailpit), optionally only those received after `since` (ms). */
export async function latestEmail(
  to: string,
  since = 0,
): Promise<{ subject: string; html: string }> {
  let message: MailpitMessage | undefined;
  await expect
    .poll(
      async () => {
        const res = await fetch(
          `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
        );
        const body = (await res.json()) as { messages: MailpitMessage[] };
        message = body.messages.find((m) => new Date(m.Created).getTime() >= since - 1000);
        return Boolean(message);
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  const res = await fetch(`${MAILPIT_URL}/api/v1/message/${message!.ID}`);
  const full = (await res.json()) as { Subject: string; HTML: string };
  return { subject: full.Subject, html: full.HTML };
}

export function linkFrom(html: string, pathPart: string): string {
  const match = html.match(new RegExp(`href="([^"]*${pathPart}[^"]*)"`));
  if (!match?.[1]) throw new Error(`No ${pathPart} link in email`);
  return match[1].replace(/&amp;/g, '&');
}
