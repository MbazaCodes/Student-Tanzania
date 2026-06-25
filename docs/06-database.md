# Database — Tables, Columns, RLS

Backend is Supabase Postgres with Row Level Security (RLS) enabled.

## Core tables

### `admin_users`
The identity + role table for every non-student/non-public account.
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `auth_uid` | uuid | FK → `auth.users`, unique |
| `name` | text | |
| `email` | text | unique |
| `role` | text | `gov`, `admin`, `gov_region`, `gov_district`, `school` |
| `region` | text | managed region (admins) or school's region |
| `district` | text | managed district |
| `ministry` | text | |
| `ref` | text | school_code for school accounts |
| `status` | text | `active` / `suspended` |
| `notes` | text | internal remarks |
| `created_by` | uuid | which admin created this row |
| `password` | text | legacy PBKDF2 hash (auth now via Supabase Auth) |

### `schools`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `school_code` | text | unique, region-prefixed (e.g. `IR8557`) |
| `school_name` | text | |
| `type` | text | Pre-School/Nursery, Primary, Secondary, University/College, Vocational, Special Needs |
| `region`, `district`, `ward` | text | location |
| `address`, `phone`, `email` | text | |
| `cred_username` | text | login email |
| `cred_password` | text | legacy hash |
| `auth_uid` | uuid | FK → `auth.users` (school login account) |
| `status` | text | `active` / `suspended` |
| `notes` | text | internal remarks |

### `students`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `tsid` | text | unique, `TSID-YYYY-XXXXXXX` |
| `fullname` | text | |
| `dob`, `gender`, `nationality`, `blood_group` | text | |
| `level` | text | depends on school type |
| `photo` | text | |
| `school_code`, `school_name` | text | |
| `region`, `district`, `ward` | text | inherited from school |
| `school_contact` | text | |
| `enrollment_date`, `issue_date` | text | |
| `parent_name`, `parent_nida`, `relationship`, `parent_phone` | text | guardian |
| `cred_username`, `cred_password` | text | |
| `status` | text | `active` / `suspended` |
| `remarks` | jsonb | |
| `notes` | text | internal remarks |

### `user_roles`
Mirror of role for RLS subqueries.
| Column | Type |
|--------|------|
| `user_id` | uuid (unique) |
| `role` | text |

### `applications`
Student applications submitted to schools (pending/approved/rejected).

### `activity_logs`
App-level audit trail written by the frontend.
| `action`, `message`, `by_name`, `by_role`, `by_ref`, `created_at` |

### `audit_logs`
Trigger-driven DB audit trail (separate from `activity_logs`).

---

## RLS helper functions (SECURITY DEFINER — bypass RLS, prevent recursion)
Defined in migration 011/012:
- `is_national()` → bool — caller is `gov`/`admin`
- `my_role()` → text — caller's role
- `my_region()` → text — caller's managed region
- `my_district()` → text — caller's managed district
- `current_admin()` → admin_users row

These are used inside policies instead of inline `admin_users` subqueries to
avoid the infinite-recursion bug (see migration 012).

---

## Key RLS policies
- **admin_users read**: self OR national OR (regional AND same region)
- **admin_users insert**: national OR (regional creating district in own region)
- **admin_users update/delete**: national only
- **schools read**: all authenticated (true) + anon (for public verify)
- **schools insert/update**: national OR own-region OR own-district
- **schools delete**: national only
- **students read**: all authenticated
- **activity_logs / audit_logs**: authenticated insert + read

---

## Migrations
Full ordered list and run instructions: `supabase/migrations/README.md`.

Summary (run in order in Supabase SQL Editor):
- 001–005 — core schema, RLS, indexes, modules
- 005a — RLS/grants hotfix baseline
- 006 — PBKDF2 password constraint relax
- 007–008 — superadmin seed + metadata
- 009 — missing columns
- 010 — Pre-School type
- 011 — admin hierarchy
- 012 — **RLS recursion fix (critical)**
- 013 — management notes + delete/update policies
- 014 — audit_logs insert policy
- 015 — schools.auth_uid
- 016 — complete student columns

> After any schema change: `NOTIFY pgrst, 'reload schema';`
