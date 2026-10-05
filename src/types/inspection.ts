export type ScoreValue = 'B' | 'B-R' | 'R' | 'R-M' | 'M' | 'NA' | null;
export type YesNoValue = 'SI' | 'NO' | null;

export type DamageView = 'lateral_izq' | 'lateral_der' | 'frente' | 'trasera' | 'techo';
/** Reemp = pieza reemplazada (pedido de Facu: reemplaza a "Bollo", que ahora se marca como Dañado). */
export type DamageType = 'D' | 'Rep' | 'Rayon' | 'Reemp';

export interface DamageMarker {
  id: string;
  view: DamageView;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: DamageType;
  note?: string;
}

/** Configuración única de tipos de daño (app + PDF). */
export const DAMAGE_TYPES: Record<DamageType, { label: string; short: string; color: string }> = {
  D: { label: 'Dañado', short: 'D', color: '#e11d48' },
  Rep: { label: 'Repintado', short: 'Rep', color: '#2563eb' },
  Rayon: { label: 'Rayón / Raspón', short: 'Ray', color: '#d97706' },
  Reemp: { label: 'Reemplazado', short: 'Rem', color: '#0d9488' }
};

/** Normaliza marcadores viejos: "Bollo" pasa a "Dañado". */
export const normalizeMarkers = (markers: unknown): DamageMarker[] =>
  Array.isArray(markers)
    ? markers.map((m) => ({ ...m, type: m.type in DAMAGE_TYPES ? m.type : 'D' }) as DamageMarker)
    : [];

/** Secciones con observaciones propias (se juntan en la observación general del informe). */
export type ObsSection = 'interior' | 'exterior' | 'mecanica' | 'accesorios' | 'carroceria';
export const OBS_SECTION_LABEL: Record<ObsSection, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  mecanica: 'Mecánica',
  accesorios: 'Accesorios',
  carroceria: 'Chapa y pintura'
};

/** Estado de seguimiento de cada inspección. */
export type Estado = 'borrador' | 'finalizada' | 'entregada' | 'compro' | 'no_compro';
export const ESTADOS: { id: Estado; label: string; tone: string }[] = [
  { id: 'borrador', label: 'Borrador', tone: 'bg-slate-100 text-slate-700 border-slate-400' },
  { id: 'finalizada', label: 'Finalizada', tone: 'bg-blue-50 text-blue-800 border-blue-500' },
  { id: 'entregada', label: 'Entregada', tone: 'bg-amber-50 text-amber-900 border-amber-500' },
  { id: 'compro', label: 'Compró', tone: 'bg-emerald-50 text-emerald-800 border-emerald-600' },
  { id: 'no_compro', label: 'No compró', tone: 'bg-rose-50 text-rose-800 border-rose-500' }
];

export interface VehicleInfo {
  tipoVehiculo: string;
  marca: string;
  marcaPersonalizada?: string;
  modelo: string;
  modeloPersonalizado?: string;
  version?: string;
  anio: string;
  dominio: string; // Patente
  combustible: string;
  kilometros: string;
  fecha: string;
  itvVtv: 'SI' | 'NO' | '';
  clienteNombre?: string;
  clienteDni?: string;
  clienteTelefono?: string;
}

export interface InspectionData {
  id: string;
  createdAt: string;
  vehicle: VehicleInfo;
  interior: Record<string, ScoreValue>;
  exterior: Record<string, ScoreValue>;
  mecanica: Record<string, ScoreValue>;
  accesorios: Record<string, YesNoValue>;
  damageMarkers: DamageMarker[];
  /** Observaciones generales adicionales (además de las de cada sección). */
  observaciones: string;
  obsSecciones?: Partial<Record<ObsSection, string>>;
  estado?: Estado;
  mantenimiento?: Mantenimiento;
  conclusionGeneral?: 'Recomendado' | 'Con reparaciones pendientes' | 'No recomendado' | 'A criterio del comprador' | '';
}

export const INTERIOR_ITEMS = [
  'Butaca conductor',
  'Butaca acompañante',
  'Plazas traseras',
  'Estado puerta conductor',
  'Estado puerta acompañante',
  'Estado puerta trasera izq.',
  'Estado puerta trasera der.',
  'Estado cinturones delanteros',
  'Estado cinturones traseros',
  'Tablero de instrumentos',
  'Salidas de ventilación',
  'Radio / central multimedia',
  'Estado palanca de cambios',
  'Estado del volante',
  'Estado de la pedalera',
  'Alfombras',
  'Alfombra de techo',
  'Parasoles',
  'Espejo central',
  'Techo solar',
  'Caja de carga',
  'Tapa Caja de carga'
];

/** Ítems que sólo aplican a pick-ups (se ocultan en sedán, hatchback y SUV). */
export const PICKUP_ONLY_ITEMS = ['Caja de carga', 'Tapa Caja de carga'];

export const isPickupBody = (tipo: string) => /pick|caja/i.test(tipo || '');

export const getInteriorItems = (tipoVehiculo: string) =>
  isPickupBody(tipoVehiculo) ? INTERIOR_ITEMS : INTERIOR_ITEMS.filter((i) => !PICKUP_ONLY_ITEMS.includes(i));

/** Texto a mostrar para cada calificación (app y PDF). */
export const SCORE_LABEL: Record<Exclude<ScoreValue, null>, string> = {
  B: 'B',
  'B-R': 'B/R',
  R: 'R',
  'R-M': 'R/M',
  M: 'M',
  NA: 'N/A'
};

export const EXTERIOR_ITEMS = [
  'Estado rueda delantera izquierda',
  'Estado rueda delantera derecha',
  'Estado rueda trasera izquierda',
  'Estado rueda trasera derecha',
  'Espejo izquierdo',
  'Espejo derecho',
  'Óptica delantera izquierda',
  'Óptica delantera derecha',
  'Óptica trasera izquierda',
  'Óptica trasera derecha',
  'Ópticas anti nieblas',
  'Óptica 3er luz de stop',
  'Estado patente delantera',
  'Estado patente trasera',
  'Estado Limpia Parabrisas',
  'Estado Lava Luneta',
  'Estado bajos del chasis'
];

export const MECANICA_ITEMS = [
  'Motor',
  'Transmisión',
  'Embrague',
  'Correa accesorios',
  'Tacos motor',
  'Sist. Dirección',
  'Sist. Combustible',
  'Sist. Refrigeración',
  'Tren delantero',
  'Tren trasero',
  'Frenos delanteros',
  'Frenos traseros',
  'Freno de mano',
  'Escape',
  'Aire acondicionado',
  'Calefacción',
  'Batería',
  'Bocina'
];

export const ACCESORIOS_ITEMS = [
  'Auxilio',
  'Llave de rueda',
  'Crique elevador',
  'Balizas de emergencia',
  'Matafuegos'
];

/** Junta las observaciones de cada sección + la general, en el orden del informe. */
export const compileObservaciones = (d: InspectionData): { titulo: string; texto: string }[] => {
  const out: { titulo: string; texto: string }[] = [];
  (Object.keys(OBS_SECTION_LABEL) as ObsSection[]).forEach((k) => {
    const t = d.obsSecciones?.[k]?.trim();
    if (t) out.push({ titulo: OBS_SECTION_LABEL[k], texto: t });
  });
  if (d.observaciones?.trim()) out.push({ titulo: 'General', texto: d.observaciones.trim() });
  return out;
};

/** Conteo B / R / M de todas las secciones calificadas. */
export const scoreCounts = (d: InspectionData) => {
  const all = [...Object.values(d.interior), ...Object.values(d.exterior), ...Object.values(d.mecanica)];
  return {
    b: all.filter((v) => v === 'B' || v === 'B-R').length,
    r: all.filter((v) => v === 'R').length,
    m: all.filter((v) => v === 'M' || v === 'R-M').length
  };
};

// ── Informe de Mantenimiento Preventivo (servicio adicional) ──
export type Plazo = 'corto' | 'mediano' | 'largo';

export const PLAZOS: { id: Plazo; label: string; detalle: string; color: string }[] = [
  { id: 'corto', label: 'Corto plazo', detalle: 'Inmediato · próximos 30 días o 1.000 km', color: '#dc2626' },
  { id: 'mediano', label: 'Mediano plazo', detalle: 'De 1 a 6 meses · hasta 10.000 km', color: '#d97706' },
  { id: 'largo', label: 'Largo plazo', detalle: 'De 6 a 12 meses · más de 10.000 km', color: '#059669' }
];

export interface MantenimientoItem {
  id: string;
  plazo: Plazo;
  tarea: string;
  detalle?: string;
  costo?: string;
}

export interface Mantenimiento {
  activo: boolean;
  items: MantenimientoItem[];
  notas?: string;
}

/**
 * Sugiere tareas a partir de lo calificado: Malo y R/M → corto plazo, Regular → mediano, B/R → largo.
 * Facu después ajusta el texto, el plazo y el costo.
 */
export const suggestMantenimiento = (d: InspectionData, interiorItems: string[]): MantenimientoItem[] => {
  const out: MantenimientoItem[] = [];
  const add = (items: string[], vals: Record<string, ScoreValue>, area: string) =>
    items.forEach((item) => {
      const v = vals[item];
      const plazo: Plazo | null = v === 'M' || v === 'R-M' ? 'corto' : v === 'R' ? 'mediano' : v === 'B-R' ? 'largo' : null;
      if (plazo)
        out.push({
          id: Math.random().toString(36).slice(2, 10),
          plazo,
          tarea: `${item}`,
          detalle: `${area} · estado ${SCORE_LABEL[v as Exclude<ScoreValue, null>]}`
        });
    });
  add(MECANICA_ITEMS, d.mecanica, 'Mecánica');
  add(EXTERIOR_ITEMS, d.exterior, 'Exterior');
  add(interiorItems, d.interior, 'Interior');
  return out;
};
