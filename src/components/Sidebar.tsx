import type { FC } from 'react';
import { Database, Plus, Trash2, Lock, Cloud, CloudOff, HardDrive, Check, type LucideIcon } from 'lucide-react';

export interface NavStep {
  id: string;
  label: string;
  icon: LucideIcon;
  pending: number;
  done: boolean;
}

interface SidebarProps {
  steps: NavStep[];
  activeStep: string;
  view: 'inspeccion' | 'registros';
  sync: 'local' | 'saving' | 'saved' | 'pending';
  canLock: boolean;
  onStep: (id: string) => void;
  onRecords: () => void;
  onNew: () => void;
  onDelete: () => void;
  onLock: () => void;
}

const SYNC: Record<SidebarProps['sync'], { icon: LucideIcon; label: string; cls: string }> = {
  local: { icon: HardDrive, label: 'Guardado en este dispositivo', cls: 'text-slate-500' },
  saving: { icon: Cloud, label: 'Guardando en la nube…', cls: 'text-slate-500' },
  saved: { icon: Cloud, label: 'Guardado en la nube', cls: 'text-emerald-700' },
  pending: { icon: CloudOff, label: 'Sin señal: se sube después', cls: 'text-amber-700' }
};

/** Navegación lateral para PC (desde 1024 px). En el celular se usan las pestañas de arriba y la barra de abajo. */
export const Sidebar: FC<SidebarProps> = (p) => {
  const S = SYNC[p.sync];
  return (
    <aside className="app-sidebar hidden lg:flex flex-col w-72 shrink-0 h-screen sticky top-0 bg-white border-r-2 border-slate-900">
      <div className="px-5 pt-5 pb-5">
        <img src="/logo.png" alt="INSPECAR" className="logo-img h-8 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3" aria-label="Pasos de la inspección">
        <p className="muted px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Inspección</p>
        <ul className="space-y-1">
          {p.steps.map((s, i) => {
            const active = p.view === 'inspeccion' && p.activeStep === s.id;
            const Icon = s.icon;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => p.onStep(s.id)}
                  aria-current={active ? 'step' : undefined}
                  className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 border-2 text-sm font-bold text-left ${
                    active ? 'bg-slate-900 border-slate-900 text-white' : 'border-transparent text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-6 text-xs font-mono opacity-70">{String(i + 1).padStart(2, '0')}</span>
                  <Icon className="w-4 h-4 shrink-0" aria-hidden />
                  <span className="flex-1">{s.label}</span>
                  {s.pending > 0 ? (
                    <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-1.5" title={`${s.pending} sin evaluar`}>
                      {s.pending}
                    </span>
                  ) : s.done ? (
                    <Check className="w-4 h-4 text-emerald-500" aria-label="Completo" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="muted px-2 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Gestión</p>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={p.onRecords}
              aria-current={p.view === 'registros' ? 'page' : undefined}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 border-2 text-sm font-bold ${
                p.view === 'registros' ? 'bg-slate-900 border-slate-900 text-white' : 'border-transparent text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="w-6" />
              <Database className="w-4 h-4" aria-hidden />
              Registros y seguimiento
            </button>
          </li>
          <li>
            <button type="button" onClick={p.onNew} className="nav-item w-full flex items-center gap-3 px-3 py-2.5 border-2 border-transparent text-sm font-bold text-slate-700 hover:bg-slate-100">
              <span className="w-6" />
              <Plus className="w-4 h-4" aria-hidden />
              Nueva inspección
            </button>
          </li>
          <li>
            <button type="button" onClick={p.onDelete} className="nav-item nav-danger w-full flex items-center gap-3 px-3 py-2.5 border-2 border-transparent text-sm font-bold text-rose-600 hover:bg-rose-50">
              <span className="w-6" />
              <Trash2 className="w-4 h-4" aria-hidden />
              Borrar ficha actual
            </button>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t-2 border-slate-200 space-y-3">
        <p className={`flex items-center gap-2 text-xs font-semibold ${S.cls}`} aria-live="polite">
          <S.icon className="w-4 h-4" aria-hidden /> {S.label}
        </p>
        {p.canLock && (
          <button type="button" onClick={p.onLock} className="muted flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900">
            <Lock className="w-4 h-4" aria-hidden /> Bloquear (pedir PIN)
          </button>
        )}
      </div>
    </aside>
  );
};
