# Configurar la base de datos (Supabase) y el acceso con PIN

Son unos 10 minutos y se hace una sola vez. Mientras no se configure, la app funciona igual,
pero guarda todo **sólo en el dispositivo** (sin PIN y sin compartir registros entre celular y PC).

## 1. Crear el proyecto en Supabase

1. Entrá a <https://supabase.com>, creá una cuenta y tocá **New project**.
2. Nombre: `inspecar`. Región: **South America (São Paulo)**. Elegí una contraseña de base de datos y guardala.

## 2. Crear las tablas

1. En el proyecto: **SQL Editor → New query**.
2. Pegá todo el contenido de `supabase/schema.sql` y tocá **Run**.
   Crea las tablas `inspecciones` y `seguimientos` con seguridad por fila (RLS): sin PIN no se puede leer ni escribir nada.

## 3. Crear la cuenta del taller (el PIN)

1. **Authentication → Users → Add user → Create new user**.
   - Email: por ejemplo `taller@inspecar.app` (no hace falta que exista; no se envían mails).
   - Password: **el PIN**. Usá **8 dígitos o más** (mínimo 6) y que no sea 12345678 ni una fecha.
   - Marcá **Auto Confirm User**.
2. **Authentication → Sign In / Providers → Email**: desactivá **Allow new users to sign up**.
   Así nadie más puede crearse una cuenta.

> Para cambiar el PIN: Authentication → Users → el usuario → **Reset password / Update user**.
> Después, en cada dispositivo se ingresa el PIN nuevo.

## 4. Copiar las claves a Vercel

En Supabase: **Project Settings → API**. Copiá:

- **Project URL**
- **anon public** (o *publishable key*)

En Vercel: proyecto INSPECAR → **Settings → Environment Variables**, agregá (para Production, Preview y Development):

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | la Project URL |
| `VITE_SUPABASE_ANON_KEY` | la clave anon / publishable |
| `VITE_INSPECAR_EMAIL` | el mail de la cuenta del paso 3 |

Después: **Deployments → … → Redeploy** (las variables se aplican al compilar).

> ⚠️ Nunca pongas la clave **service_role** en Vercel ni en el código: esa saltea toda la seguridad.
> La clave *anon* es pública por diseño; lo que protege los datos es el PIN + las reglas RLS.

Para probar en tu PC: copiá `.env.example` como `.env.local`, completalo y corré `npm run dev`.
`.env.local` no se sube a GitHub (está en `.gitignore`).

## 5. Listo

- Al abrir la app pide el PIN **una vez por dispositivo**. "Bloquear" (barra lateral en PC) vuelve a pedirlo.
- Todo se guarda solo mientras se carga. Sin señal se guarda en el celular y se sube al volver la conexión.
- **Registros y seguimiento**: buscar por patente, nombre o DNI; filtrar por estado; cambiar estado y agregar notas.

## Copias de seguridad

El plan gratuito de Supabase no incluye backups automáticos descargables. Una vez por mes conviene:
**Table Editor → inspecciones → Export → CSV** (y lo mismo con `seguimientos`).
