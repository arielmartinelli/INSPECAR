import { useState, type FC, type ChangeEvent } from 'react';
import type { VehicleInfo } from '../types/inspection';
import { POPULAR_VEHICLES, VEHICLE_BODY_TYPES, FUEL_TYPES } from '../data/carData';
import { Car, Hash, Calendar, Gauge, Fuel, ShieldCheck, Edit3, ListFilter } from 'lucide-react';

const MAX_YEAR = new Date().getFullYear() + 1;

interface VehicleHeaderFormProps {
  vehicle: VehicleInfo;
  onChange: (updated: VehicleInfo) => void;
}

export const VehicleHeaderForm: FC<VehicleHeaderFormProps> = ({ vehicle, onChange }) => {
  const [customBrandMode, setCustomBrandMode] = useState(vehicle.marca === 'OTRA');
  const [customModelMode, setCustomModelMode] = useState(vehicle.modelo === 'OTRO');

  const brands = Object.keys(POPULAR_VEHICLES).sort();
  const availableModels =
    vehicle.marca && POPULAR_VEHICLES[vehicle.marca]
      ? POPULAR_VEHICLES[vehicle.marca].popularModels
      : [];

  const handleBrandChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTRA') {
      setCustomBrandMode(true);
      setCustomModelMode(true);
      onChange({
        ...vehicle,
        marca: 'OTRA',
        marcaPersonalizada: '',
        modelo: 'OTRO',
        modeloPersonalizado: ''
      });
    } else {
      setCustomBrandMode(false);
      setCustomModelMode(false);
      const typicalTypes = POPULAR_VEHICLES[val]?.types;
      const suggestedType = typicalTypes && typicalTypes.length > 0 ? typicalTypes[0] : vehicle.tipoVehiculo;

      onChange({
        ...vehicle,
        marca: val,
        marcaPersonalizada: undefined,
        modelo: '',
        tipoVehiculo: vehicle.tipoVehiculo || suggestedType
      });
    }
  };

  const handleModelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTRO') {
      setCustomModelMode(true);
      onChange({
        ...vehicle,
        modelo: 'OTRO',
        modeloPersonalizado: ''
      });
    } else {
      setCustomModelMode(false);
      onChange({
        ...vehicle,
        modelo: val,
        modeloPersonalizado: undefined
      });
    }
  };

  return (
    <div className="bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-5 sm:p-7 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
            01
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
              Ficha del Vehículo
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Datos técnicos y registro del automóvil
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-block text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 border border-slate-300">
          INSPECAR SHEET
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Tipo de Vehículo */}
        <div>
          <label htmlFor="veh-f1" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-900" />
            Tipo de Carrocería
          </label>
          <select id="veh-f1"
            value={vehicle.tipoVehiculo}
            onChange={(e) => onChange({ ...vehicle, tipoVehiculo: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-colors"
          >
            {VEHICLE_BODY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Marca */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="veh-f2" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-900" />
              Marca
            </label>
            <button
              type="button"
              onClick={() => {
                const nextMode = !customBrandMode;
                setCustomBrandMode(nextMode);
                if (nextMode) {
                  onChange({ ...vehicle, marca: 'OTRA', marcaPersonalizada: '' });
                } else {
                  onChange({ ...vehicle, marca: '', marcaPersonalizada: undefined, modelo: '', modeloPersonalizado: undefined });
                }
              }}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
            >
              {customBrandMode ? (
                <>
                  <ListFilter className="w-3 h-3" /> Ver lista
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3" /> Escribir manual
                </>
              )}
            </button>
          </div>

          {!customBrandMode ? (
            <select id="veh-f2"
              value={vehicle.marca}
              onChange={handleBrandChange}
              className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-colors"
            >
              <option value="">-- Seleccionar Marca --</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="OTRA">-- Otra Marca (manual) --</option>
            </select>
          ) : (
            <input id="veh-f2"
              type="text"
              placeholder="Escribe la marca..."
              value={vehicle.marcaPersonalizada || ''}
              onChange={(e) =>
                onChange({ ...vehicle, marca: 'OTRA', marcaPersonalizada: e.target.value })
              }
              className="w-full bg-blue-50/50 border-2 border-blue-600 rounded-none px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white transition-colors"
            />
          )}
        </div>

        {/* Modelo */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="veh-f3" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-slate-900" />
              Modelo
            </label>
            <button
              type="button"
              onClick={() => {
                const nextMode = !customModelMode;
                setCustomModelMode(nextMode);
                if (nextMode) {
                  onChange({ ...vehicle, modelo: 'OTRO', modeloPersonalizado: '' });
                } else {
                  onChange({ ...vehicle, modelo: '', modeloPersonalizado: undefined });
                }
              }}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
            >
              {customModelMode ? (
                <>
                  <ListFilter className="w-3 h-3" /> Ver lista
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3" /> Escribir manual
                </>
              )}
            </button>
          </div>

          {!customModelMode && availableModels.length > 0 ? (
            <select id="veh-f3"
              value={vehicle.modelo}
              onChange={handleModelChange}
              className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-colors"
            >
              <option value="">-- Seleccionar Modelo --</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="OTRO">-- Otro Modelo (manual) --</option>
            </select>
          ) : (
            <input id="veh-f3"
              type="text"
              placeholder="Ej: Toro Freedom, Hilux SRX, Cronos..."
              value={customModelMode ? vehicle.modeloPersonalizado || '' : vehicle.modelo}
              onChange={(e) => {
                if (customModelMode) {
                  onChange({ ...vehicle, modelo: 'OTRO', modeloPersonalizado: e.target.value });
                } else {
                  onChange({ ...vehicle, modelo: e.target.value });
                }
              }}
              className="w-full bg-blue-50/50 border-2 border-blue-600 rounded-none px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white transition-colors"
            />
          )}
        </div>

        {/* Versión / Detalle */}
        <div>
          <label htmlFor="veh-f4" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Versión / Motor (Opcional)
          </label>
          <input id="veh-f4"
            type="text"
            placeholder="Ej: 2.0 4x4 AT9 / 1.6 16v"
            value={vehicle.version || ''}
            onChange={(e) => onChange({ ...vehicle, version: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white transition-colors"
          />
        </div>

        {/* Año */}
        <div>
          <label htmlFor="veh-f5" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-900" />
            Año
          </label>
          <input id="veh-f5"
            type="number"
            min="1980"
            max={MAX_YEAR}
            placeholder="Ej: 2018"
            inputMode="numeric"
            value={vehicle.anio}
            onChange={(e) => onChange({ ...vehicle, anio: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white transition-colors font-mono"
          />
        </div>

        {/* Dominio (Patente) */}
        <div>
          <label htmlFor="veh-f6" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-900" />
            Dominio (Patente)
          </label>
          <input id="veh-f6"
            type="text"
            placeholder="Ej: AC 073 DR"
            value={vehicle.dominio}
            onChange={(e) => onChange({ ...vehicle, dominio: e.target.value.toUpperCase() })}
            className="w-full bg-yellow-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-black text-slate-900 font-mono tracking-widest uppercase focus:outline-none focus:bg-white transition-colors"
          />
        </div>

        {/* Kilómetros */}
        <div>
          <label htmlFor="veh-f7" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-slate-900" />
            Kilómetros
          </label>
          <input id="veh-f7"
            type="number"
            placeholder="Ej: 138600"
            inputMode="numeric"
            min="0"
            value={vehicle.kilometros}
            onChange={(e) => onChange({ ...vehicle, kilometros: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-bold text-slate-900 font-mono focus:outline-none focus:bg-white transition-colors"
          />
        </div>

        {/* Combustible */}
        <div>
          <label htmlFor="veh-f8" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-slate-900" />
            Combustible
          </label>
          <select id="veh-f8"
            value={vehicle.combustible}
            onChange={(e) => onChange({ ...vehicle, combustible: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white transition-colors"
          >
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label htmlFor="veh-f9" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-900" />
            Fecha de Inspección
          </label>
          <input id="veh-f9"
            type="date"
            value={vehicle.fecha}
            onChange={(e) => onChange({ ...vehicle, fecha: e.target.value })}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white transition-colors"
          />
        </div>

        {/* ITV / VTV */}
        <div>
          <label htmlFor="veh-f10" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
            ITV / VTV Vigente
          </label>
          <select id="veh-f10"
            value={vehicle.itvVtv}
            onChange={(e) => onChange({ ...vehicle, itvVtv: e.target.value as 'SI' | 'NO' | '' })}
            className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white transition-colors"
          >
            <option value="">-- Seleccionar Estado --</option>
            <option value="SI">SÍ (Vigente)</option>
            <option value="NO">NO (Vencida o Sin VTV)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
