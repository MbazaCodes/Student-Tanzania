# TSID — Tanzania Student Identification System

A national platform that lets schools issue, students carry, and the
government verify student identification — instantly and securely.

**Jamhuri ya Muungano wa Tanzania · Wizara ya Elimu, Sayansi na Teknolojia**

---

## What it does

TSID issues one verifiable digital identity (a **TSID number**) to every
learner in Tanzania. It has three portals:

| Portal | Who uses it | Purpose |
|--------|-------------|---------|
| **Government** | Ministry / Regional / District admins | Oversee the national database, register schools, create admins |
| **School** | School administrators | Register and manage their students, issue ID cards |
| **Student** | Students & guardians | View their digital ID card, manage applications |

Plus a **public verification page** (`/search`) where anyone can verify a
student ID without logging in.

---

## Core concepts

- **TSID number** — unique student ID, format `TSID-YYYY-XXXXXXX`.
- **School code** — unique per institution, region-prefixed (e.g. `IR8557`).
- **Admin hierarchy** — National → Regional → District (see `04-admin-hierarchy.md`).
- **Scope** — Regional admins see/manage one region; District admins one district.
- **ID card** — CR80 credit-card format, front + back, QR code, coat of arms.

---

## Tech stack (summary)

- **Frontend:** React 19, TanStack Start (SSR), TanStack Router + Query, Tailwind v4, shadcn/ui
- **Backend:** Supabase (Postgres + Auth + RLS + Edge Functions)
- **ID/PDF:** jsPDF, html-to-image, qrcode
- **Hosting:** Vercel

Full details in `02-tech-stack.md`.

---

## Documentation index

| File | Contents |
|------|----------|
| `01-overview.md` | This file — what TSID is |
| `02-tech-stack.md` | Stack, dependencies, project structure |
| `03-setup.md` | Local dev, env vars, deployment |
| `04-admin-hierarchy.md` | National/Regional/District roles & permissions |
| `05-portals.md` | Each portal's pages and features |
| `06-database.md` | Tables, columns, RLS, migrations |
| `07-edge-functions.md` | create-admin, create-school, manage-admin |
| `08-auth-and-roles.md` | Login flow, role resolution, scoping |
| `09-workflows.md` | Common end-to-end flows |
| `10-conventions.md` | Git workflow, code conventions |
