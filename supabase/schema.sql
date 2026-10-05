-- ════════════════════════════════════════════════════════════════
-- INSPECAR · Esquema de base de datos (Supabase / Postgres)
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin romper nada.
-- ════════════════════════════════════════════════════════════════

-- ── Inspecciones ────────────────────────────────────────────────
create table if not exists public.inspecciones (
  id               text primary key,                         -- mismo id que genera la app (INSP-…)
  owner            uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  patente          text,
  marca            text,
  modelo           text,
  vehiculo         text,
  anio             text,
  carroceria       text,
  cliente_nombre   text,
  cliente_dni      text,
  cliente_telefono text,
  fecha            date,
  dictamen         text,
  estado           text not null default 'borrador'
                   check (estado in ('borrador', 'finalizada', 'entregada', 'compro', 'no_compro')),
  b                int  not null default 0,
  r                int  not null default 0,
  m                int  not null default 0,
  data             jsonb not null,                           -- planilla completa (checklist, chapa, observaciones…)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- columnas normalizadas para buscar "AB 123 CD" como "ab123cd" y DNI con o sin puntos
  patente_norm     text generated always as (upper(regexp_replace(coalesce(patente, ''), '[^A-Za-z0-9]', '', 'g'))) stored,
  cliente_dni_norm text generated always as (regexp_replace(coalesce(cliente_dni, ''), '\D', '', 'g')) stored,
  constraint data_size check (pg_column_size(data) < 500000)
);

create index if not exists inspecciones_owner_updated_idx on public.inspecciones (owner, updated_at desc);
create index if not exists inspecciones_patente_idx       on public.inspecciones (owner, patente_norm);
create index if not exists inspecciones_dni_idx           on public.inspecciones (owner, cliente_dni_norm);
create index if not exists inspecciones_estado_idx        on public.inspecciones (owner, estado);

-- ── Notas de seguimiento ───────────────────────────────────────
create table if not exists public.seguimientos (
  id             bigint generated always as identity primary key,
  inspeccion_id  text not null references public.inspecciones (id) on delete cascade,
  owner          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nota           text not null check (char_length(nota) between 1 and 2000),
  created_at     timestamptz not null default now()
);
create index if not exists seguimientos_insp_idx on public.seguimientos (inspeccion_id, created_at desc);

-- ── updated_at automático ──────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists inspecciones_updated_at on public.inspecciones;
create trigger inspecciones_updated_at before update on public.inspecciones
for each row execute function public.set_updated_at();

-- ── Seguridad: cada cuenta sólo ve y toca lo suyo (Row Level Security) ──
alter table public.inspecciones enable row level security;
alter table public.seguimientos  enable row level security;

drop policy if exists "inspecciones: dueño" on public.inspecciones;
create policy "inspecciones: dueño" on public.inspecciones
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

drop policy if exists "seguimientos: dueño" on public.seguimientos;
create policy "seguimientos: dueño" on public.seguimientos
  for all to authenticated
  using (owner = (select auth.uid()))
  with check (
    owner = (select auth.uid())
    and exists (select 1 from public.inspecciones i where i.id = inspeccion_id and i.owner = (select auth.uid()))
  );

-- Nadie sin sesión (rol anon) puede leer ni escribir nada
revoke all on public.inspecciones from anon;
revoke all on public.seguimientos  from anon;
grant select, insert, update, delete on public.inspecciones to authenticated;
grant select, insert, delete          on public.seguimientos  to authenticated;
