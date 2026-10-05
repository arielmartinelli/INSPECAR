/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del proyecto Supabase (Settings → API). */
  readonly VITE_SUPABASE_URL?: string;
  /** Clave pública "anon / publishable" de Supabase. Es pública por diseño: la seguridad la dan el PIN + RLS. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Mail de la cuenta del taller en Supabase Auth. El PIN es su contraseña. */
  readonly VITE_INSPECAR_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
