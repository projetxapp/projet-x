import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Applies the saved theme before the first paint (no light/dark flash). Dark by default.
const THEME_BOOTSTRAP = `(function(){try{var p=localStorage.getItem('px-theme');var d=p==='light'?false:p==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:true;var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';r.style.backgroundColor=d?'#08070F':'#F4F2FF';}catch(e){document.documentElement.classList.add('dark');}})();`;

// Base styles + the landing's CSS-only swipe demo (the landing ships without JavaScript).
const BASE_CSS = `body{overscroll-behavior-y:none;}#root{display:flex;min-height:100%;}
@keyframes px-swipe-top{0%,72%{transform:none;opacity:1;animation-timing-function:cubic-bezier(.33,1,.68,1)}100%{transform:translateX(260px) rotate(18deg);opacity:.1}}
@keyframes px-swipe-back{0%,72%{transform:scale(.94) translateY(14px);animation-timing-function:cubic-bezier(.33,1,.68,1)}100%{transform:none}}
@keyframes px-swipe-stamp{0%,72%{opacity:0}82%,100%{opacity:1}}
.px-swipe-top{animation:px-swipe-top 1.92s infinite}
.px-swipe-back{animation:px-swipe-back 1.92s infinite}
.px-swipe-stamp{animation:px-swipe-stamp 1.92s infinite}
@media (prefers-reduced-motion:reduce){.px-swipe-top,.px-swipe-back,.px-swipe-stamp{animation:none}}`;

/** Web document (static rendering). Per-page title/description/OG tags come from <PageHead>. */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr" className="dark" style={{ backgroundColor: '#08070F' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <meta name="theme-color" content="#08070F" />
        <meta name="color-scheme" content="dark light" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Projet X" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Projet X" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
