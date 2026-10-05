import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Cuenta única del taller: el usuario sólo escribe el PIN, que es la contraseña de esta cuenta. */
export const WORKSHOP_EMAIL = import.meta.env.VITE_INSPECAR_EMAIL ?? '';

/** Si faltan las variables, la app funciona igual pero guarda todo sólo en el dispositivo. */
export const cloudEnabled = Boolean(url && anonKey && WORKSHOP_EMAIL);

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'inspecar-auth' }
    })
  : null;

/** Cierra la sesión: la próxima vez se vuelve a pedir el PIN. */
export const lockApp = async () => {
  await supabase?.auth.signOut();
};
