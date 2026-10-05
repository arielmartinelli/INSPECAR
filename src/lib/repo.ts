import type { Estado, InspectionData } from '../types/inspection';
import { scoreCounts } from '../types/inspection';
import { supabase, cloudEnabled } from './supabase';

/**
 * Capa de datos de INSPECAR.
 * - Siempre guarda una copia en el dispositivo (sirve offline y como caché).
 * - Si Supabase está configurado y hay sesión, además guarda en la base de datos.
 *   Lo que no se pudo subir (sin señal) queda en una cola y se reintenta solo.
 */

export interface RecordSummary {
  id: string;
  patente: string;
  vehiculo: string;
  clienteNombre: string;
  clienteDni: string;
  clienteTelefono: string;
  fecha: string;
  dictamen: string;
  estado: Estado;
  updatedAt: string;
  b: number;
  r: number;
  m: number;
  pendienteSync?: boolean;
}

export interface Seguimiento {
  id: string;
  nota: string;
  createdAt: string;
}

export interface ListFilter {
  texto?: string;
  estado?: Estado | 'todos';
}

const LOCAL_KEY = 'inspecar_history_v1';
const LOCAL_FOLLOW_KEY = 'inspecar_seguimientos_v1';
const PENDING_KEY = 'inspecar_pending_sync_v1';
const MAX_LOCAL = 200;

interface LocalEntry {
  savedAt: string;
  data: InspectionData;
}

// ── helpers ───────────────────────────────────────────────────
const readJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Sin espacio en el dispositivo', e);
  }
};

export const normPatente = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const normDni = (s: string) => (s || '').replace(/\D/g, '');
const normText = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export const vehicleLabel = (d: InspectionData) => {
  const v = d.vehicle;
  const brand = v.marca === 'OTRA' ? v.marcaPersonalizada : v.marca;
  const model = v.modelo === 'OTRO' ? v.modeloPersonalizado : v.modelo;
  return [brand, model, v.version].filter(Boolean).join(' ') || 'Vehículo sin datos';
};

export const hasContent = (d: InspectionData) =>
  Boolean(
    d.vehicle.dominio?.trim() ||
      d.vehicle.marca ||
      d.vehicle.clienteNombre?.trim() ||
      d.observaciones?.trim() ||
      d.damageMarkers.length ||
      Object.values(d.interior).some(Boolean) ||
      Object.values(d.exterior).some(Boolean) ||
      Object.values(d.mecanica).some(Boolean)
  );

const toSummary = (d: InspectionData, updatedAt: string, pendienteSync = false): RecordSummary => {
  const c = scoreCounts(d);
  return {
    id: d.id,
    patente: d.vehicle.dominio || '',
    vehiculo: vehicleLabel(d),
    clienteNombre: d.vehicle.clienteNombre || '',
    clienteDni: d.vehicle.clienteDni || '',
    clienteTelefono: d.vehicle.clienteTelefono || '',
    fecha: d.vehicle.fecha,
    dictamen: d.conclusionGeneral || '',
    estado: d.estado ?? 'borrador',
    updatedAt,
    b: c.b,
    r: c.r,
    m: c.m,
    pendienteSync
  };
};

const matches = (s: RecordSummary, f: ListFilter) => {
  if (f.estado && f.estado !== 'todos' && s.estado !== f.estado) return false;
  const q = f.texto?.trim();
  if (!q) return true;
  const qp = normPatente(q);
  const qd = normDni(q);
  return (
    (qp.length > 0 && normPatente(s.patente).includes(qp)) ||
    (qd.length > 0 && normDni(s.clienteDni).includes(qd)) ||
    normText(s.clienteNombre).includes(normText(q)) ||
    normText(s.vehiculo).includes(normText(q))
  );
};

// ── copia local ──────────────────────────────────────────────
const localEntries = () => readJSON<LocalEntry[]>(LOCAL_KEY, []).filter((e) => e?.data?.id);
const pendingIds = () => new Set(readJSON<string[]>(PENDING_KEY, []));
const setPending = (ids: Set<string>) => writeJSON(PENDING_KEY, [...ids]);

const saveLocal = (data: InspectionData) => {
  const entries = localEntries().filter((e) => e.data.id !== data.id);
  entries.unshift({ savedAt: new Date().toISOString(), data });
  writeJSON(LOCAL_KEY, entries.slice(0, MAX_LOCAL));
};

// ── fila de la base de datos ─────────────────────────────────
const toRow = (d: InspectionData) => {
  const c = scoreCounts(d);
  const v = d.vehicle;
  return {
    id: d.id,
    patente: v.dominio || null,
    marca: (v.marca === 'OTRA' ? v.marcaPersonalizada : v.marca) || null,
    modelo: (v.modelo === 'OTRO' ? v.modeloPersonalizado : v.modelo) || null,
    vehiculo: vehicleLabel(d),
    anio: v.anio || null,
    carroceria: v.tipoVehiculo || null,
    cliente_nombre: v.clienteNombre?.trim() || null,
    cliente_dni: v.clienteDni?.trim() || null,
    cliente_telefono: v.clienteTelefono?.trim() || null,
    fecha: v.fecha || null,
    dictamen: d.conclusionGeneral || null,
    estado: d.estado ?? 'borrador',
    b: c.b,
    r: c.r,
    m: c.m,
    data: d
  };
};

interface DbRow {
  id: string;
  patente: string | null;
  vehiculo: string | null;
  cliente_nombre: string | null;
  cliente_dni: string | null;
  cliente_telefono: string | null;
  fecha: string | null;
  dictamen: string | null;
  estado: Estado;
  updated_at: string;
  b: number;
  r: number;
  m: number;
}

const fromRow = (r: DbRow): RecordSummary => ({
  id: r.id,
  patente: r.patente ?? '',
  vehiculo: r.vehiculo ?? '',
  clienteNombre: r.cliente_nombre ?? '',
  clienteDni: r.cliente_dni ?? '',
  clienteTelefono: r.cliente_telefono ?? '',
  fecha: r.fecha ?? '',
  dictamen: r.dictamen ?? '',
  estado: r.estado,
  updatedAt: r.updated_at,
  b: r.b,
  r: r.r,
  m: r.m
});

/** Para el filtro de PostgREST sólo dejamos letras, números y espacios (evita romper/inyectar la consulta). */
const safe = (s: string) => s.replace(/[^\p{L}\p{N} ]/gu, '').trim().slice(0, 60);

const canUseCloud = async () => {
  if (!supabase || !navigator.onLine) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
};

// ── API pública ──────────────────────────────────────────────
export const repo = {
  mode: (cloudEnabled ? 'cloud' : 'local') as 'cloud' | 'local',

  async list(filter: ListFilter = {}): Promise<RecordSummary[]> {
    const pend = pendingIds();
    const local = localEntries().map((e) => toSummary(e.data, e.savedAt, pend.has(e.data.id)));

    if (await canUseCloud()) {
      let q = supabase!
        .from('inspecciones')
        .select('id,patente,vehiculo,cliente_nombre,cliente_dni,cliente_telefono,fecha,dictamen,estado,updated_at,b,r,m')
        .order('updated_at', { ascending: false })
        .limit(300);
      if (filter.estado && filter.estado !== 'todos') q = q.eq('estado', filter.estado);
      const t = safe(filter.texto ?? '');
      if (t) {
        const p = normPatente(t);
        const d = normDni(t);
        const ors = [`cliente_nombre.ilike.%${t}%`, `vehiculo.ilike.%${t}%`];
        if (p) ors.push(`patente_norm.ilike.%${p}%`);
        if (d) ors.push(`cliente_dni_norm.ilike.%${d}%`);
        q = q.or(ors.join(','));
      }
      const { data, error } = await q;
      if (!error && data) {
        const cloud = (data as DbRow[]).map(fromRow);
        // Lo que todavía no subió se muestra igual (marcado como pendiente)
        const extra = local.filter((l) => l.pendienteSync && !cloud.some((c) => c.id === l.id) && matches(l, filter));
        return [...extra, ...cloud];
      }
      console.warn('Sin acceso a la base, uso la copia local', error);
    }
    return local.filter((s) => matches(s, filter));
  },

  async get(id: string): Promise<InspectionData | null> {
    if (await canUseCloud()) {
      const { data, error } = await supabase!.from('inspecciones').select('data').eq('id', id).maybeSingle();
      if (!error && data) return data.data as InspectionData;
    }
    return localEntries().find((e) => e.data.id === id)?.data ?? null;
  },

  /** Guarda en el dispositivo y, si se puede, en la base. Devuelve true si quedó en la nube. */
  async save(d: InspectionData): Promise<boolean> {
    saveLocal(d);
    if (!cloudEnabled) return false;
    const pend = pendingIds();
    try {
      if (!(await canUseCloud())) throw new Error('offline');
      const { error } = await supabase!.from('inspecciones').upsert(toRow(d));
      if (error) throw error;
      pend.delete(d.id);
      setPending(pend);
      return true;
    } catch {
      pend.add(d.id);
      setPending(pend);
      return false;
    }
  },

  /** Sube lo que quedó pendiente (se llama al volver la señal o al iniciar sesión). */
  async flush(): Promise<number> {
    if (!(await canUseCloud())) return 0;
    const pend = pendingIds();
    let ok = 0;
    for (const e of localEntries().filter((x) => pend.has(x.data.id))) {
      const { error } = await supabase!.from('inspecciones').upsert(toRow(e.data));
      if (!error) {
        pend.delete(e.data.id);
        ok++;
      }
    }
    setPending(pend);
    return ok;
  },

  async remove(id: string) {
    writeJSON(LOCAL_KEY, localEntries().filter((e) => e.data.id !== id));
    const pend = pendingIds();
    pend.delete(id);
    setPending(pend);
    if (await canUseCloud()) {
      const { error } = await supabase!.from('inspecciones').delete().eq('id', id);
      if (error) throw error;
    }
  },

  async setEstado(id: string, estado: Estado) {
    const entries = localEntries();
    const e = entries.find((x) => x.data.id === id);
    if (e) {
      e.data = { ...e.data, estado };
      writeJSON(LOCAL_KEY, entries);
    }
    if (await canUseCloud()) {
      const { error } = await supabase!.from('inspecciones').update({ estado }).eq('id', id);
      if (error) throw error;
    }
  },

  async listSeguimientos(id: string): Promise<Seguimiento[]> {
    if (await canUseCloud()) {
      const { data, error } = await supabase!
        .from('seguimientos')
        .select('id,nota,created_at')
        .eq('inspeccion_id', id)
        .order('created_at', { ascending: false });
      if (!error && data) return data.map((r) => ({ id: String(r.id), nota: r.nota, createdAt: r.created_at }));
    }
    return readJSON<Record<string, Seguimiento[]>>(LOCAL_FOLLOW_KEY, {})[id] ?? [];
  },

  async addSeguimiento(id: string, nota: string) {
    const text = nota.trim().slice(0, 2000);
    if (!text) return;
    if (await canUseCloud()) {
      const { error } = await supabase!.from('seguimientos').insert({ inspeccion_id: id, nota: text });
      if (error) throw error;
      return;
    }
    const all = readJSON<Record<string, Seguimiento[]>>(LOCAL_FOLLOW_KEY, {});
    all[id] = [{ id: crypto.randomUUID(), nota: text, createdAt: new Date().toISOString() }, ...(all[id] ?? [])];
    writeJSON(LOCAL_FOLLOW_KEY, all);
  }
};
