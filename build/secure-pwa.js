import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

// Cache only files emitted by this build and public assets; never runtime data.
export function serviceWorkerSource(version, files) {
  return `const CACHE = ${JSON.stringify(`ledger-shell-${version}`)};
const FILES = ${JSON.stringify(files)};
const PUBLIC_PATHS = new Set(FILES);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name =>
    (name.startsWith('ledger-shell-') && name !== CACHE) || name.startsWith('workbox-precache-') ||
    name === 'supabase-api' || name.startsWith('supabase-api-')
  ).map(name => caches.delete(name)))));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (url.hostname.endsWith('.supabase.co') || (sameOrigin && url.pathname.startsWith('/api/'))) {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-store' })));
    return;
  }
  if (!sameOrigin || event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    // Auth callbacks keep their original URL; only the public shell is an offline fallback.
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match('/index.html')) || Response.error();
    }));
    return;
  }
  if (PUBLIC_PATHS.has(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
  }
});`;
}

export function securePwa() {
  return {
    name: 'ledger-public-shell-pwa', enforce: 'post',
    generateBundle(_options, bundle) {
      const publicFiles = readdirSync(new URL('../public/', import.meta.url), { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile()).map(entry => {
          const base = entry.parentPath || entry.path;
          return new URL(`${base}/${entry.name}`, 'file:').pathname.split('/public/')[1];
        });
      const files = [...new Set(['/index.html', ...Object.keys(bundle).map(name => `/${name}`), ...publicFiles.map(name => `/${name}`)])].sort();
      const hash = createHash('sha256');
      for (const item of Object.values(bundle)) hash.update(item.type === 'chunk' ? item.code : String(item.source));
      for (const path of publicFiles) hash.update(readFileSync(new URL(`../public/${path}`, import.meta.url)));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource(hash.digest('hex').slice(0,20), files) });
    },
  };
}
