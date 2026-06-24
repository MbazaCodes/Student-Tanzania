-- ============================================================================
-- TSID: ADVANCED MODULES & NATIONAL READINESS (migrations 0151-0200)
-- Education registry, ML/AI predictions, government dashboards, platform
-- Merged files: 50
-- ============================================================================

-- ------------------------------------------------------------
-- 202606240151_create_institutions.sql
-- ------------------------------------------------------------
create table institutions (

    id uuid primary key default gen_random_uuid(),

    institution_code text unique,

    institution_name text not null,

    institution_type text,

    region_id uuid,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240152_create_universities.sql
-- ------------------------------------------------------------
create table universities (

    id uuid primary key default gen_random_uuid(),

    institution_id uuid,

    university_code text unique,

    accreditation_status text,

    established_year integer

);

-- ------------------------------------------------------------
-- 202606240153_create_colleges.sql
-- ------------------------------------------------------------
create table colleges (

    id uuid primary key default gen_random_uuid(),

    institution_id uuid,

    college_code text unique,

    accreditation_status text

);

-- ------------------------------------------------------------
-- 202606240154_create_training_centers.sql
-- ------------------------------------------------------------
create table training_centers (

    id uuid primary key default gen_random_uuid(),

    institution_id uuid,

    center_type text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240155_create_teachers.sql
-- ------------------------------------------------------------
create table teachers (

    id uuid primary key default gen_random_uuid(),

    teacher_number text unique,

    first_name text,

    last_name text,

    gender text,

    phone text,

    email text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240156_create_teacher_qualifications.sql
-- ------------------------------------------------------------
create table teacher_qualifications (

    id uuid primary key default gen_random_uuid(),

    teacher_id uuid,

    qualification_name text,

    institution_name text,

    graduation_year integer

);

-- ------------------------------------------------------------
-- 202606240157_create_teacher_assignments.sql
-- ------------------------------------------------------------
create table teacher_assignments (

    id uuid primary key default gen_random_uuid(),

    teacher_id uuid,

    school_id uuid,

    assigned_date date,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240158_create_courses.sql
-- ------------------------------------------------------------
create table courses (

    id uuid primary key default gen_random_uuid(),

    course_code text unique,

    course_name text,

    credits integer,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240159_create_programs.sql
-- ------------------------------------------------------------
create table programs (

    id uuid primary key default gen_random_uuid(),

    program_code text unique,

    program_name text,

    duration_years integer

);

-- ------------------------------------------------------------
-- 202606240160_create_departments.sql
-- ------------------------------------------------------------
create table departments (

    id uuid primary key default gen_random_uuid(),

    department_code text unique,

    department_name text,

    institution_id uuid

);

-- ------------------------------------------------------------
-- 202606240161_create_student_programs.sql
-- ------------------------------------------------------------
create table student_programs (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    program_id uuid,

    enrollment_date date,

    graduation_date date,

    status text

);

-- ------------------------------------------------------------
-- 202606240162_create_student_course_enrollments.sql
-- ------------------------------------------------------------
create table student_course_enrollments (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    course_id uuid,

    academic_year text,

    status text

);

-- ------------------------------------------------------------
-- 202606240163_create_attendance.sql
-- ------------------------------------------------------------
create table attendance (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    attendance_date date,

    attendance_status text,

    remarks text

);

-- ------------------------------------------------------------
-- 202606240164_create_discipline_records.sql
-- ------------------------------------------------------------
create table discipline_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    incident_type text,

    description text,

    action_taken text,

    incident_date date

);

-- ------------------------------------------------------------
-- 202606240165_create_special_needs.sql
-- ------------------------------------------------------------
create table special_needs (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    need_type text,

    description text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240166_create_scholarships.sql
-- ------------------------------------------------------------
create table scholarships (

    id uuid primary key default gen_random_uuid(),

    scholarship_name text,

    sponsor_name text,

    amount numeric,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240167_create_student_financial_aid.sql
-- ------------------------------------------------------------
create table student_financial_aid (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    scholarship_id uuid,

    amount_awarded numeric,

    award_year integer

);

-- ------------------------------------------------------------
-- 202606240168_create_student_health_records.sql
-- ------------------------------------------------------------
create table student_health_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    blood_group text,

    allergies text,

    medical_notes text

);

-- ------------------------------------------------------------
-- 202606240169_create_vaccination_records.sql
-- ------------------------------------------------------------
create table vaccination_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    vaccine_name text,

    vaccination_date date,

    dose_number integer

);

-- ------------------------------------------------------------
-- 202606240170_create_guardian_contacts.sql
-- ------------------------------------------------------------
create table guardian_contacts (

    id uuid primary key default gen_random_uuid(),

    guardian_id uuid,

    phone_number text,

    email text,

    address text

);

-- ------------------------------------------------------------
-- 202606240171_create_emergency_contacts.sql
-- ------------------------------------------------------------
create table emergency_contacts (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    contact_name text,

    relationship text,

    phone_number text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240172_create_boarding_information.sql
-- ------------------------------------------------------------
create table boarding_information (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    hostel_id uuid,

    room_number text,

    check_in_date date,

    check_out_date date

);

-- ------------------------------------------------------------
-- 202606240173_create_hostels.sql
-- ------------------------------------------------------------
create table hostels (

    id uuid primary key default gen_random_uuid(),

    hostel_code text unique,

    hostel_name text,

    capacity integer,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240174_create_transport_registry.sql
-- ------------------------------------------------------------
create table transport_registry (

    id uuid primary key default gen_random_uuid(),

    vehicle_number text,

    route_name text,

    capacity integer,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240175_create_library_registry.sql
-- ------------------------------------------------------------
create table library_registry (

    id uuid primary key default gen_random_uuid(),

    book_code text unique,

    title text,

    author text,

    available_copies integer default 0

);

-- ------------------------------------------------------------
-- 202606240176_create_library_transactions.sql
-- ------------------------------------------------------------
create table library_transactions (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    book_id uuid,

    borrowed_date date,

    returned_date date

);

-- ------------------------------------------------------------
-- 202606240177_create_student_clubs.sql
-- ------------------------------------------------------------
create table student_clubs (

    id uuid primary key default gen_random_uuid(),

    club_name text,

    description text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240178_create_sports_registry.sql
-- ------------------------------------------------------------
create table sports_registry (

    id uuid primary key default gen_random_uuid(),

    sport_name text,

    category text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240179_create_competitions.sql
-- ------------------------------------------------------------
create table competitions (

    id uuid primary key default gen_random_uuid(),

    competition_name text,

    competition_type text,

    competition_date date

);

-- ------------------------------------------------------------
-- 202606240180_create_education_registry_readiness.sql
-- ------------------------------------------------------------
create table education_registry_readiness (

    id uuid primary key default gen_random_uuid(),

    readiness_area text,

    readiness_status text,

    remarks text,

    checked_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240181_create_data_lake_registry.sql
-- ------------------------------------------------------------
create table data_lake_registry (

    id uuid primary key default gen_random_uuid(),

    dataset_name text,

    storage_location text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240182_create_ml_training_datasets.sql
-- ------------------------------------------------------------
create table ml_training_datasets (

    id uuid primary key default gen_random_uuid(),

    dataset_name text,

    dataset_version text,

    records_count bigint,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240183_create_prediction_models.sql
-- ------------------------------------------------------------
create table prediction_models (

    id uuid primary key default gen_random_uuid(),

    model_name text,

    model_version text,

    model_type text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240184_create_dropout_predictions.sql
-- ------------------------------------------------------------
create table dropout_predictions (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    risk_score numeric,

    prediction_date timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240185_create_performance_predictions.sql
-- ------------------------------------------------------------
create table performance_predictions (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    predicted_score numeric,

    prediction_date timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240186_create_risk_scoring.sql
-- ------------------------------------------------------------
create table risk_scoring (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    risk_category text,

    risk_score numeric,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240187_create_anomaly_detection.sql
-- ------------------------------------------------------------
create table anomaly_detection (

    id uuid primary key default gen_random_uuid(),

    entity_type text,

    entity_id text,

    anomaly_score numeric,

    detected_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240188_create_fraud_detection.sql
-- ------------------------------------------------------------
create table fraud_detection (

    id uuid primary key default gen_random_uuid(),

    entity_type text,

    entity_id text,

    fraud_score numeric,

    detected_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240189_create_national_kpis.sql
-- ------------------------------------------------------------
create table national_kpis (

    id uuid primary key default gen_random_uuid(),

    kpi_name text,

    kpi_value numeric,

    reporting_period text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240190_create_government_dashboards.sql
-- ------------------------------------------------------------
create table government_dashboards (

    id uuid primary key default gen_random_uuid(),

    dashboard_name text,

    dashboard_config jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240191_create_regional_dashboards.sql
-- ------------------------------------------------------------
create table regional_dashboards (

    id uuid primary key default gen_random_uuid(),

    region_id uuid,

    dashboard_name text,

    dashboard_config jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240192_create_school_dashboards.sql
-- ------------------------------------------------------------
create table school_dashboards (

    id uuid primary key default gen_random_uuid(),

    school_id uuid,

    dashboard_name text,

    dashboard_config jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240193_create_real_time_statistics.sql
-- ------------------------------------------------------------
create table real_time_statistics (

    id uuid primary key default gen_random_uuid(),

    metric_name text,

    metric_value numeric,

    recorded_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240194_create_student_lifecycle_view.sql
-- ------------------------------------------------------------
create view student_lifecycle_view as

select
    s.id,
    s.tsid,
    s.student_status,
    s.created_at
from students s;

-- ------------------------------------------------------------
-- 202606240195_create_certificate_lifecycle_view.sql
-- ------------------------------------------------------------
create view certificate_lifecycle_view as

select
    certificate_number,
    certificate_type,
    issued_at
from digital_certificates;

-- ------------------------------------------------------------
-- 202606240196_create_population_statistics.sql
-- ------------------------------------------------------------
create materialized view population_statistics as

select
    current_region_id,
    count(*) total_students
from students
group by current_region_id;

-- ------------------------------------------------------------
-- 202606240197_create_graduation_statistics.sql
-- ------------------------------------------------------------
create materialized view graduation_statistics as

select
    graduation_date,
    count(*) graduates
from students
where graduation_date is not null
group by graduation_date;

-- ------------------------------------------------------------
-- 202606240198_create_employment_tracking.sql
-- ------------------------------------------------------------
create table employment_tracking (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    employer_name text,

    job_title text,

    employment_status text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240199_create_ai_audit_logs.sql
-- ------------------------------------------------------------
create table ai_audit_logs (

    id uuid primary key default gen_random_uuid(),

    model_name text,

    prediction_type text,

    prediction_result jsonb,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240200_create_national_platform_readiness.sql
-- ------------------------------------------------------------
create table national_platform_readiness (

    id uuid primary key default gen_random_uuid(),

    readiness_area text,

    readiness_status text,

    remarks text,

    assessed_at timestamptz default now()

);

