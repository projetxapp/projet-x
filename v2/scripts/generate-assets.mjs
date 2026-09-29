/**
 * Generates every brand asset from code (logo = ✦ sparkle in a rounded square, brand
 * gradient #6D28D9 → #0891B2): app icon, Android adaptive/monochrome icons, splash,
 * notification icon, favicons, PWA icons and the Open Graph image.
 *   node scripts/generate-assets.mjs            (uses Playwright's Chromium)
 *   PW_CHROMIUM_PATH=/path/to/chrome node scripts/generate-assets.mjs
 */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { chromium } from '@playwright/test';

const VIOLET = '#6D28D9';
const CYAN = '#0891B2';
const BG = '#08070F';
const STAR = 'M50 0 C54 36 64 46 100 50 C64 54 54 64 50 100 C46 64 36 54 0 50 C36 46 46 36 50 0 Z';

const gradient = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${VIOLET}"/><stop offset="1" stop-color="${CYAN}"/></linearGradient>`;

/** Square SVG: optional gradient background (radius in % of size), white star scaled to `star`. */
function mark({ size, radius = 0, star = 0.5, background = true, color = '#FFFFFF' }) {
  const s = size * star;
  const offset = (size - s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>${gradient('g')}</defs>
    ${background ? `<rect width="${size}" height="${size}" rx="${size * radius}" fill="url(#g)"/>` : ''}
    <path d="${STAR}" fill="${color}" transform="translate(${offset} ${offset}) scale(${s / 100})"/>
  </svg>`;
}

const OG = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&display=block" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:${BG};font-family:Inter,'Liberation Sans',sans-serif;color:#F0EEFF;overflow:hidden;position:relative}
  .glow1{position:absolute;width:700px;height:700px;left:-200px;top:-260px;background:radial-gradient(circle,${VIOLET}66,transparent 65%)}
  .glow2{position:absolute;width:700px;height:700px;right:-220px;bottom:-320px;background:radial-gradient(circle,${CYAN}55,transparent 65%)}
  .wrap{position:absolute;inset:0;padding:72px 80px;display:flex;justify-content:space-between;align-items:center}
  .left{width:640px;display:flex;flex-direction:column;gap:28px}
  .brand{display:flex;align-items:center;gap:16px;font-weight:900;font-size:34px;letter-spacing:-1px}
  h1{font-size:78px;line-height:80px;font-weight:900;letter-spacing:-3px}
  p{font-size:28px;line-height:38px;color:#A5A1C2;font-weight:500}
  .pills{display:flex;gap:12px}
  .pill{padding:10px 20px;border-radius:999px;font-size:22px;font-weight:700}
  .card{width:330px;height:440px;border-radius:32px;background:#111019;border:1px solid rgba(240,238,255,.08);overflow:hidden;transform:rotate(6deg);box-shadow:0 30px 80px rgba(0,0,0,.5)}
  .media{height:250px;background:linear-gradient(135deg,${CYAN},#06B6D4);display:flex;align-items:center;justify-content:center;font-size:96px;position:relative}
  .score{position:absolute;top:16px;left:16px;background:rgba(0,0,0,.45);color:#fff;border-radius:999px;padding:8px 14px;font-size:18px;font-weight:900}
  .body{padding:22px;display:flex;flex-direction:column;gap:10px}
  .name{font-size:30px;font-weight:900;letter-spacing:-1px}
  .ok{color:#4ADE80;font-size:18px;font-weight:700}
  .stamp{position:absolute;top:60px;left:26px;border:5px solid #4ADE80;color:#4ADE80;border-radius:14px;padding:4px 14px;font-size:34px;font-weight:900;transform:rotate(-14deg)}
</style></head><body>
<div class="glow1"></div><div class="glow2"></div>
<div class="wrap">
  <div class="left">
    <div class="brand">${mark({ size: 56, radius: 0.3, star: 0.52 })}Projet X</div>
    <h1>Le Tinder de l'entrepreneuriat.</h1>
    <p>Talents, porteurs de projet et investisseurs se trouvent en un swipe.</p>
    <div class="pills">
      <span class="pill" style="background:${VIOLET}33;color:#A78BFA">⚡ Talents</span>
      <span class="pill" style="background:${CYAN}33;color:#22D3EE">🚀 Projets</span>
      <span class="pill" style="background:#B4530933;color:#FCD34D">💎 Investisseurs</span>
    </div>
  </div>
  <div class="card">
    <div class="media">🌱<span class="score">92 % compatible</span><span class="stamp">REJOINDRE</span></div>
    <div class="body"><div class="name">EcoTrack</div><div style="color:#A5A1C2;font-size:18px">GreenTech · Prototype</div>
      <div class="ok">✓ 2 compétences recherchées</div><div class="ok">✓ Même département (49)</div></div>
  </div>
</div></body></html>`;

const svgPage = (svg, size) =>
  `<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style></head><body style="width:${size}px;height:${size}px">${svg}</body></html>`;

const ASSETS = [
  // Native (Expo config)
  ['assets/images/icon.png', 1024, mark({ size: 1024, star: 0.46 })],
  ['assets/images/android-icon-background.png', 1024, mark({ size: 1024, star: 0 })],
  [
    'assets/images/android-icon-foreground.png',
    1024,
    mark({ size: 1024, star: 0.34, background: false }),
  ],
  [
    'assets/images/android-icon-monochrome.png',
    1024,
    mark({ size: 1024, star: 0.34, background: false }),
  ],
  ['assets/images/splash-icon.png', 512, mark({ size: 512, radius: 0.28, star: 0.5 })],
  ['assets/images/notification-icon.png', 96, mark({ size: 96, star: 0.72, background: false })],
  ['assets/images/favicon.png', 48, mark({ size: 48, radius: 0.28, star: 0.56 })],
  // Web (public/ is copied as-is to the site root)
  ['public/favicon.png', 64, mark({ size: 64, radius: 0.28, star: 0.56 })],
  ['public/icons/apple-touch-icon.png', 180, mark({ size: 180, star: 0.48 })],
  ['public/icons/icon-192.png', 192, mark({ size: 192, radius: 0.22, star: 0.5 })],
  ['public/icons/icon-512.png', 512, mark({ size: 512, radius: 0.22, star: 0.5 })],
  ['public/icons/maskable-512.png', 512, mark({ size: 512, star: 0.36 })],
];

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
for (const [path, size, svg] of ASSETS) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(svgPage(svg, size));
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({
    path,
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  await page.close();
  console.log(`✓ ${path} (${size}×${size})`);
}
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.setContent(OG, { waitUntil: 'networkidle' });
await og.evaluate(() => document.fonts.ready);
mkdirSync('public', { recursive: true });
await og.screenshot({ path: 'public/og-image.png' });
console.log('✓ public/og-image.png (1200×630)');
await browser.close();
