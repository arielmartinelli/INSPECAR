import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { Lock, WifiOff, KeyRound, ArrowLeft } from 'lucide-react';
import { notify } from '../lib/dialogs';
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
  const [mode, setMode] = useState<'login' | 'change'>('login');
  // Mientras se cambia el PIN, el inicio de sesión intermedio no tiene que abrir la app todavía
  const changingRef = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setStatus(data.session ? 'open' : 'locked'));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (changingRef.current) return;
      setStatus(session ? 'open' : 'locked');
    });
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

  // En celular/tablet: campo de texto numérico (así se abre el teclado numérico del sistema)
  // con los dígitos ocultos por CSS. En PC: campo de contraseña común y se escribe con el teclado.
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  if (mode === 'change')
    return (
      <ChangePinScreen
        touch={touch}
        onBack={() => setMode('login')}
        onDone={() => {
          changingRef.current = false;
          setStatus('open');
          notify('El PIN se cambió. Usá el nuevo la próxima vez que se pida.', 'success', 'PIN actualizado');
        }}
        changingRef={changingRef}
      />
    );

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
          type={touch ? 'text' : 'password'}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={touch ? 'off' : 'current-password'}
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, '').slice(0, 12));
            setError('');
          }}
          style={touch ? ({ WebkitTextSecurity: 'disc' } as React.CSSProperties) : undefined}
          className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-slate-800 border-2 border-slate-700 focus:border-white rounded-xl py-3 outline-none"
          autoFocus
        />
        <p role="alert" className="min-h-5 text-center text-sm text-rose-400 mt-2">
          {error}
        </p>
        <button
          type="submit"
          disabled={busy || pin.length < 6}
          className="w-full h-14 mt-3 rounded-xl bg-amber-400 text-slate-900 text-lg font-black disabled:opacity-40"
        >
          {busy ? 'Verificando…' : 'Entrar'}
        </button>
        {!touch && <p className="text-center text-xs text-slate-500 mt-3">Escribí el PIN y apretá Enter.</p>}
      </form>

      <button
        type="button"
        onClick={() => {
          setError('');
          setMode('change');
        }}
        className="mt-6 flex items-center gap-2 text-sm text-slate-300 hover:text-white underline underline-offset-4"
      >
        <KeyRound className="w-4 h-4" aria-hidden /> Cambiar PIN
      </button>

      {!navigator.onLine && (
        <p className="mt-8 flex items-center gap-2 text-xs text-slate-300">
          <WifiOff className="w-4 h-4" aria-hidden /> Sin conexión: conectate una vez para ingresar el PIN.
        </p>
      )}
    </div>
  );
};

/** Valida el PIN nuevo: sólo números, 6 o más dígitos, que no sea repetido ni una escalera. */
const pinProblem = (pin: string): string | null => {
  if (!/^\d+$/.test(pin)) return 'El PIN tiene que tener sólo números.';
  if (pin.length < 6) return 'El PIN tiene que tener al menos 6 números (mejor 8).';
  if (/^(\d)\1+$/.test(pin)) return 'No uses el mismo número repetido.';
  if ('01234567890'.includes(pin) || '09876543210'.includes(pin)) return 'No uses números seguidos (123456…).';
  return null;
};

const ChangePinScreen: FC<{
  touch: boolean;
  onBack: () => void;
  onDone: () => void;
  changingRef: React.MutableRefObject<boolean>;
}> = ({ touch, onBack, onDone, changingRef }) => {
  const [actual, setActual] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [repetido, setRepetido] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const field = (id: string, label: string, value: string, set: (v: string) => void, autoFocus = false) => (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={touch ? 'text' : 'password'}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={id === 'pin-actual' ? (touch ? 'off' : 'current-password') : touch ? 'off' : 'new-password'}
        value={value}
        onChange={(e) => {
          set(e.target.value.replace(/\D/g, '').slice(0, 12));
          setError('');
        }}
        style={touch ? ({ WebkitTextSecurity: 'disc' } as React.CSSProperties) : undefined}
        className="w-full text-center text-2xl tracking-[0.4em] font-mono bg-slate-800 border-2 border-slate-700 focus:border-white rounded-xl py-2.5 outline-none"
        autoFocus={autoFocus}
      />
    </div>
  );

  const submit = async () => {
    if (busy) return;
    if (!actual) return setError('Ingresá el PIN actual.');
    const prob = pinProblem(nuevo);
    if (prob) return setError(prob);
    if (nuevo !== repetido) return setError('El PIN nuevo y la repetición no coinciden.');
    if (nuevo === actual) return setError('El PIN nuevo tiene que ser distinto del actual.');
    if (!navigator.onLine) return setError('Sin conexión: para cambiar el PIN hace falta internet.');

    setBusy(true);
    setError('');
    changingRef.current = true;
    try {
      const { error: e1 } = await supabase!.auth.signInWithPassword({ email: WORKSHOP_EMAIL, password: actual });
      if (e1) {
        changingRef.current = false;
        setError(e1.status === 400 || e1.status === 401 ? 'El PIN actual no es correcto.' : 'No se pudo conectar con el servidor.');
        return;
      }
      const { error: e2 } = await supabase!.auth.updateUser({ password: nuevo });
      if (e2) {
        // Se verificó el PIN actual pero no se pudo cambiar: cerramos la sesión para no dejarla abierta
        await supabase!.auth.signOut();
        changingRef.current = false;
        setError(/weak|short|length/i.test(e2.message) ? 'Supabase rechazó el PIN nuevo por ser muy corto o débil. Probá con 8 números o más.' : 'No se pudo cambiar el PIN. Probá de nuevo.');
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <img src="/logo-white.png" alt="INSPECAR" className="h-9 w-auto mb-8" />
      <KeyRound className="w-6 h-6 text-slate-400 mb-3" aria-hidden />
      <h1 className="text-lg font-bold mb-1">Cambiar PIN</h1>
      <p className="text-xs text-slate-400 mb-6 text-center max-w-[280px]">
        Se cambia para todos los dispositivos. Los que ya tienen la sesión abierta siguen entrando hasta que toquen "Bloquear".
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="w-full max-w-[280px] space-y-3"
      >
        {field('pin-actual', 'PIN actual', actual, setActual, true)}
        {field('pin-nuevo', 'PIN nuevo (8 números o más)', nuevo, setNuevo)}
        {field('pin-repetido', 'Repetí el PIN nuevo', repetido, setRepetido)}
        <p role="alert" className="min-h-5 text-center text-sm text-rose-400">
          {error}
        </p>
        <button
          type="submit"
          disabled={busy || !actual || !nuevo || !repetido}
          className="w-full h-14 rounded-xl bg-amber-400 text-slate-900 text-lg font-black disabled:opacity-40"
        >
          {busy ? 'Cambiando…' : 'Guardar PIN nuevo'}
        </button>
      </form>
      <button type="button" onClick={onBack} className="mt-6 flex items-center gap-2 text-sm text-slate-300 hover:text-white">
        <ArrowLeft className="w-4 h-4" aria-hidden /> Volver
      </button>
    </div>
  );
};
