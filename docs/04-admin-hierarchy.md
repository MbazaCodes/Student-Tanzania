# Admin Hierarchy — National / Regional / District

TSID government access is tiered. Each level has a defined scope and a set of
**exclusive** functions so responsibilities don't overlap.

## Roles

| Role (DB value) | Tier | Scope | Portal |
|-----------------|------|-------|--------|
| `gov` / `admin` | 0 | Nationwide (all TZ) | `/gov` |
| `gov_region` | 1 | One region | `/gov` |
| `gov_district` | 2 | One district | `/gov` |
| `school` | — | One school | `/school` |
| `student` | — | One student | `/student` |

Tier is computed by `adminTier()` in `src/lib/tsid.ts`.

## Oversight chain

```
National (gov)
   ├── oversees → Regional admins
   └── oversees → District admins
Regional (gov_region)
   └── oversees → District admins in their region
District (gov_district)
   └── manages  → schools & students in their district
```

## Exclusive functions

| Function | National | Regional | District |
|----------|:--------:|:--------:|:--------:|
| Create **Regional** admins | ✅ | — | — |
| Create **District** admins | ✅ | ✅ (own region) | — |
| Edit / delete admins | ✅ | — | — |
| Reset **admin** password | ✅ | — | — |
| Register schools | ✅ | ✅ (own region) | ✅ (own district) |
| Reset **school** password | ✅ | ✅ (own region) | ✅ (own district) |
| Edit / delete schools | ✅ | — | — |
| Approve schools in region | ✅ | ✅ | — |
| Verify students | ✅ | ✅ | ✅ (own district) |
| National reports / oversight | ✅ | (region only) | (district only) |
| Add notes/remarks | ✅ | — | — |

All three tiers can register schools **within their scope**. Scope is
enforced server-side in Edge Functions and via RLS policies.

## Scope enforcement

Two layers:
1. **RLS policies** (Postgres) — use `SECURITY DEFINER` helper functions
   `is_national()`, `my_region()`, `my_district()`, `my_role()` to filter
   what each admin can read/write without recursion.
2. **Edge Functions** — re-verify the caller's role and scope before
   creating/modifying users (since they use the service-role key).

## Where it lives in code

- `src/lib/tsid.ts` — `Role` type, `GOV_ROLES`, `isGovRole()`, `adminTier()`
- `src/hooks/use-current-user.ts` — exposes `role`, `region`, `district`, `tier`
- `src/routes/_authenticated/gov.admins.tsx` — admin management UI
- `src/routes/_authenticated/gov.tsx` — tier-aware nav + portal title
- `supabase/migrations/011_admin_hierarchy.sql` — roles, helpers, RLS
- `supabase/migrations/012_fix_rls_recursion.sql` — recursion fix (critical)
- `supabase/functions/create-admin/` — creates admins (scope-checked)
- `supabase/functions/manage-admin/` — reset password / delete (scope-checked)

## Superadmin
- Email: `support@tsid.go.tz`
- UID: `58a154bb-1ea0-4875-9cc7-0800704546b3`
- Role: `gov` (National), seeded via migration 007 + 008.
