# Conventions

## Git workflow
- Single `main` branch, deployed via Vercel.
- Development happens in a sandbox; changes are committed with detailed
  messages and pushed via PAT.
- Local sync (PowerShell — `&&` is invalid, run separately):
  ```powershell
  git fetch origin
  git reset --hard origin/main
  ```
- Always confirm `git log --oneline -1` matches the latest commit before
  assuming a change is live, then restart `npm run dev`.

## Commit messages
- Prefix with type: `feat:`, `fix:`, `chore:`, `style:`, `docs:`, `db:`, `security:`.
- Body explains the problem and the fix, lists touched files.

## Code conventions
- **TypeScript** everywhere; prefer explicit types for exported helpers.
- **Components**: app-specific in `src/components/tsid/`, primitives in `src/components/ui/`.
- **Shared data** (regions, levels, nationalities) lives in `src/lib/tz-geo.ts`.
- **Role logic** centralised in `src/lib/tsid.ts` (`Role`, `adminTier`, `isGovRole`, `roleHome`).
- **Never** put the service-role key in frontend code — only in Edge Functions.
- **Column names**: DB uses `school_code` / `school_name` (not `code` / `name`),
  `phone` (not `contact`). Match these exactly in queries.

## Styling
- Use design tokens (`--tz-navy`, `--tz-green`, `--tz-gold`, `--primary`, etc.),
  not hardcoded hex, so light/dark and theme consistency hold.
- Shared layout via `PortalShell`; shared page bits via `page-header.tsx`
  (`PageHeader`, `StatCard`, `HeroBanner`, `Panel`).
- Spacing standard: `space-y-6`; cards `rounded-2xl border bg-card p-5`;
  table heads `bg-muted/50`; panel headers `bg-muted/30`.

## Database changes
- Every schema/policy change gets a **numbered migration file** in
  `supabase/migrations/` AND an entry in that folder's `README.md`.
- Migrations are idempotent (`IF NOT EXISTS`, `DROP ... CREATE`, `ON CONFLICT`).
- After applying: `NOTIFY pgrst, 'reload schema';`.

## Security
- RLS on all tables; helper functions are `SECURITY DEFINER` to avoid recursion.
- Defense in depth: UI gating + RLS + Edge Function checks.
- Child safety: the platform handles minors' data — keep access scoped and
  audited (activity_logs / audit_logs).
