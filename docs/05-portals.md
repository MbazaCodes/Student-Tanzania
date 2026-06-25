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
