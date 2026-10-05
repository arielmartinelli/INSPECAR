import type { InspectionData } from '../types/inspection';

/**
 * Historial de inspecciones guardado en el dispositivo (localStorage).
 * Cada inspección pesa ~5 KB, así que 100 entran cómodas en el límite del navegador.
 */
const HISTORY_KEY = 'inspecar_history_v1';
const MAX_ENTRIES = 100;

export interface HistoryEntry {
  savedAt: string;
  data: InspectionData;
}

export const loadHistory = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => e?.data?.id) : [];
  } catch {
    return [];
  }
};

const persist = (entries: HistoryEntry[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    return true;
  } catch (e) {
    console.error('No se pudo guardar el historial', e);
    return false;
  }
};

/** ¿Tiene datos que valga la pena guardar? (evita llenar el historial de planillas vacías) */
export const hasContent = (d: InspectionData) =>
  Boolean(
    d.vehicle.dominio?.trim() ||
      d.vehicle.marca ||
      d.observaciones?.trim() ||
      d.damageMarkers.length ||
      Object.values(d.interior).some(Boolean) ||
      Object.values(d.exterior).some(Boolean) ||
      Object.values(d.mecanica).some(Boolean)
  );

/** Guarda o actualiza (mismo id) la inspección. Devuelve el historial nuevo. */
export const saveToHistory = (data: InspectionData): HistoryEntry[] => {
  const entries = loadHistory().filter((e) => e.data.id !== data.id);
  entries.unshift({ savedAt: new Date().toISOString(), data });
  const trimmed = entries.slice(0, MAX_ENTRIES);
  persist(trimmed);
  return trimmed;
};

export const deleteFromHistory = (id: string): HistoryEntry[] => {
  const entries = loadHistory().filter((e) => e.data.id !== id);
  persist(entries);
  return entries;
};

export const vehicleLabel = (d: InspectionData) => {
  const v = d.vehicle;
  const brand = v.marca === 'OTRA' ? v.marcaPersonalizada : v.marca;
  const model = v.modelo === 'OTRO' ? v.modeloPersonalizado : v.modelo;
  return [brand, model, v.version].filter(Boolean).join(' ') || 'Vehículo sin datos';
};
