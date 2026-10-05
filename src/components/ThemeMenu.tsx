import { useEffect, useRef, useState, type FC } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEMES, type ThemeId } from '../lib/theme';

/** Botón con ícono de paleta para cambiar el estilo visual (Clásico / Taller / Ficha técnica). */
export const ThemeMenu: FC<{ value: ThemeId; onChange: (t: ThemeId) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Cambiar estilo"
        aria-label="Cambiar estilo de la app"
        className="p-2 border-2 border-slate-300 text-slate-600 hover:border-slate-900 bg-white"
      >
        <Palette className="w-4 h-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] z-[80] p-1.5">
          <p className="px-2 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Estilo de la app</p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={value === t.id}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-2 py-2.5 text-left hover:bg-slate-100 ${value === t.id ? 'bg-slate-100' : ''}`}
            >
              <span className="flex shrink-0 rounded-full overflow-hidden border border-slate-300" aria-hidden>
                <span className="w-3.5 h-7" style={{ background: t.swatch[0] }} />
                <span className="w-3.5 h-7" style={{ background: t.swatch[1] }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-slate-900">{t.label}</span>
                <span className="block text-[11px] text-slate-500">{t.hint}</span>
              </span>
              {value === t.id && <Check className="w-4 h-4 text-slate-900" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
