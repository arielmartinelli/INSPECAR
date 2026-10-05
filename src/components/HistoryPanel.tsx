import { useEffect, useRef, useState, type FC } from 'react';
import { X, FolderOpen, FileDown, Trash2, Search, History } from 'lucide-react';
import type { InspectionData } from '../types/inspection';
import { type HistoryEntry, vehicleLabel } from '../utils/history';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  currentId: string;
  busy: boolean;
  onClose: () => void;
  onOpen: (data: InspectionData) => void;
  onDownload: (data: InspectionData) => void;
  onDelete: (id: string) => void;
}

const VERDICT_STYLE: Record<string, string> = {
  Recomendado: 'bg-emerald-100 text-emerald-900 border-emerald-600',
  'Con reparaciones pendientes': 'bg-amber-100 text-amber-900 border-amber-500',
  'No recomendado': 'bg-rose-100 text-rose-900 border-rose-600',
  'A criterio del comprador': 'bg-slate-100 text-slate-800 border-slate-400'
};

const formatDate = (iso: string) => {
  const [y, m, d] = (iso || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

const countScores = (d: InspectionData) => {
  const all = [...Object.values(d.interior), ...Object.values(d.exterior), ...Object.values(d.mecanica)];
  return {
    b: all.filter((v) => v === 'B' || v === 'B-R').length,
    r: all.filter((v) => v === 'R').length,
    m: all.filter((v) => v === 'M' || v === 'R-M').length
  };
};

export const HistoryPanel: FC<HistoryPanelProps> = ({ entries, currentId, busy, onClose, onOpen, onDownload, onDelete }) => {
  const [query, setQuery] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Foco inicial, cierre con Escape y bloqueo del scroll de fondo (sólo al abrir)
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []);

  const q = query.trim().toLowerCase().replace(/\s+/g, '');
  const filtered = q
    ? entries.filter((e) =>
        `${e.data.vehicle.dominio} ${vehicleLabel(e.data)} ${e.data.vehicle.clienteNombre ?? ''}`
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(q)
      )
    : entries;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/60 flex items-end sm:items-center justify-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] flex flex-col border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
      >
        <div className="flex items-center justify-between border-b-2 border-slate-900 p-3 sm:p-4">
          <h2 id="history-title" className="flex items-center gap-2 text-base font-black uppercase tracking-tight">
            <History className="w-5 h-5" aria-hidden />
            Historial ({entries.length})
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="p-2 border-2 border-slate-300 hover:border-slate-900"
            aria-label="Cerrar historial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 sm:p-4 border-b border-slate-200">
          <label className="relative block">
            <span className="sr-only">Buscar por patente, vehículo o cliente</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por patente, vehículo o cliente…"
              className="w-full bg-slate-50 border-2 border-slate-900 pl-9 pr-3 py-2.5 text-sm font-semibold focus:outline-none focus:bg-white"
            />
          </label>
        </div>

        <div className="overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">
              {entries.length === 0
                ? 'Todavía no hay inspecciones guardadas. Se guardan al generar el PDF, al tocar "Guardar en historial" o al empezar una nueva.'
                : 'No hay resultados para esa búsqueda.'}
            </p>
          ) : (
            filtered.map(({ data, savedAt }) => {
              const s = countScores(data);
              const isCurrent = data.id === currentId;
              return (
                <article key={data.id} className={`border-2 p-3 ${isCurrent ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-300'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black tracking-widest text-sm bg-yellow-50 border border-slate-900 px-1.5">
                          {data.vehicle.dominio || 'SIN PATENTE'}
                        </span>
                        {isCurrent && <span className="text-[10px] font-bold uppercase text-emerald-700">· Abierta ahora</span>}
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1 truncate">{vehicleLabel(data)}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatDate(data.vehicle.fecha)}
                        {data.vehicle.clienteNombre ? ` · ${data.vehicle.clienteNombre}` : ''}
                        {` · guardada ${new Date(savedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`}
                      </p>
                    </div>
                    <div className="flex font-mono text-[11px] font-black border border-slate-900 divide-x divide-slate-900 shrink-0">
                      <span className="px-1.5 text-emerald-700 bg-emerald-50">B{s.b}</span>
                      <span className="px-1.5 text-amber-700 bg-amber-50">R{s.r}</span>
                      <span className="px-1.5 text-rose-700 bg-rose-50">M{s.m}</span>
                    </div>
                  </div>

                  {data.conclusionGeneral && (
                    <span className={`inline-block mt-2 text-[10px] font-bold uppercase border px-1.5 py-0.5 ${VERDICT_STYLE[data.conclusionGeneral] ?? ''}`}>
                      {data.conclusionGeneral}
                    </span>
                  )}

                  <div className="grid grid-cols-3 gap-1.5 mt-3">
                    <button
                      type="button"
                      onClick={() => onOpen(data)}
                      disabled={isCurrent}
                      className="h-10 border-2 border-slate-900 bg-slate-900 text-white text-xs font-black uppercase flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <FolderOpen className="w-4 h-4" aria-hidden /> Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownload(data)}
                      disabled={busy}
                      className="h-10 border-2 border-slate-900 bg-white text-xs font-black uppercase flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <FileDown className="w-4 h-4" aria-hidden /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Borrar del historial la inspección ${data.vehicle.dominio || vehicleLabel(data)}?`)) onDelete(data.id);
                      }}
                      className="h-10 border-2 border-rose-300 text-rose-700 bg-white text-xs font-black uppercase flex items-center justify-center gap-1 hover:border-rose-600"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden /> Borrar
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <p className="text-[10px] text-slate-500 p-3 border-t border-slate-200">
          El historial se guarda sólo en este dispositivo y navegador. Si borrás los datos del navegador, se pierde.
        </p>
      </div>
    </div>
  );
};
