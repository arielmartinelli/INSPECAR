/* INSPECAR – Service Worker: permite usar la app sin internet (en el taller, en la calle, etc.)
 *
 * Estrategias:
 *  - Páginas (navegación): primero red, si no hay conexión se usa la copia guardada.
 *  - /assets/* (JS/CSS con hash en el nombre, nunca cambian): primero caché.
 *  - Imágenes, logos y planos: se sirve la copia guardada y se actualiza en segundo plano.
 *
 * Si cambiás algo de este archivo, subí la versión para forzar la limpieza de cachés viejas.
 */
const VERSION = 'inspecar-v2';
// ignoreVary: el servidor responde con "Vary: Origin" y los <script type=module> mandan Origin,
// así que sin esto la copia guardada nunca coincidía y la app quedaba en blanco offline.
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const VIEWS = ['lateral_der', 'lateral_izq', 'frente', 'trasera', 'techo'];
const BODIES = ['pickup', 'sedan', 'hatchback', 'suv', 'furgon'];

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/logo.png',
  '/logo-card.jpg',
  '/icon-192.png',
  '/icon-512.png',
  // el furgón no tiene plano de techo
  ...BODIES.flatMap((b) => VIEWS.filter((v) => !(b === 'furgon' && v === 'techo')).map((v) => `/blueprints/crops/${b}_${v}.jpg`)),
  '/logo-white.png'
];

// Lee el index.html publicado para guardar también los JS/CSS de esta versión (sus nombres llevan hash)
const builtAssets = async () => {
  try {
    const html = await (await fetch('/index.html', { cache: 'no-store' })).text();
    return [...new Set(html.match(/\/assets\/[^"']+\.(?:js|css)/g) || [])];
  } catch {
    return [];
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      await shell.addAll(PRECACHE);
      const assets = await builtAssets();
      if (assets.length) await (await caches.open(RUNTIME)).addAll(assets);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1) Navegación: red primero, offline → index guardado
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html', { ignoreVary: true }))
    );
    return;
  }

  // 2) Archivos con hash: caché primero
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(RUNTIME).then((c) => c.put(request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // 3) Resto (imágenes, planos, íconos): copia guardada + actualización en segundo plano
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
