# Tech Stack & Project Structure

## Frameworks & libraries

### Core
- **React 19** — UI library
- **TanStack Start** — full-stack React framework (SSR + file-based routing)
- **TanStack Router** — type-safe file-based routing (`routeTree.gen.ts` auto-generated)
- **TanStack Query** — server state / data fetching & caching
- **Vite** — build tool & dev server
- **TypeScript** — type safety

### Styling & UI
- **Tailwind CSS v4** — utility-first CSS (`@tailwindcss/vite`)
- **shadcn/ui** — component primitives built on Radix UI
- **Radix UI** — accessible headless components (dialog, select, dropdown, etc.)
- **lucide-react** — icon set
- **tw-animate-css** — animation utilities
- **class-variance-authority + clsx + tailwind-merge** — class composition

### Backend & data
- **Supabase** (`@supabase/supabase-js`) — Postgres, Auth, RLS, Edge Functions, Storage
- **zod** — schema validation
- **react-hook-form** + **@hookform/resolvers** — forms

### Documents & ID cards
- **jsPDF** — PDF generation
- **html-to-image** — render DOM to image for the ID card
- **qrcode** — QR code generation for verification

### Other
- **sonner** — toast notifications
- **recharts** — charts (dashboards)
- **date-fns** — date utilities

## Fonts
- **Sora** — display / headings (`--font-display`)
- **Plus Jakarta Sans** — body (`--font-sans`)

## Design tokens (Tanzania palette)
Defined in `src/styles.css` as CSS variables:
- `--tz-navy` (#003366-ish) — primary
- `--tz-green` (#1EB53A) — Tanzania green
- `--tz-gold` (#F5C400) — Tanzania gold
- `--tz-blue` (#00A3DD) — Tanzania blue
- `--tz-black` — flag black

Colors use **oklch** format. Light + dark modes both defined.

---

## Project structure

```
tsid/
├── docs/                          ← this documentation
├── public/                        ← static assets
│   ├── tz-coat-of-arms.png        ← Tanzania coat of arms
│   ├── tsid-logo.png              ← TSID circular badge logo
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── tsid/                  ← app-specific components
│   │   │   ├── portal-shell.tsx   ← shared sidebar + header for all portals
│   │   │   ├── id-card.tsx        ← CR80 student ID card (front/back)
│   │   │   ├── site-header.tsx    ← public landing header
│   │   │   ├── site-footer.tsx
│   │   │   └── page-header.tsx    ← shared PageHeader/StatCard/HeroBanner/Panel
│   │   └── ui/                    ← shadcn/ui primitives
│   ├── hooks/
│   │   └── use-current-user.ts    ← resolves user role, region, district, tier
│   ├── integrations/supabase/
│   │   ├── client.ts              ← browser Supabase client
│   │   ├── client.server.ts       ← server-side client
│   │   ├── auth-middleware.ts
│   │   └── types.ts               ← generated DB types
│   ├── lib/
│   │   ├── tsid.ts                ← Role type, helpers, password hashing, ASSETS
│   │   ├── tz-geo.ts              ← regions/districts/wards, levels, nationalities
│   │   └── theme.tsx              ← theme + bilingual (EN/SW) context
│   ├── routes/
│   │   ├── index.tsx              ← public landing page
│   │   ├── auth.tsx               ← login page (role tabs)
│   │   ├── search.tsx             ← public ID verification
│   │   ├── __root.tsx             ← root layout + error boundary
│   │   └── _authenticated/        ← protected portal routes
│   │       ├── route.tsx          ← auth guard
│   │       ├── gov.tsx            ← gov portal shell + nav
│   │       ├── gov.index.tsx      ← national dashboard
│   │       ├── gov.admins.tsx     ← admin management (hierarchy)
│   │       ├── gov.schools.tsx    ← school registration & management
│   │       ├── gov.students.tsx   ← national student database
│   │       ├── gov.logs.tsx       ← audit logs
│   │       ├── school.*.tsx       ← school portal pages
│   │       └── student.*.tsx      ← student portal pages
│   ├── styles.css                 ← Tailwind + design tokens + global CSS
│   └── routeTree.gen.ts           ← AUTO-GENERATED (do not edit by hand)
├── supabase/
│   ├── migrations/                ← SQL migrations (001–016) + README
│   └── functions/                 ← Edge Functions
│       ├── create-admin/
│       ├── create-school/
│       └── manage-admin/
├── vite.config.ts
├── vercel.json                    ← Vercel deployment config
└── package.json                   ← name: "tsid", package manager: bun (or npm)
```

## Package manager
The repo uses **Bun** (`bun.lock`). `npm` also works:
- `bun run dev` or `npm run dev`
- `bun install` or `npm install`
