import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Modo offline / app instalable: sólo en producción (en `npm run dev` el SW molestaría con la caché)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // Al volver a la app, buscar si hay una versión nueva publicada
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      })
      .catch((err) => console.error('SW no registrado', err));
    watchForNewVersion();

    // Precarga en segundo plano el generador de PDF para que también funcione sin internet
    const prefetch = () => import('./utils/pdfGenerator').catch(() => {});
    if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch, { timeout: 5000 });
    else setTimeout(prefetch, 3000);
  });
}

/**
 * Actualización automática. La app instalada en el celular queda abierta en segundo plano y no
 * vuelve a cargar la página, así que nunca tomaba los cambios publicados. Al volver a la app
 * (y cada 5 min) se compara el index.html publicado con el que está corriendo; si cambió, se recarga.
 * La planilla no se pierde: se guarda en el dispositivo al instante y se sube a la nube al recargar.
 */
function watchForNewVersion() {
  const current = (document.querySelector('script[type="module"][src*="/assets/"]') as HTMLScriptElement | null)?.src;
  if (!current) return;
  const currentPath = new URL(current).pathname;
  let reloading = false;
  const check = async () => {
    if (reloading || !navigator.onLine || document.visibilityState !== 'visible') return;
    try {
      const html = await (await fetch(`/index.html?v=${Date.now()}`, { cache: 'no-store' })).text();
      const published = html.match(/\/assets\/index-[^"']+\.js/)?.[0];
      if (published && published !== currentPath) {
        reloading = true;
        setTimeout(() => location.reload(), 800); // deja terminar el guardado local
      }
    } catch {
      /* sin señal: se reintenta después */
    }
  };
  document.addEventListener('visibilitychange', check);
  window.addEventListener('online', check);
  setInterval(check, 5 * 60_000);
  check();
}
