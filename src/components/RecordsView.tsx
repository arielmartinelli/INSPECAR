import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { Search, RefreshCw, FolderOpen, FileDown, X, Send, Trash2, Cloud, HardDrive, Phone, MessageCircle, CloudOff } from 'lucide-react';
import { ESTADOS, type Estado } from '../types/inspection';
import { repo, type RecordSummary, type Seguimiento } from '../lib/repo';
import { notify, confirmAction } from '../lib/dialogs';

interface RecordsViewProps {
  currentId: string;
  refreshKey: number;
  busy: boolean;
  onOpen: (id: string) => void;
  onDownload: (id: string) => void;
  onDeleted: (id: string) => void;
}

const fmtDate = (iso: string) => {
  const [y, m, d] = (iso || '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
};
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

const EstadoBadge: FC<{ estado: Estado }> = ({ estado }) => {
  const e = ESTADOS.find((x) => x.id === estado) ?? ESTADOS[0];
  return <span className={`inline-block text-[10px] font-bold uppercase border px-1.5 py-0.5 whitespace-nowrap ${e.tone}`}>{e.label}</span>;
};

const Score: FC<{ r: RecordSummary }> = ({ r }) => (
  <span className="inline-flex font-mono text-[11px] font-black border border-slate-900 divide-x divide-slate-900">
    <span className="px-1 text-emerald-700 bg-emerald-50">B{r.b}</span>
    <span className="px-1 text-amber-700 bg-amber-50">R{r.r}</span>
    <span className="px-1 text-rose-700 bg-rose-50">M{r.m}</span>
  </span>
);

export const RecordsView: FC<RecordsViewProps> = ({ currentId, refreshKey, busy, onOpen, onDownload, onDeleted }) => {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<Estado | 'todos'>('todos');
  const [rows, setRows] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RecordSummary | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (t: string, e: Estado | 'todos') => {
    setLoading(true);
    try {
      setRows(await repo.list({ texto: t, estado: e }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(texto, estado), texto ? 300 : 0);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [texto, estado, refreshKey, load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach((r) => (c[r.estado] = (c[r.estado] ?? 0) + 1));
    return c;
  }, [rows]);

  const changeEstado = async (r: RecordSummary, e: Estado) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, estado: e } : x)));
    setSelected((s) => (s && s.id === r.id ? { ...s, estado: e } : s));
    try {
      await repo.setEstado(r.id, e);
    } catch {
      notify('No se pudo cambiar el estado. Revisá la conexión.');
      load(texto, estado);
    }
  };

  const deleteRecord = async (r: RecordSummary) => {
    const nombre = r.patente || r.vehiculo;
    const ok = await confirmAction({
      title: `¿Borrar la inspección ${nombre}?`,
      text: `${r.clienteNombre ? `Cliente: ${r.clienteNombre}\n` : ''}Se borran también sus notas de seguimiento. No se puede deshacer.`,
      confirmText: 'Borrar',
      danger: true
    });
    if (!ok) return;
    try {
      await repo.remove(r.id);
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      setSelected((s) => (s?.id === r.id ? null : s));
      onDeleted(r.id);
    } catch {
      notify('No se pudo borrar. Revisá la conexión.');
    }
  };

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Registros de inspecciones</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              {repo.mode === 'cloud' ? (
                <>
                  <Cloud className="w-3.5 h-3.5" aria-hidden /> Base de datos en la nube
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5" aria-hidden /> Guardado sólo en este dispositivo
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(texto, estado)}
            className="flex items-center gap-1.5 text-xs font-bold border-2 border-slate-300 hover:border-slate-900 px-3 py-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden /> Actualizar
          </button>
        </div>

        <label className="relative block">
          <span className="sr-only">Buscar por patente, nombre o DNI del cliente</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por patente, nombre o DNI del cliente…"
            className="w-full bg-slate-50 border-2 border-slate-900 pl-9 pr-3 py-3 text-sm font-semibold focus:outline-none focus:bg-white"
          />
        </label>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none mt-3" role="tablist" aria-label="Filtrar por estado">
          {[{ id: 'todos' as const, label: 'Todos' }, ...ESTADOS].map((e) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={estado === e.id}
              onClick={() => setEstado(e.id)}
              className={`shrink-0 px-3 py-1.5 border-2 text-xs font-bold ${
                estado === e.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-900'
              }`}
            >
              {e.label}
              {e.id !== 'todos' && estado === 'todos' && counts[e.id] ? ` · ${counts[e.id]}` : ''}
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-500 px-1" aria-live="polite">
        {loading ? 'Buscando…' : `${rows.length} inspección(es)`}
      </p>

      {/* Tabla en PC */}
      {rows.length > 0 && (
        <div className="hidden lg:block bg-white border-2 border-slate-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white text-left text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Fecha</th>
                <th className="px-3 py-2.5">Patente</th>
                <th className="px-3 py-2.5">Vehículo</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">DNI</th>
                <th className="px-3 py-2.5">Resultado</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-t border-slate-200 hover:bg-slate-50 ${r.id === currentId ? 'bg-emerald-50/50' : ''}`}>
                  <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">{fmtDate(r.fecha)}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono font-black tracking-widest text-xs bg-yellow-50 border border-slate-900 px-1.5 whitespace-nowrap">
                      {r.patente || '—'}
                    </span>
                    {r.pendienteSync && <CloudOff className="inline w-3.5 h-3.5 ml-1 text-amber-600" aria-label="Pendiente de subir" />}
                  </td>
                  <td className="px-3 py-2.5 font-semibold max-w-[220px] truncate">{r.vehiculo}</td>
                  <td className="px-3 py-2.5 max-w-[180px] truncate">{r.clienteNombre || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{r.clienteDni || '—'}</td>
                  <td className="px-3 py-2.5">
                    <Score r={r} />
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={r.estado}
                      onChange={(e) => changeEstado(r, e.target.value as Estado)}
                      aria-label={`Estado de ${r.patente}`}
                      className="bg-white border border-slate-300 px-1.5 py-1 text-xs font-bold"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => onOpen(r.id)} className="px-2 py-1.5 text-xs font-bold border-2 border-slate-900 bg-slate-900 text-white">
                        Abrir
                      </button>
                      <button type="button" disabled={busy} onClick={() => onDownload(r.id)} className="p-1.5 border-2 border-slate-300 hover:border-slate-900" aria-label="PDF">
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setSelected(r)} className="px-2 py-1.5 text-xs font-bold border-2 border-slate-300 hover:border-slate-900">
                        Seguimiento
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRecord(r)}
                        className="p-1.5 border-2 border-rose-200 text-rose-600 hover:border-rose-600 hover:bg-rose-50"
                        aria-label={`Borrar inspección ${r.patente || r.vehiculo}`}
                        title="Borrar inspección"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tarjetas en celular */}
      <div className="lg:hidden space-y-2.5">
        {rows.map((r) => (
          <article key={r.id} className={`bg-white border-2 p-3 ${r.id === currentId ? 'border-emerald-600' : 'border-slate-300'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black tracking-widest text-sm bg-yellow-50 border border-slate-900 px-1.5">{r.patente || 'SIN PATENTE'}</span>
                  <EstadoBadge estado={r.estado} />
                  {r.pendienteSync && <CloudOff className="w-4 h-4 text-amber-600" aria-label="Pendiente de subir" />}
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1 truncate">{r.vehiculo}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {fmtDate(r.fecha)}
                  {r.clienteNombre ? ` · ${r.clienteNombre}` : ''}
                  {r.clienteDni ? ` · DNI ${r.clienteDni}` : ''}
                </p>
              </div>
              <Score r={r} />
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 mt-3">
              <button type="button" onClick={() => onOpen(r.id)} className="h-10 border-2 border-slate-900 bg-slate-900 text-white text-xs font-black uppercase flex items-center justify-center gap-1">
                <FolderOpen className="w-4 h-4" aria-hidden /> Abrir
              </button>
              <button type="button" disabled={busy} onClick={() => onDownload(r.id)} className="h-10 border-2 border-slate-900 bg-white text-xs font-black uppercase flex items-center justify-center gap-1 disabled:opacity-40">
                <FileDown className="w-4 h-4" aria-hidden /> PDF
              </button>
              <button type="button" onClick={() => setSelected(r)} className="h-10 border-2 border-slate-300 bg-white text-xs font-black uppercase">
                Seguimiento
              </button>
              <button
                type="button"
                onClick={() => deleteRecord(r)}
                className="h-10 w-10 border-2 border-rose-200 text-rose-600 bg-white grid place-items-center"
                aria-label={`Borrar inspección ${r.patente || r.vehiculo}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && rows.length === 0 && (
        <p className="text-center text-sm text-slate-500 py-10 bg-white border-2 border-dashed border-slate-300">
          {texto || estado !== 'todos'
            ? 'No hay inspecciones con ese filtro.'
            : 'Todavía no hay inspecciones guardadas. Se guardan solas mientras cargás una.'}
        </p>
      )}

      {selected && (
        <FollowUpDrawer
          record={selected}
          onClose={() => setSelected(null)}
          onEstado={(e) => changeEstado(selected, e)}
          onDelete={() => deleteRecord(selected)}
        />
      )}
    </div>
  );
};

const FollowUpDrawer: FC<{
  record: RecordSummary;
  onClose: () => void;
  onEstado: (e: Estado) => void;
  onDelete: () => void;
}> = ({ record, onClose, onEstado, onDelete }) => {
  const [notas, setNotas] = useState<Seguimiento[]>([]);
  const [nueva, setNueva] = useState('');
  const [saving, setSaving] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    repo.listSeguimientos(record.id).then(setNotas);
  }, [record.id]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const add = async () => {
    if (!nueva.trim()) return;
    setSaving(true);
    try {
      await repo.addSeguimiento(record.id, nueva);
      setNueva('');
      setNotas(await repo.listSeguimientos(record.id));
    } catch {
      notify('No se pudo guardar la nota. Si la inspección todavía no subió a la nube, esperá a tener señal.');
    } finally {
      setSaving(false);
    }
  };

  const tel = record.clienteTelefono.replace(/\D/g, '');
  const wa = tel ? `https://wa.me/${tel.startsWith('54') ? tel : '549' + tel.replace(/^0/, '')}` : '';

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 flex justify-end" onClick={onClose} role="presentation">
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="seg-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md h-full flex flex-col border-l-2 border-slate-900"
      >
        <div className="flex items-start justify-between gap-2 p-4 border-b-2 border-slate-900">
          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase text-slate-500">Seguimiento</p>
            <h2 id="seg-title" className="text-lg font-black text-slate-900 truncate">
              {record.patente || 'Sin patente'} · {record.vehiculo}
            </h2>
            <p className="text-xs text-slate-600">
              {record.clienteNombre || 'Cliente sin nombre'}
              {record.clienteDni ? ` · DNI ${record.clienteDni}` : ''}
            </p>
            {tel && (
              <div className="flex gap-2 mt-2">
                <a href={`tel:${tel}`} className="text-xs font-bold border-2 border-slate-300 px-2 py-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" aria-hidden /> Llamar
                </a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="text-xs font-bold border-2 border-emerald-600 text-emerald-700 px-2 py-1 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden /> WhatsApp
                </a>
              </div>
            )}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="p-2 border-2 border-slate-300 hover:border-slate-900" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200">
          <p className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">Estado</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {ESTADOS.map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={record.estado === e.id}
                onClick={() => onEstado(e.id)}
                className={`px-2 py-2 border-2 text-xs font-bold ${record.estado === e.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 hover:border-slate-900'}`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">Notas de seguimiento</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
            className="flex gap-1.5 mb-4"
          >
            <label htmlFor="nota-seg" className="sr-only">
              Nueva nota
            </label>
            <input
              id="nota-seg"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              maxLength={2000}
              placeholder="Ej: llamé al cliente, lo está pensando"
              className="min-w-0 flex-1 bg-slate-50 border-2 border-slate-300 focus:border-slate-900 px-3 py-2.5 text-sm focus:outline-none"
            />
            <button type="submit" disabled={saving || !nueva.trim()} className="px-3 border-2 border-slate-900 bg-slate-900 text-white disabled:opacity-40" aria-label="Agregar nota">
              <Send className="w-4 h-4" />
            </button>
          </form>
          {notas.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay notas.</p>
          ) : (
            <ol className="relative border-l-2 border-slate-200 ml-1.5 space-y-4">
              {notas.map((n) => (
                <li key={n.id} className="pl-4 relative">
                  <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-slate-900" aria-hidden />
                  <p className="text-[11px] font-mono text-slate-500">{fmtDateTime(n.createdAt)}</p>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">{n.nota}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button type="button" onClick={onDelete} className="text-xs font-bold text-rose-700 flex items-center gap-1.5 hover:underline">
            <Trash2 className="w-4 h-4" aria-hidden /> Borrar inspección
          </button>
        </div>
      </aside>
    </div>
  );
};
