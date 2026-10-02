import { useState, type FC, type MouseEvent } from 'react';
import type { DamageMarker } from '../types/inspection';
import { Trash2, MapPin, Info, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { VEHICLE_BODY_TYPES } from '../data/carData';

interface CarDamageMapProps {
  markers: DamageMarker[];
  bodyType: string;
  onBodyTypeChange?: (newType: string) => void;
  onChange: (markers: DamageMarker[]) => void;
}

export const CarDamageMap: FC<CarDamageMapProps> = ({
  markers,
  bodyType,
  onBodyTypeChange,
  onChange
}) => {
  const [selectedType, setSelectedType] = useState<'D' | 'Rep' | 'Rayon' | 'Bollo'>('D');
  const [activeView, setActiveView] = useState<DamageMarker['view']>('lateral_der');
  const [damageNote, setDamageNote] = useState('');

  // 5 vistas exactas: Lateral Derecho, Lateral Izquierdo, Frente, Trasera, Techo/Planta
  const views: { id: DamageMarker['view']; label: string; short: string }[] = [
    { id: 'lateral_der', label: '1. Lateral Derecho', short: 'Lat. Der' },
    { id: 'lateral_izq', label: '2. Lateral Izquierdo', short: 'Lat. Izq' },
    { id: 'frente', label: '3. Frente', short: 'Frente' },
    { id: 'trasera', label: '4. Trasera', short: 'Trasera' },
    { id: 'techo', label: '5. Planta / Techo', short: 'Techo' }
  ];

  const currentViewObj = views.find((v) => v.id === activeView) || views[0];
  const currentViewIdx = views.findIndex((v) => v.id === activeView);

  // Normalizar tipo de carrocería
  const norm = bodyType.toLowerCase();
  const isPickup = norm.includes('pick') || norm.includes('caja');
  const isSedan = norm.includes('sedán') || norm.includes('baúl');
  const isVan = norm.includes('furgón') || norm.includes('utilitario') || norm.includes('van') || norm.includes('trafic');

  const vehicleKey = isVan
    ? 'van'
    : isPickup
    ? 'pickup'
    : isSedan
    ? 'sedan'
    : 'hatchback';

  const currentImageSrc = `/blueprints/crops/${vehicleKey}_${activeView}.jpg`;

  const typeConfig = {
    D: { label: 'D = Dañado', color: '#e11d48', badge: 'bg-rose-100 text-rose-800 border-rose-500' },
    Rep: { label: 'Rep = Repintado', color: '#2563eb', badge: 'bg-blue-100 text-blue-800 border-blue-500' },
    Rayon: { label: 'Rayón / Raspón', color: '#d97706', badge: 'bg-amber-100 text-amber-800 border-amber-500' },
    Bollo: { label: 'Bollo / Hundido', color: '#9333ea', badge: 'bg-purple-100 text-purple-800 border-purple-500' }
  };

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newMarker: DamageMarker = {
      id: Math.random().toString(36).substring(2, 9),
      view: activeView,
      x,
      y,
      type: selectedType,
      note: damageNote.trim() || undefined
    };

    onChange([...markers, newMarker]);
    setDamageNote('');
  };

  const handleRemoveMarker = (id: string) => {
    onChange(markers.filter((m) => m.id !== id));
  };

  const activeMarkers = markers.filter((m) => m.view === activeView);

  return (
    <div className="bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-3 sm:p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b-2 border-slate-900 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
            06
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">
              Chapa & Carrocería (Vista Única)
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Silueta: <strong className="text-slate-900">{bodyType}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onBodyTypeChange && (
            <select
              value={bodyType}
              onChange={(e) => onBodyTypeChange(e.target.value)}
              className="bg-slate-100 border-2 border-slate-900 text-xs font-bold px-2.5 py-1.5 uppercase font-mono text-slate-900 focus:outline-none"
            >
              {VEHICLE_BODY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 text-xs font-mono font-bold bg-slate-100 px-2.5 py-1.5 border border-slate-900">
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>{markers.length} Puntos</span>
          </div>
        </div>
      </div>

      {/* SELECTOR DE LAS 5 VISTAS (Scroll horizontal en celular) */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {views.map((v) => {
          const count = markers.filter((m) => m.view === v.id).length;
          const isActive = activeView === v.id;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveView(v.id)}
              className={`flex-1 min-w-[100px] sm:min-w-0 py-2 px-2.5 border-2 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] scale-[1.02]'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900'
              }`}
            >
              <span>{v.label}</span>
              {count > 0 && (
                <span className="w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SELECTOR DE TIPO DE DAÑO */}
      <div className="bg-slate-50 p-3 border-2 border-slate-900 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
          1. Selecciona tipo de daño para colocar con un toque:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
          {(Object.keys(typeConfig) as (keyof typeof typeConfig)[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`text-xs py-2 px-2 border-2 font-bold transition-all text-center ${
                selectedType === t
                  ? 'bg-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ring-2 ring-slate-900 font-black'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-slate-900'
              }`}
            >
              {typeConfig[t].label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={damageNote}
            onChange={(e) => setDamageNote(e.target.value)}
            placeholder={`Nota para ${currentViewObj.label} (ej: puerta raspada, bollo en zócalo)...`}
            className="flex-1 bg-white border-2 border-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* VISTA ÚNICA EN PANTALLA COMPLETA INTERACTIVA */}
      <div className="border-2 border-slate-900 bg-white p-2 sm:p-3 mb-4 select-none">
        {/* Barra de control con flechas previa/siguiente */}
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1.5">
          <button
            type="button"
            disabled={currentViewIdx === 0}
            onClick={() => setActiveView(views[currentViewIdx - 1].id)}
            className="p-1 disabled:opacity-30 hover:bg-slate-100 border border-slate-300 rounded flex items-center gap-1 text-[11px]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <span className="flex items-center gap-1.5 uppercase font-black text-slate-900 text-xs sm:text-sm">
            <Info className="w-4 h-4 text-slate-700" />
            {currentViewObj.label}
          </span>

          <button
            type="button"
            disabled={currentViewIdx === views.length - 1}
            onClick={() => setActiveView(views[currentViewIdx + 1].id)}
            className="p-1 disabled:opacity-30 hover:bg-slate-100 border border-slate-300 rounded flex items-center gap-1 text-[11px]"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Blueprint CAD de alta definición para la vista actual */}
        <div
          onClick={handleImageClick}
          className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-white border border-slate-300 overflow-hidden cursor-crosshair shadow-sm select-none flex items-center justify-center p-2"
        >
          <img
            src={currentImageSrc}
            alt={currentViewObj.label}
            className="max-w-full max-h-full object-contain pointer-events-none select-none"
            draggable={false}
          />

          {/* Marcadores sobre la vista actual */}
          {activeMarkers.map((m, idx) => {
            const cfg = typeConfig[m.type] || typeConfig.D;

            return (
              <div
                key={m.id}
                style={{
                  left: `${m.x}%`,
                  top: `${m.y}%`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMarker(m.id);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                title={`Punto #${idx + 1} (${m.type}) - Toca para borrar`}
              >
                <div
                  style={{ backgroundColor: cfg.color }}
                  className="w-7 h-7 rounded-full text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-md transition-transform group-hover:scale-125"
                >
                  {m.type}
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-950 text-white rounded-full text-[8px] flex items-center justify-center font-bold border border-white">
                    {idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista detallada de marcas registradas en esta vista */}
      <div>
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
          <span>Puntos en {currentViewObj.label} ({activeMarkers.length})</span>
          {markers.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-rose-600 font-bold hover:underline text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Borrar todos
            </button>
          )}
        </div>

        {activeMarkers.length === 0 ? (
          <div className="text-center py-3 bg-slate-50 border border-dashed border-slate-300 text-slate-500 text-xs font-medium">
            Toca sobre la carrocería en esta vista para ubicar un detalle de chapa o pintura.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeMarkers.map((m, idx) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 bg-slate-50 border border-slate-300 text-xs text-slate-800"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                      typeConfig[m.type]?.badge || 'bg-slate-200'
                    }`}
                  >
                    #{idx + 1} {m.type}
                  </span>
                  <span className="font-semibold text-slate-700 truncate">
                    {m.note || '(Punto en coordenadas ' + m.x + '%, ' + m.y + '%)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMarker(m.id)}
                  className="p-1 hover:text-rose-600 text-slate-400 transition-colors ml-2"
                  title="Eliminar punto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
