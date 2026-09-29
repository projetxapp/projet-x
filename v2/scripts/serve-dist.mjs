/**
 * Minimal static server for the exported web app (local checks + CI E2E).
 * Mirrors vercel.json: clean URLs, dynamic routes (/u/:id, /chat/:id), 404 page.
 *   node scripts/serve-dist.mjs [dir=dist] [port=8081]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] ?? 'dist';
const port = Number(process.argv[3] ?? 8081);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const DYNAMIC = [
  [/^\/u\/[^/]+\/?$/, '/u/[id].html'],
  [/^\/chat\/[^/]+\/?$/, '/chat/[id].html'],
];

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

createServer(async (req, res) => {
  const pathname = normalize(
    decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname),
  );
  const candidates = [pathname, `${pathname}.html`, join(pathname, 'index.html')];
  for (const [pattern, file] of DYNAMIC) if (pattern.test(pathname)) candidates.push(file);
  for (const candidate of candidates) {
    const file = join(root, candidate);
    if (await isFile(file)) {
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
      return;
    }
  }
  res.writeHead(404, { 'content-type': TYPES['.html'] });
  res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
