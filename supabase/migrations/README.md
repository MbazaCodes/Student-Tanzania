# TSID Database Migrations

Run these in the Supabase SQL Editor **in order**. All are idempotent
(safe to re-run) unless noted.

| # | File | Purpose |
|---|------|---------|
| 001 | `001_foundation_and_schema_reset.sql` | Core schema: schools, students, admin_users, applications, activity_logs, enums |
| 002 | `002_core_tables_rls_indexes.sql` | RLS policies + indexes |
| 003 | `003_extended_tables_integrations.sql` | Extended tables / integrations |
| 004 | `004_platform_features_analytics.sql` | Platform features + analytics |
| 005 | `005_advanced_modules_readiness.sql` | Advanced modules |
| 005a | `005a_rls_grants_baseline.sql` | **Hotfix doc:** user_roles read policy, schools/activity_logs grants, superadmin app_metadata |
| 006 | `006_pbkdf2_password_constraints.sql` | Relax password CHECK for PBKDF2 hashes |
| 007 | `007_superadmin_only.sql` | Seed superadmin `support@tsid.go.tz` (idempotent, safe on existing DB) |
| 008 | `008_fix_superadmin_metadata.sql` | Set `role=gov` in auth.users app_metadata for superadmin |
| 009 | `009_add_missing_columns.sql` | Add missing columns to schools/students/admin_users |
| 010 | `010_add_preschool_type.sql` | Add "Pre-School / Nursery" school type |
| 011 | `011_admin_hierarchy.sql` | National/Regional/District roles, scope helper fns, scoped RLS |
| 012 | `012_fix_rls_recursion.sql` | **Critical:** fix admin_users RLS recursion (was returning empty everywhere) |
| 013 | `013_management_notes.sql` | notes columns + National-only delete/update policies |
| 014 | `014_audit_logs_policy.sql` | Allow trigger-driven inserts into audit_logs (fixes school create RLS error) |

## Notes
- `007_superadmin_seed.sql` is the original (pre-existing-DB) version; prefer `007_superadmin_only.sql`.
- After schema changes, run `NOTIFY pgrst, 'reload schema';` to refresh the PostgREST cache.
- Superadmin UID: `58a154bb-1ea0-4875-9cc7-0800704546b3` (`support@tsid.go.tz`).

## Edge Functions (deploy separately via Supabase Dashboard or CLI)
| Function | Purpose |
|----------|---------|
| `create-admin` | National/Regional create Regional/District admins (service-role, bypasses email validation) |
| `manage-admin` | National-only reset-password + delete-admin (service-role) |
