# INSPECAR

Sistema web responsive / PWA para peritaje, chequeo y diagnóstico mecánico pre-compra de automóviles usados ante la compra.

## Características

- **Base de datos precargada** de marcas y modelos principales de Argentina (Fiat, Volkswagen, Toyota, Ford, Renault, Peugeot, Chevrolet, etc.) y opción de carga manual.
- **Tipos de carrocería**: Pick-up (con caja), Sedán (con baúl), Hatchback (sin baúl) y SUV / Camioneta cerrada, cada uno con su plano propio. (Furgones y utilitarios fueron retirados.)
- **Checklist técnico completo** con calificaciones B (Bueno), R (Regular), M (Malo), intermedias (B/R y R/M) y N/A (no aplica):
  - Interior (20 ítems; 22 en pick-ups con caja de carga)
  - Exterior (17 ítems)
  - Mecánica (18 ítems)
  - Accesorios de emergencia (SÍ / NO)
- **Planos CAD técnicos realistas**: 5 vistas independientes (Lateral Derecho, Lateral Izquierdo, Frente, Trasera, Planta/Techo) con marcado táctil directo de detalles de chapa y pintura (Dañado, Repintado, Rayón, Bollo).
- **Generación y descarga de PDF profesional** con plano de daños numerado; en celulares compatibles se comparte directo por WhatsApp/mail.
- **Autoguardado** en el dispositivo e **Historial** de inspecciones (buscar por patente, reabrir, volver a bajar el PDF).
- **App instalable y offline (PWA)**: se agrega a la pantalla de inicio y funciona sin internet, incluido el PDF.

## Tecnologías

- React 19 + TypeScript
- Vite
- Tailwind CSS
- jsPDF + jspdf-autotable
- Lucide React
