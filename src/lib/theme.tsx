import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type Lang  = "en" | "sw";

type ThemeCtx = {
  theme: Theme;
  lang: Lang;
  toggleTheme: () => void;
  toggleLang:  () => void;
  t: (key: string) => string;
};

// ── Full bilingual dictionary ─────────────────────────────────────────────────
const TR: Record<Lang, Record<string, string>> = {
  en: {
    // Nav / Header / Footer
    home: "Home", verify: "Verify ID", features: "Features", portals: "Portals",
    signin: "Sign in", getstarted: "Get started", signout: "Sign out",
    tagline: "Jamhuri ya Tanzania",
    footer_platform: "Platform", footer_contact: "Contact",
    footer_copy: "Jamhuri ya Muungano wa Tanzania. All rights reserved.",
    privacy: "Privacy Policy", terms: "Terms of Use", accessibility: "Accessibility",
    uhuru: "Uhuru na Umoja",
    footer_desc: "One verifiable identity for every learner in Tanzania. Issued by registered schools, overseen by the Ministry of Education.",

    // Auth page
    auth_title: "Sign in",
    auth_subtitle: "Use the credentials issued to you by your administrator.",
    auth_no_cred: "Don't have credentials?",
    auth_schools_hint: "Schools: Contact the Ministry of Education (Gov) to register.",
    auth_students_hint: "Students: Ask your school administrator for your login details.",
    auth_back_home: "← Back to home",
    role_gov: "Government", role_school: "School Admin", role_student: "Student / Parent",
    role_gov_desc: "Wizara ya Elimu officer",
    role_school_desc: "School administrator",
    role_student_desc: "Student or guardian",
    email_label: "Email address", password_label: "Password",
    signing_in: "Signing in…",
    sign_in_as: "Sign in as",

    // Portal nav
    nav_dashboard: "Dashboard", nav_students: "Students", nav_schools: "Schools",
    nav_logs: "Audit Logs", nav_create: "Create Student", nav_settings: "Settings",
    nav_myid: "My ID Card", nav_applications: "Applications", nav_payments: "Payments",
    theme_dark: "Dark", theme_light: "Light",
    lang_sw: "Kiswahili", lang_en: "English",

    // Gov dashboard
    gov_title: "Government Portal", gov_subtitle: "Wizara ya Elimu",
    gov_dash_title: "Government dashboard",
    gov_dash_sub: "Live overview of national student identification.",
    gov_welcome: "National Dashboard",
    gov_welcome_sub: "Tanzania Student Identification System",
    gov_register_school: "Register School",
    kpi_students: "Students nationwide", kpi_active: "Active IDs",
    kpi_schools: "Registered schools", kpi_pending_apps: "Pending applications",
    kpi_regions: "Regions covered", kpi_approved: "Approved apps",
    kpi_verified: "Verified schools",
    registered_schools: "Registered Schools",
    manage_arrow: "Manage →", view_all: "View all →", see_all: "See all →",
    recent_activity: "Recent Activity", no_activity: "No activity yet.",
    no_schools: "No schools registered yet.",

    // Gov schools
    gov_schools_title: "Schools",
    gov_schools_sub: "Register institutions and issue their admin credentials.",
    reg_school_btn: "Register school",
    total_schools: "Total schools", verified: "Verified", unverified: "Unverified",
    reg_schools_count: "Registered schools",
    inst_type: "Institution Type *", school_name_lbl: "School Name *",
    region_lbl: "Region *", district_lbl: "District", ward_lbl: "Ward",
    address_lbl: "Address", contact_phone_lbl: "Contact Phone", contact_email_lbl: "Contact Email",
    cred_section: "🔑 Admin Credentials (auto-generated)",
    school_code_lbl: "School Code *", login_email_lbl: "Login Email *", password_lbl2: "Password *",
    regen_cred: "↻ Regenerate credentials",
    reg_submit: "🏫 Register School & Issue Credentials",
    registering: "Registering…",
    issued_title: "✅ School registered — share these credentials",
    copy_cred: "Copy credentials",
    cred_copied: "Credentials copied!",
    code_lbl: "School Code", username_lbl: "Username", pass_lbl: "Password",
    activate: "Activate", suspend: "Suspend", not_set: "Not set",
    col_code: "Code", col_school: "School", col_region: "Region",
    col_cred: "Credentials", col_students: "Students", col_status: "Status",

    // Gov students
    nat_db: "National Student Database",
    nat_db_sub: "students across", schools_in: "schools in", regions_text: "regions",
    total_students: "Total students", active_ids: "Active IDs",
    search_placeholder: "Search name, TSID or school…",
    all_regions: "All regions",
    results: "result", results_pl: "results",
    col_photo: "Photo", col_student: "Student", col_level: "Level", col_issued: "Issued",
    no_students_yet: "No students registered yet.",
    no_match: "No students match your filters.",

    // Gov logs
    logs_title: "Activity Logs",
    logs_sub: "System-wide audit trail",
    entries: "entries",
    col_action: "Action", col_message: "Message", col_by: "By",
    col_role: "Role", col_time: "Time",
    no_logs: "No activity recorded yet.",

    // School portal
    school_portal: "School Portal",
    school_dash_title: "School Dashboard",
    no_school_linked: "No school linked",
    no_school_sub: "Your account isn't linked to a school yet. Contact the government administrator.",
    recently_registered: "Recently Registered",
    students_by_level: "Students by Level",
    no_students_msg: "No students yet.",
    create_student_btn: "Create Student",
    pending_apps: "Pending Applications",
    col_tsid: "TSID", col_name: "Name",

    // School students
    student_db: "Student Database",
    student_db_sub: "students registered",
    create_student_title: "Register New Student",
    search_student: "Search by name or TSID…",
    col_login: "Login",
    student_info: "Student Information",
    tsid_number: "TSID Number", full_name: "Full Name *",
    dob_lbl: "Date of Birth *", gender_lbl: "Gender *",
    nationality_lbl: "Nationality", blood_group_lbl: "Blood Group",
    choose_photo: "📁 Choose photo",
    photo_hint: "JPG / PNG / WebP · max 2 MB\nPassport-style, clear face\nWill appear on the ID card",
    academic_info: "Academic Information",
    current_level: "Current Level", enrollment_date: "Enrollment Date", issue_date: "Issue Date",
    parent_guardian: "Parent / Guardian",
    parent_name: "Parent / Guardian Name", relationship_lbl: "Relationship",
    parent_nida: "Parent NIDA", parent_phone: "Parent Phone",
    school_autofill: "School (Auto-filled)",
    student_login_cred: "🔑 Student Login Credentials",
    student_cred_hint: "These will be the student's login to the TSID portal. Share them securely.",
    gen_new_pass: "↻ Generate new password",
    create_submit: "💾 Create Student & Issue TSID",
    creating: "Creating student…",
    student_issued: "✅ Student registered — share login credentials",
    male: "Male", female: "Female",

    // Student portal
    student_portal: "Student Portal",
    student_dash_title: "Dashboard",
    no_record: "No student record linked",
    no_record_sub: "Your account hasn't been linked to a student record yet. Contact your school — they create your TSID and login credentials.",
    welcome_msg: "Welcome",
    view_id: "🪪 View My ID Card →",
    status_lbl: "Status", level_lbl: "Level", school_lbl: "School", region_label: "Region",
    student_info_sec: "📋 Student Information",
    school_sec: "🏫 School",
    guardian_sec: "👨‍👩‍👧 Parent / Guardian",
    id_preview: "🪪 ID Card Preview",
    full_size_print: "Full size & print →",
    print_btn: "Print",
    my_id_title: "My TSID Card",
    my_id_sub: "Your national student identification card. Print or download below.",
    no_student_linked: "No student record linked to your account yet.",

    // Search
    search_title: "Verify Student Identity",
    search_sub: "Search by name, TSID number or school — public access, no login required.",
    search_input: "Search name, TSID or school…",
    search_btn: "Search",
    searching: "Searching…",
    all_types: "All", schools_only: "Schools", students_only: "Students",
    no_results: "No results found.",
    search_prompt: "Enter a name, TSID number or school to search.",
    pub_stats: "students", pub_stats2: "schools", pub_stats3: "regions",

    // Landing
    official_badge: "Official · Wizara ya Elimu, Sayansi na Teknolojia",
    hero_title: "One verifiable ID for every student in Tanzania.",
    hero_sub: "TSID is the national platform that lets schools issue, students carry, and the government verify student identification — instantly and securely.",
    hero_signin: "Sign in to the portal",
    hero_verify: "Verify a student ID",
    rls_secured: "RLS-secured", tamper_qr: "Tamper-evident QR", made_tz: "Made for Tanzania",
    // How It Works
    how_label: "Simple Process",
    how_title: "How TSID Works",
    how_sub: "Four simple steps — from school registration to a verified national student ID, fully digital and fully official.",
    how_step1_title: "Government Registers School",
    how_step1_body: "The Ministry of Education registers your institution in TSID, assigns a unique school code and issues admin login credentials.",
    how_step2_title: "School Creates Student Record",
    how_step2_body: "School administrators log in and create student profiles — uploading photos, parent info and academic details.",
    how_step3_title: "TSID Number Is Issued",
    how_step3_body: "The system automatically generates a unique TSID number and a printable CR80 ID card with a tamper-evident QR code.",
    how_step4_title: "Anyone Can Verify Instantly",
    how_step4_body: "Scan the QR or enter the TSID number at verify.tsid.go.tz — no login needed, result in seconds.",

    // Stats
    stat_regions: "Regions & Councils",
    stat_portals: "Secure Portals",
    stat_standard: "ID Card Standard",
    stat_digital: "Paperless Process",

    // Sections
    feat_label: "What TSID Does",
    portals_label: "Three Portals",
    roles_sub: "Each stakeholder has a dedicated, role-specific portal with the right tools and permissions.",

    // CTA Banner
    cta_title: "Tanzania's national student ID system — online now.",
    cta_sub: "Join thousands of schools already using TSID to issue verifiable student identification.",

    // Footer
    send_feedback: "Send Feedback",
    features_title: "Built for the whole identification lifecycle",
    feat_school_title: "Schools issue", feat_school_body: "Register students, attach photos, generate official TSID numbers and print plastic-ready ID cards.",
    feat_verify_title: "Anyone verifies", feat_verify_body: "A public, anonymous lookup that returns only sanitized information — no leaks of personal data.",
    feat_gov_title: "Government oversees", feat_gov_body: "Live KPIs across regions, audit logs of every action, and one-click approvals for applications.",
    roles_title: "One platform · three portals",
    role_school_body: "Manage your student database, process applications, accept payments and print cards.",
    role_gov_body: "Verify schools, audit every issuance, monitor regional KPIs and approve escalations.",
    role_student_body: "Carry your ID on your phone, download a printable copy, request letters and certificates.",
    open_portal: "Open the portal →",

    // Common
    done: "Done", cancel: "Cancel", save: "Save", loading: "Loading…",
    active: "Active", inactive: "Inactive", pending: "Pending",
    approved: "Approved", rejected: "Rejected",
    copy: "Copy", download_front: "Download Front", download_back: "Download Back",
    no_data: "No data yet.", redirecting: "Redirecting…",
  },

  sw: {
    // Nav / Header / Footer
    home: "Nyumbani", verify: "Thibitisha Kitambulisho", features: "Vipengele", portals: "Milango",
    signin: "Ingia", getstarted: "Anza Sasa", signout: "Toka",
    tagline: "Jamhuri ya Tanzania",
    footer_platform: "Jukwaa", footer_contact: "Mawasiliano",
    footer_copy: "Jamhuri ya Muungano wa Tanzania. Haki zote zimehifadhiwa.",
    privacy: "Sera ya Faragha", terms: "Masharti ya Matumizi", accessibility: "Ufikiaji",
    uhuru: "Uhuru na Umoja",
    footer_desc: "Utambulisho mmoja unaothibitishwa kwa kila mwanafunzi Tanzania. Uliotolewa na shule zilizosajiliwa, ukisimamiwa na Wizara ya Elimu.",

    // Auth page
    auth_title: "Ingia",
    auth_subtitle: "Tumia nambari za siri zilizotolewa na msimamizi wako.",
    auth_no_cred: "Huna nambari za siri?",
    auth_schools_hint: "Shule: Wasiliana na Wizara ya Elimu (Serikali) kusajili.",
    auth_students_hint: "Wanafunzi: Omba msimamizi wa shule yako maelezo ya kuingia.",
    auth_back_home: "← Rudi nyumbani",
    role_gov: "Serikali", role_school: "Msimamizi wa Shule", role_student: "Mwanafunzi / Mzazi",
    role_gov_desc: "Afisa wa Wizara ya Elimu",
    role_school_desc: "Msimamizi wa shule",
    role_student_desc: "Mwanafunzi au mlezi",
    email_label: "Anwani ya barua pepe", password_label: "Nywila",
    signing_in: "Inaingia…",
    sign_in_as: "Ingia kama",

    // Portal nav
    nav_dashboard: "Dashibodi", nav_students: "Wanafunzi", nav_schools: "Shule",
    nav_logs: "Kumbukumbu za Ukaguzi", nav_create: "Unda Mwanafunzi", nav_settings: "Mipangilio",
    nav_myid: "Kitambulisho Changu", nav_applications: "Maombi", nav_payments: "Malipo",
    theme_dark: "Giza", theme_light: "Mwanga",
    lang_sw: "Kiswahili", lang_en: "Kiingereza",

    // Gov dashboard
    gov_title: "Lango la Serikali", gov_subtitle: "Wizara ya Elimu",
    gov_dash_title: "Dashibodi ya Serikali",
    gov_dash_sub: "Muhtasari wa moja kwa moja wa utambulifu wa wanafunzi kitaifa.",
    gov_welcome: "Dashibodi ya Kitaifa",
    gov_welcome_sub: "Mfumo wa Utambulifu wa Wanafunzi Tanzania",
    gov_register_school: "Sajili Shule",
    kpi_students: "Wanafunzi nchi nzima", kpi_active: "Vitambulisho Amilifu",
    kpi_schools: "Shule zilizosajiliwa", kpi_pending_apps: "Maombi yanayosubiri",
    kpi_regions: "Mikoa iliyofunikwa", kpi_approved: "Maombi yaliyoidhinishwa",
    kpi_verified: "Shule zilizothibitishwa",
    registered_schools: "Shule Zilizosajiliwa",
    manage_arrow: "Simamia →", view_all: "Ona zote →", see_all: "Ona zote →",
    recent_activity: "Shughuli za Hivi Karibuni", no_activity: "Hakuna shughuli bado.",
    no_schools: "Hakuna shule zilizosajiliwa bado.",

    // Gov schools
    gov_schools_title: "Shule",
    gov_schools_sub: "Sajili taasisi na utoe nambari za siri za wasimamizi.",
    reg_school_btn: "Sajili shule",
    total_schools: "Jumla ya shule", verified: "Zilizothibitishwa", unverified: "Ambazo hazijathibitishwa",
    reg_schools_count: "Shule zilizosajiliwa",
    inst_type: "Aina ya Taasisi *", school_name_lbl: "Jina la Shule *",
    region_lbl: "Mkoa *", district_lbl: "Wilaya", ward_lbl: "Kata",
    address_lbl: "Anwani", contact_phone_lbl: "Simu ya Mawasiliano", contact_email_lbl: "Barua Pepe ya Mawasiliano",
    cred_section: "🔑 Nambari za Siri za Msimamizi (zinazozalishwa kiotomatiki)",
    school_code_lbl: "Nambari ya Shule *", login_email_lbl: "Barua Pepe ya Kuingia *", password_lbl2: "Nywila *",
    regen_cred: "↻ Zalisha nambari mpya za siri",
    reg_submit: "🏫 Sajili Shule & Toa Nambari za Siri",
    registering: "Inasajili…",
    issued_title: "✅ Shule imesajiliwa — shiriki nambari hizi za siri",
    copy_cred: "Nakili nambari za siri",
    cred_copied: "Nambari za siri zimenakiliwa!",
    code_lbl: "Nambari ya Shule", username_lbl: "Jina la Mtumiaji", pass_lbl: "Nywila",
    activate: "Amilisha", suspend: "Simamisha", not_set: "Haijawekwa",
    col_code: "Nambari", col_school: "Shule", col_region: "Mkoa",
    col_cred: "Nambari za Siri", col_students: "Wanafunzi", col_status: "Hali",

    // Gov students
    nat_db: "Hifadhidata ya Kitaifa ya Wanafunzi",
    nat_db_sub: "wanafunzi katika", schools_in: "shule katika", regions_text: "mikoa",
    total_students: "Jumla ya wanafunzi", active_ids: "Vitambulisho Amilifu",
    search_placeholder: "Tafuta jina, TSID au shule…",
    all_regions: "Mikoa yote",
    results: "matokeo", results_pl: "matokeo",
    col_photo: "Picha", col_student: "Mwanafunzi", col_level: "Kiwango", col_issued: "Imetolewa",
    no_students_yet: "Hakuna wanafunzi waliosajiliwa bado.",
    no_match: "Hakuna wanafunzi wanaolingana na mafunzo yako.",

    // Gov logs
    logs_title: "Kumbukumbu za Shughuli",
    logs_sub: "Rekodi ya ukaguzi wa mfumo mzima",
    entries: "rekodi",
    col_action: "Hatua", col_message: "Ujumbe", col_by: "Na",
    col_role: "Jukumu", col_time: "Muda",
    no_logs: "Hakuna shughuli zilizorekodiwa bado.",

    // School portal
    school_portal: "Lango la Shule",
    school_dash_title: "Dashibodi ya Shule",
    no_school_linked: "Hakuna shule iliyounganishwa",
    no_school_sub: "Akaunti yako haijaunganishwa na shule bado. Wasiliana na msimamizi wa serikali.",
    recently_registered: "Waliojisajili Hivi Karibuni",
    students_by_level: "Wanafunzi kwa Kiwango",
    no_students_msg: "Hakuna wanafunzi bado.",
    create_student_btn: "Unda Mwanafunzi",
    pending_apps: "Maombi Yanayosubiri",
    col_tsid: "TSID", col_name: "Jina",

    // School students
    student_db: "Hifadhidata ya Wanafunzi",
    student_db_sub: "wanafunzi wamesajiliwa",
    create_student_title: "Sajili Mwanafunzi Mpya",
    search_student: "Tafuta kwa jina au TSID…",
    col_login: "Kuingia",
    student_info: "Taarifa za Mwanafunzi",
    tsid_number: "Nambari ya TSID", full_name: "Jina Kamili *",
    dob_lbl: "Tarehe ya Kuzaliwa *", gender_lbl: "Jinsia *",
    nationality_lbl: "Utaifa", blood_group_lbl: "Kundi la Damu",
    choose_photo: "📁 Chagua picha",
    photo_hint: "JPG / PNG / WebP · max 2 MB\nPicha ya pasipoti, uso wazi\nItaonekana kwenye kitambulisho",
    academic_info: "Taarifa za Kitaaluma",
    current_level: "Kiwango cha Sasa", enrollment_date: "Tarehe ya Kuandikishwa", issue_date: "Tarehe ya Kutolewa",
    parent_guardian: "Mzazi / Mlezi",
    parent_name: "Jina la Mzazi / Mlezi", relationship_lbl: "Uhusiano",
    parent_nida: "NIDA ya Mzazi", parent_phone: "Simu ya Mzazi",
    school_autofill: "Shule (Imejazwa Kiotomatiki)",
    student_login_cred: "🔑 Nambari za Siri za Mwanafunzi",
    student_cred_hint: "Hizi ndizo nambari za kuingia kwa mwanafunzi kwenye mfumo wa TSID. Shiriki kwa usalama.",
    gen_new_pass: "↻ Zalisha nywila mpya",
    create_submit: "💾 Unda Mwanafunzi & Toa TSID",
    creating: "Inaunda mwanafunzi…",
    student_issued: "✅ Mwanafunzi amesajiliwa — shiriki nambari za siri",
    male: "Mume", female: "Mke",

    // Student portal
    student_portal: "Lango la Mwanafunzi",
    student_dash_title: "Dashibodi",
    no_record: "Hakuna rekodi ya mwanafunzi iliyounganishwa",
    no_record_sub: "Akaunti yako haijaunganishwa na rekodi ya mwanafunzi bado. Wasiliana na shule yako — wanatengeneza TSID na nambari zako za kuingia.",
    welcome_msg: "Karibu",
    view_id: "🪪 Angalia Kitambulisho Changu →",
    status_lbl: "Hali", level_lbl: "Kiwango", school_lbl: "Shule", region_label: "Mkoa",
    student_info_sec: "📋 Taarifa za Mwanafunzi",
    school_sec: "🏫 Shule",
    guardian_sec: "👨‍👩‍👧 Mzazi / Mlezi",
    id_preview: "🪪 Mwonekano wa Kitambulisho",
    full_size_print: "Ukubwa kamili & chapisha →",
    print_btn: "Chapisha",
    my_id_title: "Kitambulisho Changu cha TSID",
    my_id_sub: "Kitambulisho chako cha kitaifa cha mwanafunzi. Chapisha au pakua hapa chini.",
    no_student_linked: "Hakuna rekodi ya mwanafunzi iliyounganishwa na akaunti yako bado.",

    // Search
    search_title: "Thibitisha Utambulisho wa Mwanafunzi",
    search_sub: "Tafuta kwa jina, nambari ya TSID au shule — upatikanaji wa umma, hakuna kuingia kunahitajika.",
    search_input: "Tafuta jina, TSID au shule…",
    search_btn: "Tafuta",
    searching: "Inatafuta…",
    all_types: "Zote", schools_only: "Shule", students_only: "Wanafunzi",
    no_results: "Hakuna matokeo yaliyopatikana.",
    search_prompt: "Weka jina, nambari ya TSID au shule kutafuta.",
    pub_stats: "wanafunzi", pub_stats2: "shule", pub_stats3: "mikoa",

    // Landing
    official_badge: "Rasmi · Wizara ya Elimu, Sayansi na Teknolojia",
    hero_title: "Kitambulisho kimoja kinachothibitishwa kwa kila mwanafunzi Tanzania.",
    hero_sub: "TSID ni jukwaa la kitaifa linalowezesha shule kutoa, wanafunzi kubeba, na serikali kuthibitisha utambulisho wa wanafunzi — haraka na kwa usalama.",
    hero_signin: "Ingia kwenye mfumo",
    hero_verify: "Thibitisha kitambulisho",
    rls_secured: "Salama na RLS", tamper_qr: "QR isiyobadilishwa", made_tz: "Imetengenezwa Tanzania",
    // How It Works
    how_label: "Mchakato Rahisi",
    how_title: "Jinsi TSID Inavyofanya Kazi",
    how_sub: "Hatua nne rahisi — kutoka usajili wa shule hadi kitambulisho cha kitaifa kilichothibitishwa, kwa njia ya kidijitali kabisa.",
    how_step1_title: "Serikali Inasajili Shule",
    how_step1_body: "Wizara ya Elimu inasajili taasisi yako katika TSID, inatenga nambari ya kipekee ya shule na kutoa nambari za siri za msimamizi.",
    how_step2_title: "Shule Inaunda Rekodi ya Mwanafunzi",
    how_step2_body: "Wasimamizi wa shule wanaingia na kuunda wasifu wa wanafunzi — wakipakia picha, taarifa za wazazi na maelezo ya kitaaluma.",
    how_step3_title: "Nambari ya TSID Inatokea",
    how_step3_body: "Mfumo huzalisha kiotomatiki nambari ya kipekee ya TSID na kitambulisho cha CR80 kinachoweza kuchapishwa chenye msimbo wa QR.",
    how_step4_title: "Mtu Yeyote Anaweza Kuthibitisha Haraka",
    how_step4_body: "Scan QR au weka nambari ya TSID kwenye verify.tsid.go.tz — hakuna kuingia kunahitajika, matokeo kwa sekunde.",

    // Stats
    stat_regions: "Mikoa na Halmashauri",
    stat_portals: "Milango Salama",
    stat_standard: "Kiwango cha Kitambulisho",
    stat_digital: "Mchakato Bila Karatasi",

    // Sections
    feat_label: "TSID Inafanya Nini",
    portals_label: "Milango Mitatu",
    roles_sub: "Kila mdau ana lango lake maalum lenye zana na ruhusa sahihi.",

    // CTA Banner
    cta_title: "Mfumo wa kitaifa wa kitambulisho cha mwanafunzi Tanzania — unapatikana sasa.",
    cta_sub: "Jiunge na maelfu ya shule zinazotumia TSID kutoa vitambulisho vya wanafunzi vinavyothibitishwa.",

    // Footer
    send_feedback: "Tuma Maoni",
    features_title: "Imejengwa kwa mzunguko wote wa utambulifu",
    feat_school_title: "Shule zinatoa", feat_school_body: "Sajili wanafunzi, ambatisha picha, zalisha nambari rasmi za TSID na chapisha vitambulisho.",
    feat_verify_title: "Mtu yeyote anathibitisha", feat_verify_body: "Utafutaji wa umma na wa siri unaorejesha taarifa zilizosafishwa tu — hakuna uvujaji wa data za kibinafsi.",
    feat_gov_title: "Serikali inasimamia", feat_gov_body: "KPI za moja kwa moja kwa mikoa, kumbukumbu za ukaguzi wa kila hatua, na idhini kwa kubonyeza moja.",
    roles_title: "Jukwaa moja · milango mitatu",
    role_school_body: "Simamia hifadhidata yako ya wanafunzi, shughulikia maombi, pokea malipo na chapisha vitambulisho.",
    role_gov_body: "Thibitisha shule, kagua kila utoaji, fuatilia KPI za mkoa na idhinisha maombi.",
    role_student_body: "Beba kitambulisho chako kwenye simu yako, pakua nakala inayoweza kuchapishwa, omba barua na vyeti.",
    open_portal: "Fungua lango →",

    // Common
    done: "Imekamilika", cancel: "Ghairi", save: "Hifadhi", loading: "Inapakia…",
    active: "Amilifu", inactive: "Isiyofanya kazi", pending: "Inasubiri",
    approved: "Imeidhinishwa", rejected: "Imekataliwa",
    copy: "Nakili", download_front: "Pakua Mbele", download_back: "Pakua Nyuma",
    no_data: "Hakuna data bado.", redirecting: "Inaelekeza…",
  },
};

const Ctx = createContext<ThemeCtx>({
  theme: "light", lang: "en",
  toggleTheme: () => {}, toggleLang: () => {},
  t: (k) => k,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (typeof window !== "undefined" && (localStorage.getItem("tsid:theme") as Theme)) || "light"
  );
  const [lang, setLang] = useState<Lang>(() =>
    (typeof window !== "undefined" && (localStorage.getItem("tsid:lang") as Lang)) || "en"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("tsid:theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("tsid:lang", lang);
  }, [lang]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const toggleLang  = () => setLang((l) => (l === "en" ? "sw" : "en"));
  const t = (key: string) => TR[lang][key] ?? TR["en"][key] ?? key;

  return <Ctx.Provider value={{ theme, lang, toggleTheme, toggleLang, t }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
