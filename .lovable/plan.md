## Goal
Drop the current `profiles` / `user_roles` / `students.tsid_no` schema and replace it with the uploaded TSID migrations (`admin_users`, `schools`, `students` keyed by `tsid`, `applications`, `payments`, `certificates`, `request_letters`, `activity_logs`, public views). Make the existing auth flow and dashboards work against the new shape so "No TSID profile found" goes away and the build is green.

## Step 1 — Database migration (single Supabase migration)
Run one combined migration that:

1. Drops the current Phase‑1 tables and types (cascade): `audit_logs`, `payments`, `applications`, `students`, `schools`, `profiles`, `user_roles`; types `app_role`, `student_status`, `application_status`, `payment_status`; functions `has_role`, `current_school_id`, `handle_new_user`, `search_student`, `touch_updated_at`, and the `on_auth_user_created` trigger on `auth.users`.
2. Runs `00_extensions.sql` → `04_rls_policies.sql` verbatim, with two adjustments required for Lovable Cloud:
   - **Bootstrap UID swap.** The uploaded file hardcodes `79cc662a-…` for `admin@tsid.go.tz`. We replace it with the real existing auth user `support@tsid.go.tz` → `a083ddd1-66a0-4439-87e8-bf77af03f32a` so the admin row binds to a real account.
   - **`schools` username CHECK relaxation.** The `schools.username` column gets a length cap (≤30) but no format CHECK conflict with existing data (no existing rows after drop, so safe).
3. Adds `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated` and `GRANT ALL … TO service_role` for every new table (the uploaded files rely on RLS only; PostgREST also needs grants on Lovable Cloud).
4. Adds an `on_auth_user_created` trigger that inserts a stub `admin_users` row with `role='student'` for every new auth signup so first‑login never lands without a profile.

## Step 2 — Regenerate types
After the migration runs, `src/integrations/supabase/types.ts` is auto‑regenerated. All route code will then typecheck against the new schema.

## Step 3 — Rewrite app code against the new schema
Touched files:

- `src/lib/tsid.ts` — replace `Role = 'gov'|'school'|'student'` mapping; rename to match new `user_role` enum (`admin`/`gov`/`school`/`student`); update `roleHome()` to add an `admin` home (reuses `/gov`).
- `src/hooks/use-current-user.ts` — read role/ref from `admin_users` via `get_user_profile()` RPC instead of `user_roles`.
- `src/routes/auth.tsx` — after `signInWithPassword`, look up role via `get_user_profile()`; remove the "No TSID profile found" hard error path (fall back to `/student` for stubs), add an `Admin` role chip.
- `src/routes/_authenticated/route.tsx` — same lookup change.
- Gov routes (`gov.index/schools/students/logs.tsx`) — query the new `schools`/`students`/`applications`/`activity_logs` columns (`code`, `tsid`, `fullname`, `school_code`, `region`, `district`, `ward`, etc.). Replace `audit_logs` reads with `activity_logs (action, message, by_name, by_role, created_at)`.
- School routes (`school.index/students/applications/settings.tsx`) — use `students(tsid, fullname, school_code, level, status, photo)`, `applications(school_code, status)`; resolve current school via `get_user_profile().ref`.
- Student routes (`student.index/id/applications.tsx`) — load own row via `students.tsid = profile.ref`; QR payload uses `tsid` not `tsid_no`.
- `src/routes/search.tsx` — query the new `public_student_search` view (TSID, fullname, school_official_name, school_region) instead of the dropped `search_student` RPC.
- `src/components/tsid/id-card.tsx` — rename `tsid_no` → `tsid`, `full_name` → `fullname`.
- Delete the old migration files under `supabase/migrations/2026062320…` (superseded by the new combined one).

## Step 4 — Verify
- Build passes (`tsgo`).
- Sign in as `support@tsid.go.tz` → lands on `/gov` with role `admin` (admin and gov share the gov dashboard).
- `/search` returns a row when given an active TSID.
- Public landing + favicon still load (no regression from prior turn).

## Notes
- No seed data is inserted beyond the single `admin_users` row for `support@tsid.go.tz`.
- All passwords stored in `admin_users.password` are SHA‑256 hashes; app sign‑in still goes through Supabase Auth (the `password` column is only used by the legacy non‑Supabase flow in the uploaded SQL — kept for compatibility but unused by this app).
- This will sign out all existing users because `user_roles` is gone; only the bootstrapped admin retains a role.
