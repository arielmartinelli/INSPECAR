import { useState, type FC, type MouseEvent } from 'react';
import { DAMAGE_TYPES, type DamageMarker, type DamageType, type DamageView } from '../types/inspection';
import { Trash2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { VEHICLE_BODY_TYPES, BLUEPRINT_VIEWS, getBlueprintKey, blueprintSrc } from '../data/carData';
import { confirmAction } from '../lib/dialogs';
import { ClearButton } from './ClearButton';

interface CarDamageMapProps {
  markers: DamageMarker[];
  bodyType: string;
  onBodyTypeChange?: (newType: string) => void;
  onChange: (markers: DamageMarker[]) => void;
  /** Observaciones de la sección (se muestran debajo) */
  footer?: React.ReactNode;
  /** Paso actual, ej. "2/7" */
  step?: string;
  onClear?: () => void;
  canClear?: boolean;
}

const VIEW_LABEL: Record<DamageView, { label: string; short: string }> = {
  lateral_der: { label: 'Lateral derecho', short: 'Lat. Der' },
  lateral_izq: { label: 'Lateral izquierdo', short: 'Lat. Izq' },
  frente: { label: 'Frente', short: 'Frente' },
  trasera: { label: 'Trasera', short: 'Trasera' },
  techo: { label: 'Planta / Techo', short: 'Techo' }
};

export const CarDamageMap: FC<CarDamageMapProps> = ({ markers, bodyType, onBodyTypeChange, onChange, footer, step = '6', onClear, canClear }) => {
  const [selectedType, setSelectedType] = useState<DamageType>('D');
  const [view, setView] = useState<DamageView>('lateral_der');

  const key = getBlueprintKey(bodyType);
  const views = BLUEPRINT_VIEWS[key] as DamageView[];
  const activeView: DamageView = views.includes(view) ? view : views[0];
  const idx = views.indexOf(activeView);

  // Numeración global (#1, #2, #3…) igual a la del PDF
  const numberOf = (id: string) => markers.findIndex((m) => m.id === id) + 1;

  // Coordenadas relativas al recuadro 16:9 (el PDF usa el mismo recuadro, así coinciden)
  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    onChange([
      ...markers,
      { id: crypto.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10), view: activeView, x, y, type: selectedType }
    ]);
  };

  const handleClearAll = () => {
    confirmAction({
      title: 'Borrar todos los puntos',
      text: `Se borran los ${markers.length} puntos marcados en todas las vistas.`,
      confirmText: 'Borrar todos',
      danger: true
    }).then((ok) => ok && onChange([]));
  };
  const handleNoteChange = (id: string, note: string) =>
    onChange(markers.map((m) => (m.id === id ? { ...m, note: note || undefined } : m)));
  const handleRemove = (id: string) => onChange(markers.filter((m) => m.id !== id));

  const activeMarkers = markers.filter((m) => m.view === activeView);
  const hidden = markers.filter((m) => !views.includes(m.view)).length;

  return (
    <section className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-3 sm:p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b-2 border-slate-900 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="min-w-8 h-8 px-1.5 bg-slate-900 text-white flex items-center justify-center whitespace-nowrap font-mono font-bold text-sm shrink-0">{step}</div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">Chapa y carrocería</h2>
            <p className="text-xs font-medium text-slate-500">
              Elegí el tipo y tocá el plano
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onBodyTypeChange && (
            <select
              aria-label="Tipo de carrocería"
              value={bodyType}
              onChange={(e) => onBodyTypeChange(e.target.value)}
              className="min-w-0 flex-1 sm:flex-none bg-slate-100 border-2 border-slate-900 text-xs font-bold px-2.5 py-1.5 h-8 uppercase font-mono text-slate-900 focus:outline-none"
            >
              {VEHICLE_BODY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <div className="shrink-0 h-8 flex items-center gap-1 whitespace-nowrap text-xs font-mono font-bold bg-slate-100 px-2 border border-slate-900">
            <MapPin className="w-3.5 h-3.5 text-rose-600" aria-hidden />
            <span>{markers.length} puntos</span>
          </div>
          <ClearButton onClick={onClear} disabled={!canClear} label="chapa" />
        </div>
      </div>

      {/* Vistas disponibles para esta carrocería */}
      <div className="grid gap-1 sm:gap-1.5 mb-3" style={{ gridTemplateColumns: `repeat(${views.length}, minmax(0,1fr))` }} role="tablist">
        {views.map((v) => {
          const count = markers.filter((m) => m.view === v).length;
          const active = v === activeView;
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={active}
              title={VIEW_LABEL[v].label}
              onClick={() => setView(v)}
              className={`py-2.5 sm:py-3 px-1 border-2 text-[11px] sm:text-xs font-mono font-black uppercase tracking-tight whitespace-nowrap flex items-center justify-center gap-1 ${
                active ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900'
              }`}
            >
              <span>{VIEW_LABEL[v].short}</span>
              {count > 0 && (
                <span className="min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tipo de daño (arriba del plano, para que el plano entre en pantalla) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3" role="radiogroup" aria-label="Tipo de daño">
        {(Object.keys(DAMAGE_TYPES) as DamageType[]).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={selectedType === t}
            onClick={() => setSelectedType(t)}
            className={`text-xs py-2.5 px-2 border-2 font-bold flex items-center justify-center gap-1.5 ${
              selectedType === t ? 'bg-white border-slate-900 ring-2 ring-slate-900' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-900'
            }`}
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: DAMAGE_TYPES[t].color }} aria-hidden />
            {DAMAGE_TYPES[t].label}
          </button>
        ))}
      </div>

      {/* Plano */}
      <div className="border-2 border-slate-900 bg-white p-2 sm:p-3 mb-4 select-none">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 mb-2">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => setView(views[idx - 1])}
            className="p-1.5 disabled:opacity-30 hover:bg-slate-100 border border-slate-300"
            aria-label="Vista anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="uppercase font-black text-slate-900 text-xs sm:text-sm">
            {idx + 1}. {VIEW_LABEL[activeView].label}
          </span>
          <button
            type="button"
            disabled={idx === views.length - 1}
            onClick={() => setView(views[idx + 1])}
            className="p-1.5 disabled:opacity-30 hover:bg-slate-100 border border-slate-300"
            aria-label="Vista siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div
          onClick={handleImageClick}
          className="relative w-full aspect-[16/9] bg-white overflow-hidden cursor-crosshair touch-manipulation"
        >
          <img
            src={blueprintSrc(key, activeView)}
            alt={`Plano ${VIEW_LABEL[activeView].label}`}
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
          {activeMarkers.map((m) => (
            <span
              key={m.id}
              style={{ left: `${m.x}%`, top: `${m.y}%`, backgroundColor: DAMAGE_TYPES[m.type]?.color ?? '#e11d48' }}
              onClick={(e) => e.stopPropagation()}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full text-white font-black text-[11px] flex items-center justify-center border-2 border-white shadow-md"
              title={`#${numberOf(m.id)} ${DAMAGE_TYPES[m.type]?.label ?? ''}${m.note ? ' — ' + m.note : ''}`}
            >
              {numberOf(m.id)}
            </span>
          ))}
        </div>
      </div>

      {/* Lista de puntos de la vista */}
      <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
        <span>
          Puntos en {VIEW_LABEL[activeView].label} ({activeMarkers.length})
        </span>
        {markers.length > 0 && (
          <button type="button" onClick={handleClearAll} className="text-rose-600 font-bold hover:underline text-xs normal-case">
            Borrar todos
          </button>
        )}
      </div>
      {hidden > 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-300 p-2 mb-2">
          Hay {hidden} punto(s) en vistas que esta carrocería no tiene (por ejemplo, el techo del furgón). Siguen guardados.
        </p>
      )}
      {activeMarkers.length === 0 ? (
        <div className="text-center py-3 bg-slate-50 border border-dashed border-slate-300 text-slate-500 text-xs font-medium">
          Sin detalles en esta vista.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {activeMarkers.map((m) => (
            <li key={m.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 text-xs text-slate-800">
              <span
                className="w-6 h-6 rounded-full text-white font-black text-[11px] flex items-center justify-center shrink-0"
                style={{ background: DAMAGE_TYPES[m.type]?.color }}
              >
                {numberOf(m.id)}
              </span>
              <span className="font-bold shrink-0 hidden sm:inline">{DAMAGE_TYPES[m.type]?.label}</span>
              <input
                type="text"
                value={m.note ?? ''}
                onChange={(e) => handleNoteChange(m.id, e.target.value)}
                placeholder={`${DAMAGE_TYPES[m.type]?.label}: ¿qué pieza?`}
                aria-label={`Nota del punto ${numberOf(m.id)}`}
                className="min-w-0 flex-1 bg-white border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:border-slate-900"
              />
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                className="p-1.5 hover:text-rose-600 text-slate-400"
                aria-label={`Eliminar punto ${numberOf(m.id)}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {footer}
    </section>
  );
};
