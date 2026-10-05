import { useState, type FC } from 'react';
import { Plus, Trash2, Sparkles, FileDown, Wrench } from 'lucide-react';
import { PLAZOS, type Mantenimiento, type MantenimientoItem, type Plazo } from '../types/inspection';

interface MaintenanceSectionProps {
  value: Mantenimiento | undefined;
  onChange: (m: Mantenimiento) => void;
  onSuggest: () => MantenimientoItem[];
  onDownload: () => void;
  busy: boolean;
}

const newId = () => Math.random().toString(36).slice(2, 10);

/**
 * Informe de Mantenimiento Preventivo: servicio adicional (se cobra aparte),
 * con recomendaciones en corto, mediano y largo plazo y su propio PDF.
 */
export const MaintenanceSection: FC<MaintenanceSectionProps> = ({ value, onChange, onSuggest, onDownload, busy }) => {
  const m: Mantenimiento = value ?? { activo: false, items: [] };
  const [draft, setDraft] = useState<Record<Plazo, string>>({ corto: '', mediano: '', largo: '' });

  const update = (patch: Partial<Mantenimiento>) => onChange({ ...m, ...patch });
  const setItem = (id: string, patch: Partial<MantenimientoItem>) =>
    update({ items: m.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const addItem = (plazo: Plazo) => {
    const tarea = draft[plazo].trim();
    if (!tarea) return;
    update({ items: [...m.items, { id: newId(), plazo, tarea }] });
    setDraft({ ...draft, [plazo]: '' });
  };

  const suggest = () => {
    const sug = onSuggest().filter((s) => !m.items.some((i) => i.tarea === s.tarea));
    if (sug.length === 0) {
      window.alert('No hay ítems en Regular o Malo para sugerir (o ya están cargados).');
      return;
    }
    update({ items: [...m.items, ...sug] });
  };

  return (
    <section className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-slate-900">Informe de mantenimiento preventivo</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Servicio adicional: recomendaciones sobre los mantenimientos pendientes, en corto, mediano y largo plazo. Sale en un PDF aparte.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
          <span className="text-xs font-bold text-slate-700">{m.activo ? 'Incluido' : 'No'}</span>
          <input
            type="checkbox"
            className="sr-only peer"
            checked={m.activo}
            onChange={(e) => update({ activo: e.target.checked })}
            aria-label="Incluir informe de mantenimiento preventivo"
          />
          <span className="w-11 h-6 rounded-full bg-slate-300 peer-checked:bg-emerald-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-900" />
        </label>
      </div>

      {m.activo && (
        <div className="mt-4 space-y-4">
          <button
            type="button"
            onClick={suggest}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold border-2 border-slate-900 bg-slate-50 hover:bg-white px-3 py-2.5"
          >
            <Sparkles className="w-4 h-4" aria-hidden />
            Sugerir desde la inspección (Malo → corto · Regular → mediano · B/R → largo)
          </button>

          <div className="grid gap-3 lg:grid-cols-3">
            {PLAZOS.map((p) => {
              const items = m.items.filter((i) => i.plazo === p.id);
              return (
                <div key={p.id} className="border-2 border-slate-200 p-3" style={{ borderTopColor: p.color, borderTopWidth: 4 }}>
                  <h3 className="text-sm font-black uppercase" style={{ color: p.color }}>
                    {p.label} <span className="text-slate-500 font-mono text-xs">({items.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-2">{p.detalle}</p>

                  <ul className="space-y-2">
                    {items.map((i) => (
                      <li key={i.id} className="bg-slate-50 border border-slate-200 p-2 space-y-1.5">
                        <div className="flex gap-1.5">
                          <input
                            value={i.tarea}
                            onChange={(e) => setItem(i.id, { tarea: e.target.value })}
                            aria-label="Tarea"
                            className="min-w-0 flex-1 bg-white border border-slate-300 px-2 py-1.5 text-sm font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => update({ items: m.items.filter((x) => x.id !== i.id) })}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                            aria-label={`Quitar ${i.tarea}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          value={i.detalle ?? ''}
                          onChange={(e) => setItem(i.id, { detalle: e.target.value })}
                          placeholder="Detalle / recomendación"
                          aria-label="Detalle"
                          className="w-full bg-white border border-slate-300 px-2 py-1.5 text-xs"
                        />
                        <div className="flex gap-1.5">
                          <select
                            value={i.plazo}
                            onChange={(e) => setItem(i.id, { plazo: e.target.value as Plazo })}
                            aria-label="Plazo"
                            className="bg-white border border-slate-300 px-1.5 py-1.5 text-xs"
                          >
                            {PLAZOS.map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.label}
                              </option>
                            ))}
                          </select>
                          <input
                            value={i.costo ?? ''}
                            onChange={(e) => setItem(i.id, { costo: e.target.value })}
                            placeholder="Costo estimado ($)"
                            inputMode="decimal"
                            aria-label="Costo estimado"
                            className="min-w-0 flex-1 bg-white border border-slate-300 px-2 py-1.5 text-xs"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <form
                    className="flex gap-1.5 mt-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addItem(p.id);
                    }}
                  >
                    <input
                      value={draft[p.id]}
                      onChange={(e) => setDraft({ ...draft, [p.id]: e.target.value })}
                      placeholder="Agregar tarea…"
                      aria-label={`Agregar tarea de ${p.label}`}
                      className="min-w-0 flex-1 bg-white border-2 border-slate-300 focus:border-slate-900 px-2 py-2 text-sm focus:outline-none"
                    />
                    <button type="submit" className="px-3 border-2 border-slate-900 bg-slate-900 text-white" aria-label="Agregar">
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="mant-notas" className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
              Notas del plan
            </label>
            <textarea
              id="mant-notas"
              rows={3}
              value={m.notas ?? ''}
              onChange={(e) => update({ notas: e.target.value })}
              placeholder="Ej: usar aceite 5W30 sintético; revisar de nuevo a los 5.000 km."
              className="w-full bg-slate-50 border-2 border-slate-300 focus:border-slate-900 p-3 text-sm focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onDownload}
            disabled={busy || m.items.length === 0}
            className="w-full h-12 border-2 border-slate-900 bg-slate-900 text-white font-black text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" aria-hidden />
            Descargar informe de mantenimiento (PDF)
          </button>
        </div>
      )}
    </section>
  );
};
