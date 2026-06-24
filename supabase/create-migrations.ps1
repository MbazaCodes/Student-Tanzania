$migrationPath = ".\migrations"

New-Item -ItemType Directory -Force -Path $migrationPath

$files = @(
"202606240001_create_profiles.sql",
"202606240002_create_students.sql",
"202606240003_create_schools.sql",
"202606240004_create_audit_logs.sql",
"202606240005_create_student_history.sql",
"202606240006_enable_rls.sql",
"202606240007_security_functions.sql",
"202606240008_indexes.sql",
"202606240009_storage_policies.sql"
)

foreach ($file in $files) {
    New-Item -ItemType File -Force -Path "$migrationPath\$file"
}

New-Item -ItemType File -Force -Path ".\seed.sql"

Write-Host "TSID migrations created successfully"