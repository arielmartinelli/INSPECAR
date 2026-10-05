export type ScoreValue = 'B' | 'B-R' | 'R' | 'R-M' | 'M' | 'NA' | null;
export type YesNoValue = 'SI' | 'NO' | null;

export interface DamageMarker {
  id: string;
  view: 'lateral_izq' | 'lateral_der' | 'frente' | 'trasera' | 'techo';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: 'D' | 'Rep' | 'Rayon' | 'Bollo';
  note?: string;
}

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
  observaciones: string;
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
