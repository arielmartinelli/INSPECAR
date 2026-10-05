import type { FC } from 'react';
import { MessageSquareText } from 'lucide-react';

interface SectionNotesProps {
  id: string;
  title: string;
  value: string;
  onChange: (v: string) => void;
}

/**
 * Observaciones de cada sección (pedido de Facu): se anotan mientras se revisa
 * y después se juntan solas en la observación general del Resumen y del PDF.
 */
export const SectionNotes: FC<SectionNotesProps> = ({ id, title, value, onChange }) => (
  <section className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-3 sm:p-4 mb-6">
    <label htmlFor={id} className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
      <MessageSquareText className="w-4 h-4" aria-hidden />
      Observaciones de {title}
    </label>
    <textarea
      id={id}
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Ej: cubiertas del 2021 al 40% · pérdida de aceite por junta del depresor…"
      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-slate-900 p-3 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white leading-relaxed"
    />
    <p className="text-[11px] text-slate-500 mt-1">Se suma automáticamente a las observaciones del informe.</p>
  </section>
);
