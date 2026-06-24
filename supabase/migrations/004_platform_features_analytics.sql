-- ============================================================================
-- TSID: PLATFORM FEATURES & ANALYTICS (migrations 0101-0150)
-- Notifications, jobs, sync, OAuth, webhooks, reports, dashboards
-- Merged files: 50
-- ============================================================================

-- ------------------------------------------------------------
-- 202606240101_create_dev_environment.sql
-- ------------------------------------------------------------
insert into environment_registry(environment_name)
values ('development')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240102_create_staging_environment.sql
-- ------------------------------------------------------------
insert into environment_registry(environment_name)
values ('staging')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240103_create_production_environment.sql
-- ------------------------------------------------------------
insert into environment_registry(environment_name)
values ('production')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240104_create_edge_functions_registry.sql
-- ------------------------------------------------------------
create table edge_functions_registry (
    id uuid primary key default gen_random_uuid(),
    function_name text unique
);

-- ------------------------------------------------------------
-- 202606240105_create_job_scheduler.sql
-- ------------------------------------------------------------
create table scheduled_jobs (
    id uuid primary key default gen_random_uuid(),
    job_name text,
    cron_expression text
);

-- ------------------------------------------------------------
-- 202606240106_create_background_tasks.sql
-- ------------------------------------------------------------
create table background_tasks (
    id uuid primary key default gen_random_uuid(),
    task_name text,
    status text
);

-- ------------------------------------------------------------
-- 202606240107_create_siem_integrations.sql
-- ------------------------------------------------------------
create table siem_integrations (
    id uuid primary key default gen_random_uuid(),
    provider_name text,
    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240108_create_security_alerts.sql
-- ------------------------------------------------------------
create table security_alerts (
    id uuid primary key default gen_random_uuid(),
    severity text,
    message text,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240109_create_incident_management.sql
-- ------------------------------------------------------------
create table incidents (
    id uuid primary key default gen_random_uuid(),
    title text,
    status text
);

-- ------------------------------------------------------------
-- 202606240110_create_partitioned_audit_logs.sql
-- ------------------------------------------------------------
create table partitioned_audit_logs (
    id bigint generated always as identity,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240111_create_student_search_indexes.sql
-- ------------------------------------------------------------
create index idx_student_name_search
on students(first_name,last_name);

-- ------------------------------------------------------------
-- 202606240112_create_certificate_indexes.sql
-- ------------------------------------------------------------
create index idx_certificate_lookup
on digital_certificates(certificate_number);

-- ------------------------------------------------------------
-- 202606240113_create_national_statistics.sql
-- ------------------------------------------------------------
create materialized view mv_national_statistics as
select count(*) total_students
from students;

-- ------------------------------------------------------------
-- 202606240114_create_dashboard_cache.sql
-- ------------------------------------------------------------
create table dashboard_cache (
    cache_key text primary key,
    cache_data jsonb
);

-- ------------------------------------------------------------
-- 202606240115_create_data_archival.sql
-- ------------------------------------------------------------
create table archived_students (
    like students including all
);

-- ------------------------------------------------------------
-- 202606240116_create_disaster_recovery_tests.sql
-- ------------------------------------------------------------
create table disaster_recovery_tests (
    id uuid primary key default gen_random_uuid(),
    test_date timestamptz
);

-- ------------------------------------------------------------
-- 202606240117_create_performance_monitoring.sql
-- ------------------------------------------------------------
create table performance_monitoring (
    id uuid primary key default gen_random_uuid(),
    metric_name text,
    metric_value numeric
);

-- ------------------------------------------------------------
-- 202606240118_create_system_health_checks.sql
-- ------------------------------------------------------------
create table system_health_checks (
    id uuid primary key default gen_random_uuid(),
    service_name text,
    status text
);

-- ------------------------------------------------------------
-- 202606240119_create_release_registry.sql
-- ------------------------------------------------------------
create table release_registry (
    id uuid primary key default gen_random_uuid(),
    version text
);

-- ------------------------------------------------------------
-- 202606240120_create_enterprise_readiness.sql
-- ------------------------------------------------------------
create table enterprise_readiness (
    id uuid primary key default gen_random_uuid(),
    readiness_area text,
    status text
);

-- ------------------------------------------------------------
-- 202606240121_create_notification_engine.sql
-- ------------------------------------------------------------
create table notification_engine (

    id uuid primary key default gen_random_uuid(),

    notification_type text not null,

    channel text not null,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240122_create_email_queue.sql
-- ------------------------------------------------------------
create table email_queue (

    id uuid primary key default gen_random_uuid(),

    recipient text not null,

    subject text,

    body text,

    status text default 'pending',

    retries integer default 0,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240123_create_sms_queue.sql
-- ------------------------------------------------------------
create table sms_queue (

    id uuid primary key default gen_random_uuid(),

    phone_number text not null,

    message text not null,

    status text default 'pending',

    retries integer default 0,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240124_create_push_notifications.sql
-- ------------------------------------------------------------
create table push_notifications (

    id uuid primary key default gen_random_uuid(),

    user_id uuid,

    title text,

    body text,

    status text default 'pending',

    sent_at timestamptz,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240125_create_bulk_import_jobs.sql
-- ------------------------------------------------------------
create table bulk_import_jobs (

    id uuid primary key default gen_random_uuid(),

    file_name text,

    file_size bigint,

    records_count integer,

    successful_records integer default 0,

    failed_records integer default 0,

    status text,

    started_at timestamptz,

    completed_at timestamptz

);

-- ------------------------------------------------------------
-- 202606240126_create_export_jobs.sql
-- ------------------------------------------------------------
create table export_jobs (

    id uuid primary key default gen_random_uuid(),

    export_type text,

    file_name text,

    file_url text,

    status text,

    created_by uuid,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240127_create_job_history.sql
-- ------------------------------------------------------------
create table job_history (

    id uuid primary key default gen_random_uuid(),

    job_name text,

    execution_status text,

    execution_log text,

    started_at timestamptz,

    ended_at timestamptz

);

-- ------------------------------------------------------------
-- 202606240128_create_sync_registry.sql
-- ------------------------------------------------------------
create table sync_registry (

    id uuid primary key default gen_random_uuid(),

    system_name text,

    sync_type text,

    sync_status text,

    last_sync timestamptz,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240129_create_sync_failures.sql
-- ------------------------------------------------------------
create table sync_failures (

    id uuid primary key default gen_random_uuid(),

    sync_id uuid,

    system_name text,

    error_message text,

    stack_trace text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240130_create_external_systems.sql
-- ------------------------------------------------------------
create table external_systems (

    id uuid primary key default gen_random_uuid(),

    system_name text not null,

    api_endpoint text,

    auth_type text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240131_create_api_consumers.sql
-- ------------------------------------------------------------
create table api_consumers (

    id uuid primary key default gen_random_uuid(),

    consumer_name text not null,

    consumer_type text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240132_create_api_scopes.sql
-- ------------------------------------------------------------
create table api_scopes (

    id uuid primary key default gen_random_uuid(),

    scope_name text unique,

    description text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240133_create_oauth_clients.sql
-- ------------------------------------------------------------
create table oauth_clients (

    id uuid primary key default gen_random_uuid(),

    client_name text,

    client_id text unique,

    client_secret text,

    redirect_uri text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240134_create_webhooks.sql
-- ------------------------------------------------------------
create table webhooks (

    id uuid primary key default gen_random_uuid(),

    webhook_name text,

    target_url text,

    secret_key text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240135_create_webhook_logs.sql
-- ------------------------------------------------------------
create table webhook_logs (

    id uuid primary key default gen_random_uuid(),

    webhook_id uuid,

    payload jsonb,

    response_code integer,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240136_create_public_api_usage.sql
-- ------------------------------------------------------------
create table public_api_usage (

    id uuid primary key default gen_random_uuid(),

    endpoint text,

    requester_ip inet,

    response_code integer,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240137_create_student_timeline.sql
-- ------------------------------------------------------------
create table student_timeline (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    event_type text,

    event_description text,

    event_date timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240138_create_activity_stream.sql
-- ------------------------------------------------------------
create table activity_stream (

    id uuid primary key default gen_random_uuid(),

    user_id uuid,

    activity_type text,

    activity_data jsonb,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240139_create_report_templates.sql
-- ------------------------------------------------------------
create table report_templates (

    id uuid primary key default gen_random_uuid(),

    template_name text,

    template_definition jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240140_create_generated_reports.sql
-- ------------------------------------------------------------
create table generated_reports (

    id uuid primary key default gen_random_uuid(),

    report_name text,

    report_url text,

    generated_by uuid,

    generated_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240141_create_report_exports.sql
-- ------------------------------------------------------------
create table report_exports (

    id uuid primary key default gen_random_uuid(),

    report_id uuid,

    export_format text,

    export_url text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240142_create_dashboard_widgets.sql
-- ------------------------------------------------------------
create table dashboard_widgets (

    id uuid primary key default gen_random_uuid(),

    widget_name text,

    widget_type text,

    widget_config jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240143_create_dashboard_layouts.sql
-- ------------------------------------------------------------
create table dashboard_layouts (

    id uuid primary key default gen_random_uuid(),

    layout_name text,

    layout_definition jsonb,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240144_create_data_quality_rules.sql
-- ------------------------------------------------------------
create table data_quality_rules (

    id uuid primary key default gen_random_uuid(),

    rule_name text,

    rule_description text,

    validation_expression text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240145_create_duplicate_detection.sql
-- ------------------------------------------------------------
create table duplicate_detection (

    id uuid primary key default gen_random_uuid(),

    source_record_id uuid,

    duplicate_record_id uuid,

    confidence_score numeric,

    reviewed boolean default false,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240146_create_data_corrections.sql
-- ------------------------------------------------------------
create table data_corrections (

    id uuid primary key default gen_random_uuid(),

    table_name text,

    record_id text,

    old_value jsonb,

    new_value jsonb,

    corrected_by uuid,

    corrected_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240147_create_system_announcements.sql
-- ------------------------------------------------------------
create table system_announcements (

    id uuid primary key default gen_random_uuid(),

    title text,

    message text,

    active boolean default true,

    published_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240148_create_feature_flags.sql
-- ------------------------------------------------------------
create table feature_flags (

    id uuid primary key default gen_random_uuid(),

    feature_name text unique,

    enabled boolean default false,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240149_create_release_notes.sql
-- ------------------------------------------------------------
create table release_notes (

    id uuid primary key default gen_random_uuid(),

    version text,

    notes text,

    release_date timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240150_create_operations_readiness.sql
-- ------------------------------------------------------------
create table operations_readiness (

    id uuid primary key default gen_random_uuid(),

    readiness_area text,

    readiness_status text,

    remarks text,

    checked_at timestamptz default now()

);

