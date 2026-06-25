# Portals & Pages

All three portals share `PortalShell` (`src/components/tsid/portal-shell.tsx`)
which provides a navy sidebar, role-aware header, theme/language toggles, and
sign-out. The active-item accent color is role-specific:
- Government → green `#1EB53A`
- School → gold `#F5C400`
- Student → blue `#007AFF`

---

## Government Portal (`/gov`)

Route shell: `gov.tsx`. Nav items adapt to tier (District admins don't see
Administrators).

| Page | Route | File | Description |
|------|-------|------|-------------|
| Dashboard | `/gov` | `gov.index.tsx` | National KPIs (students, schools, active IDs, pending apps), recent schools, recent logs |
| Students | `/gov/students` | `gov.students.tsx` | National student database, search + region filter |
| Schools | `/gov/schools` | `gov.schools.tsx` | Register schools (cascading region→district→ward), suspend/activate, reset password, edit/delete (National), notes |
| Administrators | `/gov/admins` | `gov.admins.tsx` | Create Regional/District admins, edit/reset-password/delete (National), notes — **hidden for District tier** |
| Audit Logs | `/gov/logs` | `gov.logs.tsx` | Activity log feed with color-coded actions |

Portal title/subtitle reflect tier:
- National → "Government Portal / WIZARA YA ELIMU"
- Regional → "{Region} Regional / REGIONAL ADMIN"
- District → "{District} District / DISTRICT ADMIN"

---

## School Portal (`/school`)

Route shell: `school.tsx`.

| Page | Route | File | Description |
|------|-------|------|-------------|
| Dashboard | `/school` | `school.index.tsx` | School stats, recent students, students-by-level chart |
| Students | `/school/students` | `school.students.tsx` | Register students (level dropdown adapts to school type), search |
| Applications | `/school/applications` | `school.applications.tsx` | Approve/reject student applications |
| Settings | `/school/settings` | `school.settings.tsx` | School profile (read-only) |

### Register New Student — field types
| Field | Input type |
|-------|-----------|
| TSID | auto-generated, read-only |
| Full Name | text |
| Date of Birth | date |
| Gender | dropdown (Male/Female) |
| Nationality | dropdown (Tanzanian + EAC + common) |
| Blood Group | dropdown (A+, A−, …) |
| Current Level | dropdown — **adapts to school type** |
| Enrollment / Issue Date | date |
| Parent / Guardian | text |
| Relationship | dropdown (Mother/Father/Guardian/…) |
| Parent NIDA | text (20 digits) |
| Parent Phone | text |
| School fields | auto-filled from the school record |

Level options by school type are defined in `src/lib/tz-geo.ts`
(`LEVELS_BY_SCHOOL_TYPE`):
- Pre-School / Nursery → Baby/Middle/Pre-Unit
- Primary → Standard 1–7
- Secondary → Form 1–6
- University/College → Certificate, Diploma, Year 1–5, Postgraduate
- Vocational → Level 1–3, NTA Level 4–6
- Special Needs → Pre-Unit + Standard 1–7 + Form 1–4

---

## Student Portal (`/student`)

Route shell: `student.tsx`.

| Page | Route | File | Description |
|------|-------|------|-------------|
| Dashboard | `/student` | `student.index.tsx` | Welcome banner, status tiles, student info, parent info, ID card preview |
| My ID Card | `/student/id` | `student.id.tsx` | Full-size ID card, front/back, print/download |
| Applications | `/student/applications` | `student.applications.tsx` | Track application status |

---

## Public pages (no login)

| Page | Route | File | Description |
|------|-------|------|-------------|
| Landing | `/` | `routes/index.tsx` | Hero, stats, how-it-works, features, portals, CTA |
| Login | `/auth` | `routes/auth.tsx` | Role tabs (Government / School Admin / Student) |
| Verify ID | `/search` | `routes/search.tsx` | Public TSID verification |

---

## ID Card (`src/components/tsid/id-card.tsx`)
- CR80 credit-card proportions
- Front: photo, TSID number, name, DOB, level, school, QR code, coat of arms + TSID logo
- Back: parent/guardian info, important notices, verification URL, flag stripe
- Exportable to PNG/PDF via html-to-image + jsPDF

---

## Profiles & Approval Workflow (added)

### Clickable profiles
- **School Students** / **Gov Students** — click any student row to open the
  `StudentProfileDrawer` (slide-in) showing full profile + edit.
- **Gov Schools** — school rows support edit/delete/reset (National) + notes.

### Edit routing (change requests)
Editing a student creates a `change_requests` row unless the editor is a gov
admin (who apply directly):
- **Student edits own profile**: major (name, DOB, TSID, school transfer) →
  admin approval; minor (photo, phone, address, parent contact) → school approval
- **School edits a student**: minor applies immediately; major → admin approval
- **Gov admin edits**: applies directly

### Approvals inbox
- **School → Approvals**: minor student change requests for that school
- **Gov → Approvals**: major student changes + school changes, scoped by tier
- Approve → applies the change to the underlying table + logs it; Reject → logs

### Bulk upload
- **School Students → Bulk upload**: CSV/Excel of students (per row → create-student)
- **Gov Schools → Bulk upload**: CSV/Excel of schools (per row → create-school)
- Downloadable CSV + Excel templates; header validation; result summary

---

## Letter Requests (added)

Students request official letters; schools approve; approved letters become
downloadable PDFs with TZ coat-of-arms letterhead.

### Student — My Applications (`/student/applications`)
- **New Request** form:
  - Sector: Government / Private
  - Purpose dropdown (sector-specific):
    - Government: NHIF, Wizara Services, NECTA Services, Government Grants & Loans (HESLB), Other
    - Private: Internship, Grants/Funds/Loans, Scholarship, Other
  - Reason dropdown + "Other (type below)" manual input
  - Addressed-To (recipient) name + address
  - Region → District cascade
  - Fee auto-determined per purpose (free/paid)
- **My Applications list**: status (pending/approved/rejected), FREE/PAID badge,
  paid ✓ indicator; **Download** button (PDF) appears when approved AND (free OR paid)

### School — Letter Requests (`/school/letters`)
- Pending/approved/rejected tabs
- Approve (generates ref no.), Approve (paid/unpaid) for paid letters, Reject
- Approval makes the letter downloadable by the student

### PDF letter (`components/tsid/letter-document.tsx`)
- A4, TZ coat of arms, JAMHURI YA MUUNGANO WA TANZANIA letterhead
- Ref no + date, recipient block, bilingual body, student detail table,
  head-of-school signature, verify URL
- Downloaded via html-to-image → jsPDF

DB: `022_letter_requests.sql` (letter_requests table + scoped RLS).
