# Setup & Deployment

## Local development

### Prerequisites
- Node.js 20+ (or Bun)
- A Supabase project

### Steps
1. Clone the repo:
   ```bash
   git clone https://github.com/MbazaCodes/Student-Tanzania.git
   cd Student-Tanzania
   ```
2. Install dependencies:
   ```bash
   npm install      # or: bun install
   ```
3. Create a `.env` file in the project root (see below).
4. Run the dev server:
   ```bash
   npm run dev      # or: bun run dev
   ```
5. Open `http://localhost:5173` (or the port shown).

> The dev server regenerates `src/routeTree.gen.ts` on start. After adding a
> new route file, restart the dev server.

---

## Environment variables (`.env`)

`.env` is **gitignored** — never commit it. Use `.env.example` as a template.

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

The anon (publishable) key is safe for the browser. The **service-role key is
never used in the frontend** — only inside Edge Functions (auto-injected by
Supabase).

---

## Database setup

Run the SQL migrations in order in the Supabase SQL Editor. See
`supabase/migrations/README.md` for the full ordered list (001–016).

After any schema change, run:
```sql
NOTIFY pgrst, 'reload schema';
```
to refresh the PostgREST cache (otherwise you get 400 "column not found" errors).

---

## Edge Functions

Three functions must be deployed (Dashboard → Edge Functions → Deploy, or CLI):

```bash
npx supabase functions deploy create-admin  --project-ref <project-id>
npx supabase functions deploy create-school  --project-ref <project-id>
npx supabase functions deploy manage-admin   --project-ref <project-id>
```

Supabase auto-injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` — no manual secrets needed.

See `07-edge-functions.md` for what each does.

---

## Production deployment (Vercel)

`vercel.json` is configured for TanStack Start SSR:
- Build: `bun run build`
- Output: `.output/public`
- Node 20 server function

In the Vercel dashboard, add the same env vars from `.env` under
**Settings → Environment Variables**.

---

## Sync workflow (mobile-friendly)

Development is done in a sandbox and pushed to GitHub. To sync locally
(PowerShell — note `&&` is not valid in PowerShell, run separately):

```powershell
git fetch origin
git reset --hard origin/main
npm run dev
```

> Always confirm `git log --oneline -1` matches the latest pushed commit
> before assuming a change is present.
