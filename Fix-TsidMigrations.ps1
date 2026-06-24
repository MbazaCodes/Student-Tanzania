# TSID Migration Fix Script
# Run from: PS C:\Users\DELL\Downloads\tsid-main\tsid-remix-sparkle-main>

$MigrationPath = "C:\Users\DELL\Downloads\tsid-main\tsid-remix-sparkle-main\supabase\migrations"

if (-not (Test-Path $MigrationPath)) {
    Write-Host "ERROR: Path not found: $MigrationPath" -ForegroundColor Red
    exit 1
}

function Write-Fix {
    param([string]$Name, [string]$Sql)
    $File = Join-Path $MigrationPath $Name
    [System.IO.File]::WriteAllText($File, $Sql, [System.Text.UTF8Encoding]::new($false))
    Write-Host "[FIXED] $Name" -ForegroundColor Green
}

Write-Fix '202606240024_rls_students.sql' @"
-- RLS for students (fixed: removed duplicate policy)
alter table students enable row level security;

create policy students_super_admin_all
on students
for all
using (
    public.is_super_admin()
);
"@

Write-Fix '202606240025_regional_access_function.sql' @"
-- Regional access helper (fixed: use admin_users.ref not profiles.region_id)
create or replace function public.user_region()
returns text
language sql
stable
as `$`$
  select au.ref
  from public.admin_users au
  where au.auth_uid = auth.uid()
  and au.role = 'gov'
  limit 1;
`$`$;
"@

Write-Fix '202606240026_regional_student_policy.sql' @"
-- Regional student policy (fixed: students uses text region column, not region_id FK)
create policy regional_admin_students
on students
for select
using (
    exists (
        select 1
        from public.admin_users au
        where au.auth_uid = auth.uid()
        and au.role = 'gov'
        and students.region = au.ref
    )
);
"@

Write-Fix '202606240027_district_access.sql' @"
-- District access policy (fixed: students uses text district column, not district_id FK)
create policy district_admin_students
on students
for select
using (
    exists (
        select 1
        from public.admin_users au
        where au.auth_uid = auth.uid()
        and au.role = 'gov'
        and students.district = au.ref
    )
);
"@

Write-Fix '202606240028_school_access.sql' @"
-- School access policy (fixed: students uses school_code text, not school_id UUID)
create policy school_admin_students
on students
for all
using (
    exists (
        select 1
        from public.admin_users au
        where au.auth_uid = auth.uid()
        and au.role = 'school'
        and students.school_code = au.ref
    )
);
"@

Write-Fix '202606240111_create_student_search_indexes.sql' @"
-- Student search indexes (fixed: uses actual Phase-1 column names)
create index if not exists idx_student_fullname_search
on students(fullname);

create index if not exists idx_student_tsid
on students(tsid);

create index if not exists idx_student_school_code
on students(school_code);

create index if not exists idx_student_region
on students(region);

create index if not exists idx_student_district
on students(district);

create index if not exists idx_student_status
on students(status);
"@

Write-Fix '202606240112_create_certificate_indexes.sql' @"
-- Certificate indexes (fixed: no certificate_number column in stub table)
create index if not exists idx_digital_certificates_student_id
on digital_certificates(student_id);

create index if not exists idx_digital_certificates_hash
on digital_certificates(certificate_hash);

create index if not exists idx_digital_certificates_status
on digital_certificates(status);

create index if not exists idx_digital_certificates_issued_at
on digital_certificates(issued_at desc);
"@

Write-Host ""
Write-Host "Done! 7 files patched in:" -ForegroundColor Cyan
Write-Host "  $MigrationPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Now run: supabase db push --password YOUR_DB_PASSWORD" -ForegroundColor Yellow
