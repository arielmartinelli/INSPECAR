# INSPECAR

Sistema web responsive / PWA para peritaje, chequeo y diagnóstico mecánico pre-compra de automóviles usados ante la compra.

## Características

- **Base de datos precargada** de marcas y modelos principales de Argentina (Fiat, Volkswagen, Toyota, Ford, Renault, Peugeot, Chevrolet, etc.) y opción de carga manual.
- **Tipos de carrocería**: Pick-up, Sedán, Hatchback, SUV, Coupé (usa la silueta de sedán) y Furgón / Utilitario (4 vistas, sin techo).
- **Checklist técnico completo** con calificaciones B (Bueno), R (Regular), M (Malo), intermedias (B/R y R/M) y N/A (no aplica):
  - Interior (20 ítems; 22 en pick-ups con caja de carga)
  - Exterior (17 ítems)
  - Mecánica (18 ítems)
  - Accesorios de emergencia (SÍ / NO)
- **Planos CAD técnicos realistas**: 5 vistas independientes (Lateral Derecho, Lateral Izquierdo, Frente, Trasera, Planta/Techo) con marcado táctil directo de detalles de chapa y pintura (Dañado, Repintado, Rayón, Bollo).
- **Generación y descarga de PDF profesional** con plano de daños numerado; en celulares compatibles se comparte directo por WhatsApp/mail.
- **Observaciones por sección** (interior, exterior, mecánica, accesorios, chapa) que se juntan solas en el informe.
- **Daños de chapa**: Dañado, Repintado, Rayón y Reemplazado.
- **Base de datos (Supabase) con acceso por PIN**: registros con búsqueda por patente, nombre o DNI, estados (Borrador → Finalizada → Entregada → Compró / No compró) y notas de seguimiento. Sin configurar, funciona sólo en el dispositivo. Ver `docs/CONFIGURAR_BASE_DE_DATOS.md`.
- **Informe de Mantenimiento Preventivo** (servicio adicional): recomendaciones en corto, mediano y largo plazo, con PDF propio.
- **Vista de PC** con barra lateral y **3 estilos** intercambiables (Clásico, Taller, Ficha técnica).
- **App instalable y offline (PWA)**: se agrega a la pantalla de inicio y funciona sin internet, incluido el PDF.

## Tecnologías

- React 19 + TypeScript
- Vite
- Tailwind CSS
- jsPDF + jspdf-autotable
- Lucide React
- Supabase (Postgres + Auth + RLS)
