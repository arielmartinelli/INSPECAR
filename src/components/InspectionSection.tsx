import type { FC, ReactNode } from 'react';
import type { ScoreValue } from '../types/inspection';
import { Check, AlertTriangle, X } from 'lucide-react';
import { ClearButton } from './ClearButton';

interface InspectionSectionProps {
  title: string;
  stepNumber: string;
  onClear?: () => void;
  canClear?: boolean;
  items: string[];
  values: Record<string, ScoreValue>;
  onChange: (item: string, value: ScoreValue) => void;
  onBulkChange: (updates: Record<string, ScoreValue>) => void;
  icon?: ReactNode;
}

export const InspectionSection: FC<InspectionSectionProps> = ({
  title,
  stepNumber,
  items,
  values,
  onChange,
  onBulkChange,
  onClear,
  canClear,
  icon
}) => {
  const total = items.length;
  const answered = items.filter((i) => values[i] !== undefined && values[i] !== null).length;
  const bCount = items.filter((i) => values[i] === 'B' || values[i] === 'B-R').length;
  const rCount = items.filter((i) => values[i] === 'R').length;
  const mCount = items.filter((i) => values[i] === 'M' || values[i] === 'R-M').length;

  const pending = total - answered;

  // Completa con B sólo los ítems vacíos: nunca pisa un R o M ya cargado.
  // (Antes llamaba onChange 20 veces seguidas con el estado viejo y además borraba lo cargado.)
  const handleMarkPendingGood = () => {
    const updates: Record<string, ScoreValue> = {};
    items.forEach((item) => {
      if (values[item] == null) updates[item] = 'B';
    });
    onBulkChange(updates);
  };

  // Helper when clicking B, R or M:
  // If user clicks R while B is already active -> set 'B-R' (intermedio B/R)
  // If user clicks B while R is active -> set 'B-R'
  // If user clicks M while R is active -> set 'R-M' (intermedio R/M)
  // If user clicks R while M is active -> set 'R-M'
  // If user clicks the active one -> toggle off (null)
  const handleScoreClick = (item: string, target: 'B' | 'R' | 'M' | 'NA') => {
    const current = values[item];

    if (target === 'NA') {
      onChange(item, current === 'NA' ? null : 'NA');
      return;
    }

    if (current === target) {
      // Toggle off
      onChange(item, null);
      return;
    }

    if ((current === 'B' && target === 'R') || (current === 'R' && target === 'B')) {
      onChange(item, 'B-R');
      return;
    }

    if ((current === 'R' && target === 'M') || (current === 'M' && target === 'R')) {
      onChange(item, 'R-M');
      return;
    }

    if (current === 'B-R') {
      if (target === 'B') onChange(item, 'B');
      else if (target === 'R') onChange(item, 'R');
      else onChange(item, 'M');
      return;
    }

    if (current === 'R-M') {
      if (target === 'R') onChange(item, 'R');
      else if (target === 'M') onChange(item, 'M');
      else onChange(item, 'B');
      return;
    }

    // Default single select
    onChange(item, target);
  };

  return (
    <div className="bg-white border-2 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-3 sm:p-6 mb-6">
      {/* Header Geometric Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="min-w-8 h-8 px-1.5 bg-slate-900 text-white flex items-center justify-center whitespace-nowrap font-mono font-bold text-sm shrink-0">
            {stepNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                {title}
              </h3>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {answered} de {total} ítems evaluados
            </p>
          </div>
        </div>

        {/* Counter badges & Mark All */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="flex border-2 border-slate-900 font-mono text-xs font-bold divide-x-2 divide-slate-900 bg-white">
            <span className="px-2 py-0.5 text-emerald-700 bg-emerald-50">B: {bCount}</span>
            <span className="px-2 py-0.5 text-amber-700 bg-amber-50">R: {rCount}</span>
            <span className="px-2 py-0.5 text-rose-700 bg-rose-50">M: {mCount}</span>
          </div>

          <button
            type="button"
            onClick={handleMarkPendingGood}
            disabled={pending === 0}
            title="Marca como Bueno sólo los ítems que todavía no evaluaste"
            className="h-8 text-xs bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-3 py-1 font-bold uppercase tracking-wider transition-colors active:translate-x-0.5 active:translate-y-0.5"
          >
            Resto B{pending > 0 ? ` (${pending})` : ''}
          </button>
          <ClearButton onClick={onClear} disabled={!canClear} label={title.replace(/^Puntos de control: /i, '')} />
        </div>
      </div>

      <p className="text-[11px] font-medium text-slate-600 bg-slate-100 p-2 mb-3 border border-slate-300">
        <span className="font-bold text-slate-800">💡 Tip Facu: </span>
        <span>Si tocas B y R seguidos, se marca el punto intermedio <strong>B/R</strong> (mitad). Igual con R y M (<strong>R/M</strong>). Usá <strong>N/A</strong> si el auto no tiene ese elemento.</span>
      </p>

      {/* Grid Table of items */}
      <div className="divide-y divide-slate-200 border-t border-b border-slate-300">
        {items.map((item, idx) => {
          const currentVal = values[item];
          const isB = currentVal === 'B';
          const isBR = currentVal === 'B-R';
          const isR = currentVal === 'R';
          const isRM = currentVal === 'R-M';
          const isM = currentVal === 'M';
          const isNA = currentVal === 'NA';

          return (
            <div
              key={item}
              className={`py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'
              } hover:bg-amber-50/30`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm font-mono font-bold text-slate-400 w-6 shrink-0">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className={`text-sm sm:text-base font-bold leading-snug ${isNA ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                  {item}
                </span>
                {isBR && (
                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-400">
                    B / R (Intermedio)
                  </span>
                )}
                {isRM && (
                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 bg-rose-100 text-rose-900 border border-rose-400">
                    R / M (Intermedio)
                  </span>
                )}
              </div>

              {/* Botonera adaptada a celular táctil amplio */}
              <div role="group" aria-label={`Calificación: ${item}`} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 sm:flex sm:items-center sm:gap-2 self-stretch sm:self-auto">
                {/* Bueno */}
                <button
                  type="button"
                  onClick={() => handleScoreClick(item, 'B')}
                  aria-label="Bueno"
                  aria-pressed={isB || isBR}
                  className={`h-11 sm:h-9 sm:w-14 border-2 font-mono font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 ${
                    isB
                      ? 'bg-emerald-600 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                      : isBR
                      ? 'bg-emerald-500 border-slate-900 text-white ring-2 ring-amber-400'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-900'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>B</span>
                </button>

                {/* Regular */}
                <button
                  type="button"
                  onClick={() => handleScoreClick(item, 'R')}
                  aria-label="Regular"
                  aria-pressed={isR || isBR || isRM}
                  className={`h-11 sm:h-9 sm:w-14 border-2 font-mono font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 ${
                    isR
                      ? 'bg-amber-500 border-slate-900 text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                      : isBR || isRM
                      ? 'bg-amber-400 border-slate-900 text-slate-950 ring-2 ring-slate-900 font-black'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>R</span>
                </button>

                {/* Malo */}
                <button
                  type="button"
                  onClick={() => handleScoreClick(item, 'M')}
                  aria-label="Malo"
                  aria-pressed={isM || isRM}
                  className={`h-11 sm:h-9 sm:w-14 border-2 font-mono font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 ${
                    isM
                      ? 'bg-rose-600 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                      : isRM
                      ? 'bg-rose-500 border-slate-900 text-white ring-2 ring-amber-400'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-900'
                  }`}
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>M</span>
                </button>

                {/* No aplica */}
                <button
                  type="button"
                  onClick={() => handleScoreClick(item, 'NA')}
                  aria-label="No aplica"
                  aria-pressed={isNA}
                  className={`h-11 sm:h-9 px-2 sm:w-12 border-2 font-mono font-bold text-[10px] flex items-center justify-center transition-all active:scale-95 ${
                    isNA
                      ? 'bg-slate-700 border-slate-900 text-white'
                      : 'bg-white border-dashed border-slate-300 text-slate-400 hover:border-slate-900'
                  }`}
                >
                  N/A
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
