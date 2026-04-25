# MyDigitalBrain (MDB) — Copilot Instructions

## Project Overview
MyDigitalBrain (MDB) is a personal PWA for storing notes, diary entries, and other personal data. It is hosted on GitHub Pages and uses Supabase as the backend. Multiple users can sign up and each has their own isolated data.

## Tech Stack
- **Vite 6 + React 19 + TypeScript** — SPA, no SSR
- **React Router v6** — HashRouter (required for GitHub Pages)
- **Tailwind CSS v4** — CSS-first config (`@import "tailwindcss"` in index.css), `dark` class strategy
- **shadcn/ui** — UI components (Radix UI primitives + Tailwind)
- **Tiptap v2** — Rich text editor
- **Supabase JS v2** — Auth (email/password) + PostgreSQL database
- **TanStack Query v5** — Server state management and caching
- **vite-plugin-pwa** — Service worker, offline support, app manifest
- **date-fns** — Date formatting

## Hosting
- **GitHub Pages** at `https://mcronberg.github.io/mdb/`
- Vite `base` is set to `/mdb/`
- GitHub Actions deploys on push to `main` → `gh-pages` branch

## Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (JWT)
- Never use `service_role` key in frontend code

## Project Structure
```
src/
  components/
    ui/          # shadcn/ui components
    layout/      # AppShell, Sidebar, Header, BottomNav
    notes/       # NotesList, NoteEditor
    diary/       # DiaryList, DiaryEditor
    log/         # LogDefinitionCard, LogEntryForm, LogSettings
    auth/        # ProtectedRoute
  pages/         # DashboardPage, NotesPage, DiaryPage, LogPage, LoginPage
  hooks/         # useNotes, useDiary, useLogDefinitions, useLogEntries
  context/       # AuthContext
  lib/
    supabase.ts  # Supabase client singleton
    queryClient.ts
  types/
    index.ts     # shared TypeScript types
```

## Supabase Schema
```sql
-- profiles: extends auth.users
profiles (id uuid PK FK auth.users, username text, avatar_url text, created_at timestamptz)

-- notes
notes (id uuid PK, user_id uuid FK auth.users, title text, content text, created_at timestamptz, updated_at timestamptz)

-- diary_entries
diary_entries (id uuid PK, user_id uuid FK auth.users, content text, mood text, entry_date date, created_at timestamptz, updated_at timestamptz)

-- log_definitions: user-defined metrics to track
log_definitions (id uuid PK, user_id uuid FK auth.users, label text, data_type text CHECK('int','decimal','bool','duration','text'), unit text, sort_order int, created_at timestamptz)

-- log_entries: individual timestamped log events (multiple per day allowed)
log_entries (id uuid PK, user_id uuid FK auth.users, definition_id uuid FK log_definitions, logged_at timestamptz, value_int int, value_decimal numeric, value_bool boolean, value_text text, note text, created_at timestamptz)
```
All tables have Row Level Security (RLS) — users can only access their own rows.
Migrations: `supabase/migrations/001_init.sql`, `supabase/migrations/002_log.sql`

## Conventions
- Dark mode is the **default**; always use `dark:` Tailwind classes
- Use `HashRouter` — never `BrowserRouter` (breaks on GitHub Pages)
- All Supabase queries go through TanStack Query hooks in `src/hooks/`
- Components in `src/components/` are reusable; page-level logic in `src/pages/`
- Keep `.env.local` and `supabase.secret.txt` out of git (see .gitignore)
- Auto-save note/diary edits with a 1-second debounce
- No caching: `staleTime: 0, gcTime: 0` in queryClient, no PWA runtime caching
- `tiptap-markdown` storage must be accessed as `(editor.storage as any).markdown` (no TypeScript types)
- App version read from `package.json` via `readFileSync` in `vite.config.ts`, exposed as `__APP_VERSION__` global

## Key Files
- `vite.config.ts` — base path, Tailwind plugin, PWA config, `__APP_VERSION__` define
- `src/lib/supabase.ts` — Supabase client
- `src/context/AuthContext.tsx` — Auth state provider
- `supabase/migrations/001_init.sql` — Initial schema (profiles, notes, diary_entries)
- `supabase/migrations/002_log.sql` — Log module schema (log_definitions, log_entries)
- `.github/workflows/deploy.yml` — CI/CD to GitHub Pages
