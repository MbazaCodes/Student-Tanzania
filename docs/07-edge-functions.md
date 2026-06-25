# Edge Functions

Supabase Edge Functions (Deno) handle operations that need the
**service-role key** — creating auth users, resetting passwords, deleting
users. The service-role key is **never** exposed to the browser; it lives only
in the Edge Function runtime (auto-injected by Supabase).

Every function verifies the **caller's identity and scope** before acting.

Location: `supabase/functions/<name>/index.ts`

---

## `create-admin`

Creates a Regional or District administrator.

**Caller permission:**
- National can create Regional or District admins
- Regional can create District admins (own region only)

**Payload:**
```json
{
  "name": "Asha Mwakyusa",
  "email": "asha@tsid.go.tz",
  "password": "TempPass123!",
  "role": "gov_region" | "gov_district",
  "region": "Iringa",
  "district": "Iringa MC"   // required for district
}
```

**Does:**
1. Verifies caller is an admin with permission for the requested level/scope
2. `auth.admin.createUser` with `email_confirm: true` (no validation block / no confirmation email)
3. Inserts `admin_users` row + `user_roles` + `activity_logs`
4. Rolls back the auth user if the row insert fails

---

## `create-school`

Registers a school **and** creates its login auth account.

**Caller permission:** any gov-tier admin, scope-enforced
(Regional → own region, District → own district).

**Payload:**
```json
{
  "school_code": "IR8557",
  "school_name": "Kihesa Primary School",
  "type": "Primary School",
  "region": "Iringa",
  "district": "Iringa MC",
  "ward": "Kihesa",
  "address": "...",
  "phone": "+255...",
  "email": "kihesa@tsid.go.tz",   // login email
  "password": "TempPass123!"
}
```

**Does:**
1. Verifies caller scope
2. Creates auth user (`role: school`, email auto-confirmed)
3. Inserts `schools` row (+ `auth_uid`), `admin_users` row (`ref = school_code`), `user_roles`, `activity_logs`
4. Rolls back auth user if school insert fails

> Schools registered **before** this function existed have no `auth_uid` and
> cannot log in or have passwords reset — delete and re-register them.

---

## `manage-admin`

National + scoped actions on existing accounts.

**Actions & permissions:**
| Action | Who | Notes |
|--------|-----|-------|
| `reset_password` | National only | resets an **admin** password |
| `delete_admin` | National only | deletes admin (auth user + rows); cannot delete self or a National admin |
| `reset_school_password` | any gov tier (scoped) | resets a **school** login password |

**Payloads:**
```json
// reset admin password
{ "action": "reset_password", "target_uid": "<auth_uid>", "new_password": "..." }

// delete admin
{ "action": "delete_admin", "target_uid": "<auth_uid>" }

// reset school password
{ "action": "reset_school_password", "school_code": "IR8557", "new_password": "..." }
```

**Scope for `reset_school_password`:**
- National → any school
- Regional → schools in own region
- District → schools in own district

---

## Deploying

Dashboard → Edge Functions → Deploy new function (name must match exactly),
or via CLI:
```bash
npx supabase functions deploy create-admin  --project-ref <project-id>
npx supabase functions deploy create-school  --project-ref <project-id>
npx supabase functions deploy manage-admin   --project-ref <project-id>
```

No manual secrets needed — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` are auto-injected.

## Calling from the frontend
```ts
const { data, error } = await supabase.functions.invoke("create-admin", { body: {...} });
```
Error detail is returned in the JSON body; the frontend parses
`error.context.body` for the message.
