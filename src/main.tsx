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
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW no registrado', err));

    // Precarga en segundo plano el generador de PDF para que también funcione sin internet
    const prefetch = () => import('./utils/pdfGenerator').catch(() => {});
    if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch, { timeout: 5000 });
    else setTimeout(prefetch, 3000);
  });
}
