import { useEffect, useState, type FC, type ReactNode } from 'react';
import { Delete, Lock, WifiOff } from 'lucide-react';
import { supabase, cloudEnabled, WORKSHOP_EMAIL } from '../lib/supabase';

/**
 * Acceso con PIN. El PIN es la contraseña de la cuenta del taller en Supabase Auth,
 * así la seguridad la da el servidor (no un número guardado en el navegador).
 * La sesión queda abierta en el dispositivo hasta que se toque "Bloquear".
 */
const LOCK_KEY = 'inspecar_pin_lock';
const MAX_TRIES = 5;
const LOCK_MS = 60_000;

export const PinGate: FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'checking' | 'locked' | 'open'>(cloudEnabled ? 'checking' : 'open');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setStatus(data.session ? 'open' : 'locked'));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setStatus(session ? 'open' : 'locked'));
    return () => data.subscription.unsubscribe();
  }, []);

  if (status === 'open') return <>{children}</>;
  if (status === 'checking') return <div className="min-h-screen grid place-items-center text-slate-500 text-sm">Cargando…</div>;

  const lockedUntil = Number(localStorage.getItem(LOCK_KEY) || 0);

  const submit = async (value = pin) => {
    if (busy || value.length < 6) return;
    if (Date.now() < lockedUntil) {
      setError(`Demasiados intentos. Esperá ${Math.ceil((lockedUntil - Date.now()) / 1000)} s.`);
      return;
    }
    setBusy(true);
    setError('');
    const { error: err } = await supabase!.auth.signInWithPassword({ email: WORKSHOP_EMAIL, password: value });
    setBusy(false);
    if (err) {
      const isAuth = err.status === 400 || err.status === 401;
      const tries = Number(sessionStorage.getItem('inspecar_pin_tries') || 0) + 1;
      sessionStorage.setItem('inspecar_pin_tries', String(tries));
      if (isAuth && tries >= MAX_TRIES) {
        localStorage.setItem(LOCK_KEY, String(Date.now() + LOCK_MS));
        sessionStorage.removeItem('inspecar_pin_tries');
      }
      const network = !navigator.onLine || !err.status || err.status >= 500 || /fetch|network/i.test(err.message);
      setError(network ? 'No se pudo conectar con el servidor. Probá de nuevo.' : 'PIN incorrecto.');
      setPin('');
      return;
    }
    sessionStorage.removeItem('inspecar_pin_tries');
  };

  const press = (d: string) => {
    if (pin.length >= 12) return;
    setPin(pin + d);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <img src="/logo-white.png" alt="INSPECAR" className="h-9 w-auto mb-8" />
      <Lock className="w-6 h-6 text-slate-400 mb-3" aria-hidden />
      <h1 className="text-lg font-bold mb-1">Ingresá tu PIN</h1>
      <p className="text-xs text-slate-400 mb-6">Sólo se pide una vez en cada dispositivo.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="w-full max-w-[280px]"
      >
        <label className="sr-only" htmlFor="pin">
          PIN
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
          className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-slate-800 border-2 border-slate-700 focus:border-white rounded-xl py-3 outline-none"
          autoFocus
        />
        <p role="alert" className="h-5 text-center text-sm text-rose-400 mt-2">
          {error}
        </p>

        <div className="grid grid-cols-3 gap-2.5 mt-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" onClick={() => press(d)} className="h-14 rounded-xl bg-slate-800 hover:bg-slate-700 text-xl font-bold">
              {d}
            </button>
          ))}
          <button type="button" onClick={() => setPin(pin.slice(0, -1))} className="h-14 rounded-xl bg-slate-800 grid place-items-center" aria-label="Borrar">
            <Delete className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => press('0')} className="h-14 rounded-xl bg-slate-800 hover:bg-slate-700 text-xl font-bold">
            0
          </button>
          <button
            type="submit"
            disabled={busy || pin.length < 6}
            className="h-14 rounded-xl bg-amber-400 text-slate-900 font-black disabled:opacity-40"
          >
            {busy ? '…' : 'Entrar'}
          </button>
        </div>
      </form>

      {!navigator.onLine && (
        <p className="mt-8 flex items-center gap-2 text-xs text-slate-300">
          <WifiOff className="w-4 h-4" aria-hidden /> Sin conexión: conectate una vez para ingresar el PIN.
        </p>
      )}
    </div>
  );
};
