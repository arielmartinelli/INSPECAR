import type { FC } from 'react';
import type { YesNoValue } from '../types/inspection';
import { Wrench, Check, X } from 'lucide-react';
import { ClearButton } from './ClearButton';

interface AccessoriesSectionProps {
  items: string[];
  values: Record<string, YesNoValue>;
  onChange: (item: string, value: YesNoValue) => void;
  onBulkChange: (updates: Record<string, YesNoValue>) => void;
  /** Paso actual, ej. "2/7" */
  step?: string;
  onClear?: () => void;
  canClear?: boolean;
}

export const AccessoriesSection: FC<AccessoriesSectionProps> = ({
  items,
  values,
  onChange,
  onBulkChange,
  step = '5',
  onClear,
  canClear
}) => {
  const pending = items.filter((i) => values[i] == null);
  // Sólo completa los pendientes: no pisa un NO ya marcado.
  const handleMarkPendingYes = () => {
    onBulkChange(Object.fromEntries(pending.map((i) => [i, 'SI' as YesNoValue])));
  };

  return (
    <div className="bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="min-w-8 h-8 px-1.5 bg-slate-900 text-white flex items-center justify-center whitespace-nowrap font-mono font-bold text-sm">
            {step}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-900" />
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                Accesorios de Emergencia
              </h3>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Verificación de herramientas de auxilio y seguridad vial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={handleMarkPendingYes}
          disabled={pending.length === 0}
          className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 font-bold uppercase tracking-wider transition-colors disabled:opacity-40 active:translate-x-0.5 active:translate-y-0.5"
        >
          Resto SÍ
        </button>
        <ClearButton onClick={onClear} disabled={!canClear} label="accesorios" />
        </div>
      </div>

      <div className="divide-y border-t border-b border-slate-200">
        {items.map((item, idx) => {
          const currentVal = values[item];

          return (
            <div
              key={item}
              className={`py-3 px-2 flex items-center justify-between transition-colors ${
                idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'
              }`}
            >
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                {item}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(item, currentVal === 'SI' ? null : 'SI')}
                  aria-pressed={currentVal === 'SI'}
                  aria-label={`${item}: sí`}
                  className={`w-16 h-10 border-2 font-mono font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                    currentVal === 'SI'
                      ? 'bg-emerald-600 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-900 hover:text-emerald-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>SÍ</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange(item, currentVal === 'NO' ? null : 'NO')}
                  aria-pressed={currentVal === 'NO'}
                  aria-label={`${item}: no`}
                  className={`w-16 h-10 border-2 font-mono font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                    currentVal === 'NO'
                      ? 'bg-rose-600 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-900 hover:text-rose-700'
                  }`}
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>NO</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
