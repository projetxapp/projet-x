import { usePathname } from 'expo-router';
import Head from 'expo-router/head';

import { APP_NAME, APP_TAGLINE, SITE_URL } from '@/constants/brand';

type Props = {
  /** Page title without the brand suffix. Omit for the home page. */
  title?: string;
  description?: string;
  /** Private pages (app, auth flows): kept out of search engines. */
  noindex?: boolean;
  /** Canonical path; defaults to the current pathname. */
  path?: string;
  image?: string;
};

export const DEFAULT_DESCRIPTION =
  'Talents, porteurs de projet et investisseurs se trouvent en un swipe. Missions rémunérées, side projects, equity : crée ton profil gratuitement.';

/** Per-page <head> (title, description, canonical, Open Graph). Web only; no-op on native. */
export function PageHead({
  title,
  description = DEFAULT_DESCRIPTION,
  noindex = false,
  path,
  image,
}: Props) {
  const pathname = usePathname();
  const fullTitle = title ? `${title} — ${APP_NAME}` : `${APP_NAME} — ${APP_TAGLINE}`;
  const url = `${SITE_URL}${path ?? pathname}`;
  const ogImage = image ?? `${SITE_URL}/og-image.png`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <link rel="canonical" href={url} />
      )}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
