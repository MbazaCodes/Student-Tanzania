-- ============================================================================
-- TSID: CORE TABLES, RLS & INDEXES (migrations 0001-0050)
-- Profiles, students, schools, regions, districts, security, seeds
-- Merged files: 50
-- ============================================================================

-- ------------------------------------------------------------
-- 202606240001_create_profiles.sql
-- ------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    full_name text not null,

    email text unique,

    role text not null check (
        role in (
            'super_admin',
            'government_admin',
            'regional_admin',
            'school_admin',
            'teacher',
            'student'
        )
    ),

    region text,

    district text,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240002_create_students.sql
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

create table if not exists public.students (

    id uuid primary key default gen_random_uuid(),

    tsid varchar(20) unique not null,

    first_name text not null,

    middle_name text,

    last_name text not null,

    gender text,

    date_of_birth date,

    blood_group text,

    nationality text default 'Tanzanian',

    school_id uuid,

    guardian_name text,

    guardian_phone text,

    student_status text default 'active',

    qr_code text,

    photo_url text,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240003_create_schools.sql
-- ------------------------------------------------------------
create table if not exists public.schools (

    id uuid primary key default gen_random_uuid(),

    school_code varchar(20) unique not null,

    school_name text not null,

    region text,

    district text,

    ward text,

    address text,

    phone text,

    email text,

    status text default 'active',

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240004_create_audit_logs.sql
-- ------------------------------------------------------------
create table if not exists public.audit_logs (

    id bigint generated always as identity primary key,

    table_name text not null,

    record_id text,

    action text,

    old_data jsonb,

    new_data jsonb,

    performed_by uuid,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240005_create_student_history.sql
-- ------------------------------------------------------------
create table if not exists public.student_history (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    school_id uuid references schools(id),

    action text,

    remarks text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240006_enable_rls.sql
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table students enable row level security;
alter table schools enable row level security;
alter table audit_logs enable row level security;
alter table student_history enable row level security;

-- ------------------------------------------------------------
-- 202606240007_security_functions.sql
-- ------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from profiles
        where id = auth.uid()
        and role = 'super_admin'
    );
$$;
create policy "super admins full access students"
on students
for all
using (public.is_super_admin());

create policy "super admins full access schools"
on schools
for all
using (public.is_super_admin());

create policy "super admins full access profiles"
on profiles
for all
using (public.is_super_admin());

-- ------------------------------------------------------------
-- 202606240008_indexes.sql
-- ------------------------------------------------------------
create index if not exists idx_students_tsid
on students(tsid);

create index if not exists idx_students_school
on students(school_id);

create index if not exists idx_school_code
on schools(school_code);

create index if not exists idx_profiles_role
on profiles(role);

-- ------------------------------------------------------------
-- 202606240009_storage_policies.sql
-- ------------------------------------------------------------
insert into storage.buckets
(id,name,public)
values
('student-photos','student-photos',true)
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240010_create_tsid_generator.sql
-- ------------------------------------------------------------
create sequence if not exists tsid_sequence start 10000001;

create or replace function generate_tsid()
returns text
language plpgsql
as $$
declare
    next_number bigint;
begin
    next_number := nextval('tsid_sequence');

    return 'TSID' || lpad(next_number::text,8,'0');
end;
$$;

-- ------------------------------------------------------------
-- 202606240011_add_tsid_trigger.sql
-- ------------------------------------------------------------
create or replace function assign_tsid()
returns trigger
language plpgsql
as $$
begin

    if new.tsid is null then
        new.tsid := generate_tsid();
    end if;

    return new;

end;
$$;

drop trigger if exists trg_assign_tsid on students;

create trigger trg_assign_tsid
before insert on students
for each row
execute function assign_tsid();

-- ------------------------------------------------------------
-- 202606240012_create_regions.sql
-- ------------------------------------------------------------
create table if not exists regions (

    id uuid primary key default gen_random_uuid(),

    region_code varchar(10) unique not null,

    region_name text unique not null,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240013_create_districts.sql
-- ------------------------------------------------------------
create table if not exists districts (

    id uuid primary key default gen_random_uuid(),

    region_id uuid not null references regions(id),

    district_code varchar(20),

    district_name text not null,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240014_create_wards.sql
-- ------------------------------------------------------------
create table if not exists wards (

    id uuid primary key default gen_random_uuid(),

    district_id uuid not null references districts(id),

    ward_code varchar(20),

    ward_name text not null,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240015_upgrade_schools.sql
-- ------------------------------------------------------------
alter table schools
add column if not exists region_id uuid references regions(id);

alter table schools
add column if not exists district_id uuid references districts(id);

alter table schools
add column if not exists ward_id uuid references wards(id);

alter table schools
add column if not exists latitude numeric;

alter table schools
add column if not exists longitude numeric;

-- ------------------------------------------------------------
-- 202606240016_upgrade_students.sql
-- ------------------------------------------------------------
alter table students
add column if not exists guardian_relationship text;

alter table students
add column if not exists current_region_id uuid references regions(id);

alter table students
add column if not exists current_district_id uuid references districts(id);

alter table students
add column if not exists current_school_id uuid references schools(id);

alter table students
add column if not exists registration_date date default current_date;

alter table students
add column if not exists graduation_date date;

-- ------------------------------------------------------------
-- 202606240017_create_student_transfers.sql
-- ------------------------------------------------------------
create table if not exists student_transfers (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    from_school_id uuid references schools(id),

    to_school_id uuid references schools(id),

    transfer_reason text,

    transferred_by uuid,

    approved_by uuid,

    transfer_date timestamptz default now(),

    status text default 'pending'
);

-- ------------------------------------------------------------
-- 202606240018_create_qr_verification.sql
-- ------------------------------------------------------------
create table if not exists qr_verifications (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    verification_code text unique not null,

    active boolean default true,

    expiry_date timestamptz,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240019_create_document_registry.sql
-- ------------------------------------------------------------
create table if not exists student_documents (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    document_type text not null,

    document_number text,

    file_url text,

    verification_hash text,

    issued_date date,

    uploaded_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240020_audit_trigger.sql
-- ------------------------------------------------------------
create or replace function audit_changes()
returns trigger
language plpgsql
as $$
begin

insert into audit_logs
(
table_name,
record_id,
action,
old_data,
new_data,
performed_by
)
values
(
TG_TABLE_NAME,
coalesce(new.id::text,old.id::text),
TG_OP,
to_jsonb(old),
to_jsonb(new),
auth.uid()
);

return coalesce(new,old);

end;
$$;

create trigger students_audit
after insert or update or delete
on students
for each row
execute function audit_changes();

create trigger schools_audit
after insert or update or delete
on schools
for each row
execute function audit_changes();

-- ------------------------------------------------------------
-- 202606240021_create_verification_api_table.sql
-- ------------------------------------------------------------
create table if not exists public_verifications (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    public_token text unique not null,

    enabled boolean default true,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240022_create_role_hierarchy.sql
-- ------------------------------------------------------------
alter table profiles
drop constraint if exists profiles_role_check;

alter table profiles
add constraint profiles_role_check
check (
role in (
'super_admin',
'government_admin',
'regional_admin',
'district_admin',
'school_admin',
'teacher',
'student',
'auditor'
)
);

-- ------------------------------------------------------------
-- 202606240023_rls_profiles.sql
-- ------------------------------------------------------------
alter table profiles enable row level security;

drop policy if exists profiles_select_self on profiles;

create policy profiles_select_self
on profiles
for select
using (
    auth.uid() = id
);

create policy super_admin_profiles_all
on profiles
for all
using (
    public.is_super_admin()
);

-- ------------------------------------------------------------
-- 202606240024_rls_students.sql
-- ------------------------------------------------------------
alter table students enable row level security;
create policy students_super_admin_all
on students
for all
using (
    public.is_super_admin()
);
create policy students_super_admin_all
on students
for all
using (
    public.is_super_admin()
);

-- ------------------------------------------------------------
-- 202606240025_regional_access_function.sql
-- ------------------------------------------------------------
create or replace function public.user_region()
returns uuid
language sql
stable
as $$
select region_id
from profiles
where id = auth.uid()
limit 1;
$$;

-- ------------------------------------------------------------
-- 202606240026_regional_student_policy.sql
-- ------------------------------------------------------------
create policy regional_admin_students
on students
for select
using (

    exists (

        select 1
        from profiles p

        where p.id = auth.uid()

        and p.role = 'regional_admin'

        and p.region_id = students.current_region_id

    )

);

-- ------------------------------------------------------------
-- 202606240027_district_access.sql
-- ------------------------------------------------------------
alter table profiles
add column if not exists district_id uuid;
create policy district_admin_students
on students
for select
using (

exists (

select 1
from profiles p

where p.id = auth.uid()

and p.role = 'district_admin'

and p.district_id = students.current_district_id

)

);

-- ------------------------------------------------------------
-- 202606240028_school_access.sql
-- ------------------------------------------------------------
alter table profiles
add column if not exists school_id uuid;
create policy school_admin_students
on students
for all
using (

exists (

select 1
from profiles p

where p.id = auth.uid()

and p.role = 'school_admin'

and p.school_id = students.current_school_id

)

);

-- ------------------------------------------------------------
-- 202606240029_create_notifications.sql
-- ------------------------------------------------------------
create table notifications (

    id uuid primary key default gen_random_uuid(),

    recipient_id uuid,

    title text,

    message text,

    is_read boolean default false,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240030_create_system_settings.sql
-- ------------------------------------------------------------
create table system_settings (

    id uuid primary key default gen_random_uuid(),

    setting_key text unique not null,

    setting_value jsonb,

    updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240031_create_student_status_history.sql
-- ------------------------------------------------------------
create table student_status_history (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    old_status text,

    new_status text,

    changed_by uuid,

    remarks text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240032_create_certificate_registry.sql
-- ------------------------------------------------------------
create table certificate_registry (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    certificate_type text,

    certificate_number text unique,

    issuing_authority text,

    issue_date date,

    verification_hash text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240033_create_necta_results.sql
-- ------------------------------------------------------------
create table necta_results (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    exam_type text,

    exam_year integer,

    index_number text,

    division text,

    points integer,

    raw_data jsonb,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240034_create_api_keys.sql
-- ------------------------------------------------------------
create table api_keys (

    id uuid primary key default gen_random_uuid(),

    system_name text,

    api_key_hash text,

    active boolean default true,

    last_used timestamptz,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240035_create_data_retention.sql
-- ------------------------------------------------------------
create table data_retention_logs (

    id uuid primary key default gen_random_uuid(),

    table_name text,

    archived_records integer,

    archived_at timestamptz default now(),

    archived_by uuid
);

-- ------------------------------------------------------------
-- 202606240036_indexes_phase2.sql
-- ------------------------------------------------------------
create index idx_students_name
on students(first_name,last_name);

create index idx_students_dob
on students(date_of_birth);

create index idx_student_current_school
on students(current_school_id);

create index idx_student_current_region
on students(current_region_id);

create index idx_student_current_district
on students(current_district_id);

create index idx_certificate_number
on certificate_registry(certificate_number);

create index idx_necta_index
on necta_results(index_number);

-- ------------------------------------------------------------
-- 202606240037_seed_regions.sql
-- ------------------------------------------------------------
insert into regions (region_code, region_name) values
('01','Arusha'),
('02','Dar es Salaam'),
('03','Dodoma'),
('04','Geita'),
('05','Iringa'),
('06','Kagera'),
('07','Katavi'),
('08','Kigoma'),
('09','Kilimanjaro'),
('10','Lindi'),
('11','Manyara'),
('12','Mara'),
('13','Mbeya'),
('14','Morogoro'),
('15','Mtwara'),
('16','Mwanza'),
('17','Njombe'),
('18','Pwani'),
('19','Rukwa'),
('20','Ruvuma'),
('21','Shinyanga'),
('22','Simiyu'),
('23','Singida'),
('24','Songwe'),
('25','Tabora'),
('26','Tanga'),
('27','Unguja North'),
('28','Unguja South'),
('29','Pemba North'),
('30','Pemba South')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240038_create_school_types.sql
-- ------------------------------------------------------------
create table school_types (

    id uuid primary key default gen_random_uuid(),

    type_code text unique not null,

    type_name text not null,

    created_at timestamptz default now()
);

insert into school_types(type_code,type_name)
values
('PRE','Pre Primary'),
('PRI','Primary School'),
('SEC','Secondary School'),
('ADV','Advanced Level'),
('VTC','Vocational Training'),
('COL','College'),
('UNI','University')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240039_upgrade_school_registry.sql
-- ------------------------------------------------------------
alter table schools
add column if not exists school_type_id uuid references school_types(id);

alter table schools
add column if not exists registration_number text;

alter table schools
add column if not exists ownership_type text;

alter table schools
add column if not exists emis_code text;

alter table schools
add column if not exists principal_name text;

alter table schools
add column if not exists principal_phone text;

alter table schools
add column if not exists principal_email text;

-- ------------------------------------------------------------
-- 202606240040_create_academic_years.sql
-- ------------------------------------------------------------
create table academic_years (

    id uuid primary key default gen_random_uuid(),

    year_code text unique not null,

    start_date date,

    end_date date,

    active boolean default false,

    created_at timestamptz default now()
);

insert into academic_years
(
year_code,
start_date,
end_date,
active
)
values
(
'2026',
'2026-01-01',
'2026-12-31',
true
);

-- ------------------------------------------------------------
-- 202606240041_create_grade_levels.sql
-- ------------------------------------------------------------
create table grade_levels (

    id uuid primary key default gen_random_uuid(),

    grade_code text unique,

    grade_name text,

    level_order integer
);

insert into grade_levels
(
grade_code,
grade_name,
level_order
)
values
('PP1','Pre Primary 1',1),
('PP2','Pre Primary 2',2),
('STD1','Standard 1',3),
('STD2','Standard 2',4),
('STD3','Standard 3',5),
('STD4','Standard 4',6),
('STD5','Standard 5',7),
('STD6','Standard 6',8),
('STD7','Standard 7',9),
('F1','Form 1',10),
('F2','Form 2',11),
('F3','Form 3',12),
('F4','Form 4',13),
('F5','Form 5',14),
('F6','Form 6',15);

-- ------------------------------------------------------------
-- 202606240042_create_student_enrollment.sql
-- ------------------------------------------------------------
create table student_enrollments (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    school_id uuid not null references schools(id),

    academic_year_id uuid references academic_years(id),

    grade_level_id uuid references grade_levels(id),

    enrollment_date date,

    enrollment_status text default 'active',

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240043_create_guardians.sql
-- ------------------------------------------------------------
create table guardians (

    id uuid primary key default gen_random_uuid(),

    guardian_code text unique,

    full_name text not null,

    relationship_type text,

    phone text,

    email text,

    occupation text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240044_create_student_guardians.sql
-- ------------------------------------------------------------
create table student_guardians (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    guardian_id uuid references guardians(id),

    is_primary boolean default false
);

-- ------------------------------------------------------------
-- 202606240045_create_verification_tokens.sql
-- ------------------------------------------------------------
create table verification_tokens (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    token text unique not null,

    expires_at timestamptz,

    active boolean default true,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240046_create_system_audit_views.sql
-- ------------------------------------------------------------
create view vw_student_summary as

select

s.id,
s.tsid,
s.first_name,
s.last_name,
s.student_status,
sc.school_name,
r.region_name

from students s

left join schools sc
on sc.id = s.current_school_id

left join regions r
on r.id = s.current_region_id;

-- ------------------------------------------------------------
-- 202606240047_create_dashboard_views.sql
-- ------------------------------------------------------------
create view vw_dashboard_metrics as

select

count(*) as total_students,

count(*) filter (
where student_status='active'
) as active_students,

count(*) filter (
where student_status='graduated'
) as graduated_students

from students;

-- ------------------------------------------------------------
-- 202606240048_seed_system_settings.sql
-- ------------------------------------------------------------
insert into system_settings
(
setting_key,
setting_value
)
values
(
'country_config',
'{
"country":"Tanzania",
"currency":"TZS",
"timezone":"Africa/Dar_es_Salaam",
"tsid_version":"2.0"
}'::jsonb
)
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240049_create_permissions.sql
-- ------------------------------------------------------------
create table permissions (

    id uuid primary key default gen_random_uuid(),

    permission_code text unique not null,

    permission_name text not null,

    description text,

    created_at timestamptz default now()
);

insert into permissions
(permission_code, permission_name)
values
('student.read','Read Students'),
('student.write','Manage Students'),
('school.read','Read Schools'),
('school.write','Manage Schools'),
('verification.read','Verify TSID'),
('audit.read','View Audit Logs'),
('system.admin','System Administration')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240050_create_role_permissions.sql
-- ------------------------------------------------------------
create table role_permissions (

    id uuid primary key default gen_random_uuid(),

    role_name text not null,

    permission_id uuid not null
    references permissions(id),

    created_at timestamptz default now()
);

