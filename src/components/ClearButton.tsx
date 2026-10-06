import type { FC } from 'react';
import { Eraser } from 'lucide-react';

/** Goma para limpiar sólo la sección actual (va en la cabecera de cada tarjeta). */
export const ClearButton: FC<{ onClick?: () => void; disabled?: boolean; label: string }> = ({ onClick, disabled, label }) =>
  onClick ? (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`Limpiar ${label}`}
      aria-label={`Limpiar ${label}`}
      className="shrink-0 h-8 w-8 grid place-items-center border-2 border-rose-200 text-rose-600 bg-white hover:border-rose-600 hover:bg-rose-50 disabled:opacity-35 disabled:hover:bg-white disabled:hover:border-rose-200"
    >
      <Eraser className="w-4 h-4" aria-hidden />
    </button>
  ) : null;
