-- ============================================================================
-- TSID: EXTENDED TABLES & INTEGRATIONS (migrations 0051-0100)
-- Stats, verification, encryption, API, stubs (069-090), sessions
-- Merged files: 50
-- ============================================================================

-- ------------------------------------------------------------
-- 202606240051_create_user_sessions.sql
-- ------------------------------------------------------------
create table user_sessions (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    login_time timestamptz default now(),

    logout_time timestamptz,

    ip_address inet,

    device_info text,

    location text,

    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240052_create_mfa_support.sql
-- ------------------------------------------------------------
create table user_mfa (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    secret_key text not null,

    backup_codes jsonb,

    enabled boolean default false,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240053_create_verification_logs.sql
-- ------------------------------------------------------------
create table verification_logs (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    verified_by text,

    source_ip inet,

    verification_method text,

    success boolean,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240054_create_public_verification_view.sql
-- ------------------------------------------------------------
create view public_student_verification as

select

s.tsid,
s.first_name,
s.last_name,
s.student_status,
sc.school_name

from students s

left join schools sc
on sc.id = s.current_school_id;

-- ------------------------------------------------------------
-- 202606240055_create_qr_codes.sql
-- ------------------------------------------------------------
create table qr_codes (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    qr_token text unique not null,

    active boolean default true,

    generated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240056_create_student_statistics.sql
-- ------------------------------------------------------------
create materialized view mv_student_statistics as

select

current_region_id,

count(*) total_students,

count(*) filter (
where student_status='active'
) active_students

from students

group by current_region_id;

-- ------------------------------------------------------------
-- 202606240057_create_school_statistics.sql
-- ------------------------------------------------------------
create materialized view mv_school_statistics as

select

current_school_id,

count(*) total_students

from students

group by current_school_id;

-- ------------------------------------------------------------
-- 202606240058_create_region_statistics.sql
-- ------------------------------------------------------------
create materialized view mv_region_statistics as

select

r.region_name,

count(s.id) total_students

from regions r

left join students s
on s.current_region_id = r.id

group by r.region_name;

-- ------------------------------------------------------------
-- 202606240059_create_necta_integration.sql
-- ------------------------------------------------------------
create table necta_sync_queue (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    exam_year integer,

    status text default 'pending',

    response jsonb,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240060_create_nida_reference.sql
-- ------------------------------------------------------------
create table nida_references (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    nida_reference_id text,

    verification_status text,

    last_verified timestamptz
);

-- ------------------------------------------------------------
-- 202606240061_create_heslb_records.sql
-- ------------------------------------------------------------
create table heslb_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    application_year integer,

    allocation_amount numeric,

    status text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240062_create_api_audit.sql
-- ------------------------------------------------------------
create table api_audit_logs (

    id uuid primary key default gen_random_uuid(),

    endpoint text,

    method text,

    requester text,

    response_code integer,

    response_time_ms integer,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240063_create_security_events.sql
-- ------------------------------------------------------------
create table security_events (

    id uuid primary key default gen_random_uuid(),

    event_type text,

    severity text,

    description text,

    user_id uuid,

    ip_address inet,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240064_create_backup_registry.sql
-- ------------------------------------------------------------
create table backup_registry (

    id uuid primary key default gen_random_uuid(),

    backup_name text,

    storage_location text,

    backup_size bigint,

    backup_date timestamptz default now(),

    status text
);

-- ------------------------------------------------------------
-- 202606240065_create_health_monitoring.sql
-- ------------------------------------------------------------
create table health_monitoring (

    id uuid primary key default gen_random_uuid(),

    service_name text,

    service_status text,

    response_time_ms integer,

    checked_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240066_create_education_history.sql
-- ------------------------------------------------------------
create table education_history (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    school_id uuid references schools(id),

    academic_year text,

    grade_level text,

    enrollment_date date,

    completion_date date,

    status text,

    remarks text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240067_create_student_academic_records.sql
-- ------------------------------------------------------------
create table student_academic_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    academic_year text,

    average_score numeric,

    grade text,

    remarks text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240068_create_subjects.sql
-- ------------------------------------------------------------
create table subjects (

    id uuid primary key default gen_random_uuid(),

    subject_code text unique,

    subject_name text not null,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240069_create_exam_types.sql
-- ------------------------------------------------------------
-- Exam types (stub - to be implemented)
create table if not exists exam_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    active boolean default true,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240070_create_exam_results.sql
-- ------------------------------------------------------------
-- Exam results (stub - to be implemented)
create table if not exists exam_results (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references students(id) on delete cascade,
    exam_type_id uuid references exam_types(id),
    subject_id uuid references subjects(id),
    score numeric(5,2),
    grade text,
    academic_year text,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240071_create_digital_certificates.sql
-- ------------------------------------------------------------
-- Digital certificates (stub - to be implemented)
create table if not exists digital_certificates (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references students(id) on delete cascade,
    certificate_type text not null,
    issued_at timestamptz default now(),
    certificate_hash text unique,
    status text default 'active',
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240072_create_certificate_signatures.sql
-- ------------------------------------------------------------
-- Certificate signatures (stub - to be implemented)
create table if not exists certificate_signatures (
    id uuid primary key default gen_random_uuid(),
    certificate_id uuid references digital_certificates(id) on delete cascade,
    signer_name text not null,
    signer_role text,
    signature_data text,
    signed_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240073_create_certificate_verification_logs.sql
-- ------------------------------------------------------------
-- Certificate verification logs (stub - to be implemented)
create table if not exists certificate_verification_logs (
    id uuid primary key default gen_random_uuid(),
    certificate_id uuid references digital_certificates(id),
    verified_by text,
    verified_at timestamptz default now(),
    result text,
    ip_address text
);

-- ------------------------------------------------------------
-- 202606240074_create_biometrics_registry.sql
-- ------------------------------------------------------------
-- Biometrics registry (stub - to be implemented)
create table if not exists biometrics_registry (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references students(id) on delete cascade,
    biometric_type text not null,
    biometric_hash text unique,
    enrolled_at timestamptz default now(),
    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240075_create_biometric_verifications.sql
-- ------------------------------------------------------------
-- Biometric verifications (stub - to be implemented)
create table if not exists biometric_verifications (
    id uuid primary key default gen_random_uuid(),
    biometric_id uuid references biometrics_registry(id),
    verified_at timestamptz default now(),
    result text,
    confidence_score numeric(5,4)
);

-- ------------------------------------------------------------
-- 202606240076_create_school_registry_imports.sql
-- ------------------------------------------------------------
-- School registry imports (stub - to be implemented)
create table if not exists school_registry_imports (
    id uuid primary key default gen_random_uuid(),
    filename text,
    imported_by uuid,
    record_count int default 0,
    status text default 'pending',
    errors jsonb,
    imported_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240077_create_ward_registry_imports.sql
-- ------------------------------------------------------------
-- Ward registry imports (stub - to be implemented)
create table if not exists ward_registry_imports (
    id uuid primary key default gen_random_uuid(),
    filename text,
    imported_by uuid,
    record_count int default 0,
    status text default 'pending',
    errors jsonb,
    imported_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240078_create_data_warehouse_students.sql
-- ------------------------------------------------------------
-- Data warehouse students (stub - to be implemented)
create table if not exists data_warehouse_students (
    id uuid primary key default gen_random_uuid(),
    student_id uuid,
    snapshot_date date,
    snapshot_data jsonb,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240079_create_data_warehouse_schools.sql
-- ------------------------------------------------------------
-- Data warehouse schools (stub - to be implemented)
create table if not exists data_warehouse_schools (
    id uuid primary key default gen_random_uuid(),
    school_id uuid,
    snapshot_date date,
    snapshot_data jsonb,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240080_create_data_warehouse_regions.sql
-- ------------------------------------------------------------
-- Data warehouse regions (stub - to be implemented)
create table if not exists data_warehouse_regions (
    id uuid primary key default gen_random_uuid(),
    region_id uuid,
    snapshot_date date,
    snapshot_data jsonb,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240081_create_public_verification_api.sql
-- ------------------------------------------------------------
-- Public verification API table (stub - to be implemented)
create table if not exists public_verification_requests (
    id uuid primary key default gen_random_uuid(),
    tsid text,
    requested_at timestamptz default now(),
    ip_address text,
    result jsonb
);

-- ------------------------------------------------------------
-- 202606240082_create_edge_function_logs.sql
-- ------------------------------------------------------------
-- Edge function logs (stub - to be implemented)
create table if not exists edge_function_logs (
    id uuid primary key default gen_random_uuid(),
    function_name text not null,
    invoked_at timestamptz default now(),
    duration_ms int,
    status text,
    error text
);

-- ------------------------------------------------------------
-- 202606240083_create_disaster_recovery_registry.sql
-- ------------------------------------------------------------
-- Disaster recovery registry (stub - to be implemented)
create table if not exists disaster_recovery_registry (
    id uuid primary key default gen_random_uuid(),
    backup_name text not null,
    backup_type text,
    backup_location text,
    created_at timestamptz default now(),
    verified_at timestamptz,
    status text default 'pending'
);

-- ------------------------------------------------------------
-- 202606240084_create_archive_registry.sql
-- ------------------------------------------------------------
-- Archive registry (stub - to be implemented)
create table if not exists archive_registry (
    id uuid primary key default gen_random_uuid(),
    entity_type text not null,
    entity_id uuid,
    archived_at timestamptz default now(),
    archived_by uuid,
    reason text
);

-- ------------------------------------------------------------
-- 202606240085_create_system_metrics.sql
-- ------------------------------------------------------------
-- System metrics (stub - to be implemented)
create table if not exists system_metrics (
    id uuid primary key default gen_random_uuid(),
    metric_name text not null,
    metric_value numeric,
    recorded_at timestamptz default now(),
    tags jsonb
);

-- ------------------------------------------------------------
-- 202606240086_create_performance_indexes.sql
-- ------------------------------------------------------------
-- Performance indexes phase 3 (stub - to be implemented)
-- Placeholder: add additional indexes as needed
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240087_create_partitioning_functions.sql
-- ------------------------------------------------------------
-- Partitioning functions (stub - to be implemented)
-- Placeholder: add table partitioning as data grows
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240088_create_retention_policies.sql
-- ------------------------------------------------------------
-- Retention policies (stub - to be implemented)
-- Placeholder: data retention / archival rules
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240089_create_national_analytics_views.sql
-- ------------------------------------------------------------
-- National analytics views (stub - to be implemented)
-- Placeholder: national-level reporting views
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240090_create_production_readiness.sql
-- ------------------------------------------------------------
-- Production readiness checks (stub - to be implemented)
-- Placeholder: final production readiness steps
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240091_create_encryption_functions.sql
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 202606240092_create_pii_encryption.sql
-- ------------------------------------------------------------
create table pii_encryption_keys (
    id uuid primary key default gen_random_uuid(),
    key_name text unique,
    active boolean default true,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240093_create_national_audit_ledger.sql
-- ------------------------------------------------------------
create table national_audit_ledger (
    id bigint generated always as identity primary key,
    event_type text,
    event_data jsonb,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240094_create_audit_immutability.sql
-- ------------------------------------------------------------
alter table national_audit_ledger
replica identity full;

-- ------------------------------------------------------------
-- 202606240095_create_search_index_registry.sql
-- ------------------------------------------------------------
create table search_index_registry (
    id uuid primary key default gen_random_uuid(),
    index_name text,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240096_create_global_search.sql
-- ------------------------------------------------------------
create materialized view mv_global_search as
select tsid, first_name, last_name
from students;

-- ------------------------------------------------------------
-- 202606240097_create_api_rate_limits.sql
-- ------------------------------------------------------------
create table api_rate_limits (
    id uuid primary key default gen_random_uuid(),
    endpoint text,
    requests_per_minute integer
);

-- ------------------------------------------------------------
-- 202606240098_create_api_tokens.sql
-- ------------------------------------------------------------
create table api_tokens (
    id uuid primary key default gen_random_uuid(),
    token_hash text,
    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240099_create_service_accounts.sql
-- ------------------------------------------------------------
create table service_accounts (
    id uuid primary key default gen_random_uuid(),
    account_name text unique,
    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240100_create_environment_registry.sql
-- ------------------------------------------------------------
create table environment_registry (
    id uuid primary key default gen_random_uuid(),
    environment_name text unique
);

