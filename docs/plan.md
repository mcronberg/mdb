# MyDigitalBrain (MDB) — Project Plan

## Status: Phase 1 in progress

## Project Info
- GitHub Pages: https://mcronberg.github.io/mdb/
- Supabase project: mdb (MCronberg org)

## Tech Stack
- Vite 6 + React 19 + TypeScript
- React Router v6 (HashRouter)
- Tailwind CSS v4
- shadcn/ui (Radix UI + Tailwind)
- Tiptap v2 (rich text editor)
- Supabase JS v2 (auth + database)
- TanStack Query v5
- vite-plugin-pwa
- date-fns

## Phases

### Phase 1 — Foundation + GitHub Pages verification ✅
- [x] `.github/copilot-instructions.md`
- [x] Vite + React + TypeScript project
- [x] Tailwind CSS v4
- [x] vite.config.ts with base `/mdb/` + PWA plugin
- [x] Static landing page (no Supabase)
- [x] React Router v6 HashRouter
- [x] `.env.local` + `.gitignore`
- [x] GitHub Actions deploy workflow
- [ ] Verify: https://mcronberg.github.io/mdb/ shows landing page

### Phase 2 — Supabase & Auth
- [ ] SQL migrations: profiles, notes, diary_entries + RLS
- [ ] AuthContext with Supabase auth state
- [ ] LoginPage + RegisterPage (email/password)
- [ ] ProtectedRoute

### Phase 3 — App Shell & Layout
- [ ] AppShell — sidebar (desktop) / bottom nav (mobile)
- [ ] Dashboard with overview

### Phase 4 — Notes module
- [ ] Tiptap editor with toolbar
- [ ] NotesList with search
- [ ] NoteEditor with auto-save (debounced)
- [ ] TanStack Query hooks

### Phase 5 — Diary module
- [ ] DiaryList with date navigation
- [ ] DiaryEditor with date picker + mood
- [ ] TanStack Query hooks

### Phase 6 — PWA + Polish
- [ ] PWA manifest + service worker
- [ ] Install prompt
- [ ] Responsive layout testing

## Supabase Schema
```sql
profiles (id uuid PK FK auth.users, username text, avatar_url text, created_at timestamptz)
notes (id uuid PK, user_id uuid FK auth.users, title text, content text, created_at timestamptz, updated_at timestamptz)
diary_entries (id uuid PK, user_id uuid FK auth.users, content text, mood text, entry_date date, created_at timestamptz, updated_at timestamptz)
```
