/**
 * Post-export step for the web build: the landing page (dist/index.html) is statically
 * rendered by Expo Router, so it is shipped WITHOUT the app bundle (instant load,
 * Lighthouse-friendly). Links are plain <a href>, the demo is CSS.
 *  - removes the hydration scripts,
 *  - prefetches the app bundle at idle priority (next page loads instantly),
 *  - sends signed-in visitors straight to /home.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const file = join(dist, 'index.html');
let html = readFileSync(file, 'utf8');

const bundles = [...html.matchAll(/<script src="([^"]+\.js)"[^>]*><\/script>/g)].map((m) => m[1]);
if (bundles.length === 0) {
  console.error('static-landing: no bundle script found in index.html (already processed?)');
  process.exit(1);
}

html = html
  .replace(/<script src="[^"]+\.js"[^>]*><\/script>/g, '')
  .replace(/<script type="module">globalThis\.__EXPO_ROUTER_HYDRATE__=true;<\/script>/g, '')
  .replace(/<link rel="preload" href="[^"]+\.js" as="script">/g, '');

// supabase-js keeps the session under our storage key ('px-auth', see src/lib/supabase.ts).
const redirect = `<script>(function(){try{var s=JSON.parse(localStorage.getItem('px-auth')||'null');if(s&&s.refresh_token)location.replace('/home');}catch(e){}})();</script>`;
const prefetch = bundles.map((src) => `<link rel="prefetch" href="${src}" as="script">`).join('');
html = html.replace('</head>', `${redirect}${prefetch}</head>`);

if (/__EXPO_ROUTER_HYDRATE__|<script src=/.test(html)) {
  console.error('static-landing: hydration markers left in index.html');
  process.exit(1);
}
writeFileSync(file, html);
console.log(
  `static-landing: ${file} is now JavaScript-free (${bundles.length} bundle(s) prefetched).`,
);
