# INSPECAR

Sistema web responsive / PWA para peritaje, chequeo y diagnóstico mecánico pre-compra de automóviles usados ante la compra.

## Características

- **Base de datos precargada** de marcas y modelos principales de Argentina (Fiat, Volkswagen, Toyota, Ford, Renault, Peugeot, Chevrolet, etc.) y opción de carga manual.
- **Tipos de carrocería**: Pick-up (con caja), Sedán (con baúl), Hatchback (sin baúl), SUV / Camioneta cerrada, Furgón / Utilitario (estilo Renault Trafic).
- **Checklist técnico completo** con calificaciones B (Bueno), R (Regular), M (Malo) e intermedias (B/R y R/M):
  - Interior (22 ítems)
  - Exterior (17 ítems)
  - Mecánica (18 ítems)
  - Accesorios de emergencia (SÍ / NO)
- **Planos CAD técnicos realistas**: 5 vistas independientes (Lateral Derecho, Lateral Izquierdo, Frente, Trasera, Planta/Techo) con marcado táctil directo de detalles de chapa y pintura (Dañado, Repintado, Rayón, Bollo).
- **Generación y descarga de PDF profesional** de informe técnico con diseño geométrico de alta legibilidad listo para compartir por WhatsApp o descargar.
- **Autoguardado offline** en el almacenamiento local del dispositivo.

## Tecnologías

- React 19 + TypeScript
- Vite
- Tailwind CSS
- jsPDF + jspdf-autotable
- Lucide React
