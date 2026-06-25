# Authentication & Role Resolution

## Login

Login page: `src/routes/auth.tsx` with three role tabs (Government, School
Admin, Student / Parent). All use Supabase Auth:

```ts
await supabase.auth.signInWithPassword({ email, password });
```

Every account — admins, schools, students (going forward) — is a real
`auth.users` record. (Legacy schools/students created before Edge Functions
have only a username + hash and cannot log in; they must be re-registered.)

## Role resolution order

After login (and in `use-current-user.ts`), the role is resolved in this order:

1. **`auth.users.app_metadata.role`** — fastest, set when the account is created
2. **`admin_users.role`** — looked up by `auth_uid`
3. **`user_roles.role`** — fallback mirror table
4. Default → `student`

The resolved role determines the home route via `roleHome()`:
- `gov` / `admin` / `gov_region` / `gov_district` → `/gov`
- `school` → `/school`
- `student` → `/student`

## `useCurrentUser()` hook

`src/hooks/use-current-user.ts` returns:
```ts
{
  loading, userId, email,
  role,                    // Role
  ref,                     // school_code (school) / tsid (student)
  schoolCode, tsid,        // convenience
  fullName,
  region, district,        // admin scope
  tier,                    // 0 national, 1 regional, 2 district, null otherwise
}
```

Pages use `tier` to show/hide actions and `region`/`district` to scope queries.

## Auth guard

`src/routes/_authenticated/route.tsx` runs `beforeLoad`:
```ts
const { data, error } = await supabase.auth.getUser();
if (error || !data.user) throw redirect({ to: "/auth" });
```
All `/gov`, `/school`, `/student` routes are children of `_authenticated`.

## Passwords

- Auth passwords are managed by **Supabase Auth** (secure, salted).
- Legacy in-table passwords used **PBKDF2-SHA256** (100k iterations, random
  16-byte salt) via Web Crypto — see `hashPassword()` / `verifyPassword()` in
  `src/lib/tsid.ts`. Kept only for backward compatibility; new accounts use
  Supabase Auth.

## Scope enforcement (defense in depth)

1. **UI** — hides actions a tier can't perform (e.g. District admins don't see Administrators)
2. **RLS** — Postgres policies filter rows by `is_national()` / `my_region()` / `my_district()`
3. **Edge Functions** — re-verify caller role + scope before privileged writes
