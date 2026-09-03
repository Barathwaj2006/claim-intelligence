# Jules Task 11: Frontend Application Shell

## Wave & PR Target
- **Wave**: 1 (Foundation)
- **Target PR**: PR 1 (Foundation)

## Mission
Build the React 18 + Vite + TypeScript application shell, enterprise healthcare layout, navigation, and styling foundation in `apps/web/`.

## Exclusive File Ownership
- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `apps/web/tailwind.config.js`
- `apps/web/src/layout/`
- `apps/web/src/App.tsx`
- `apps/web/src/index.css`
- `apps/web/src/main.tsx`

**Forbidden Paths**: Do NOT modify backend directories (`apps/api/`) or `packages/types/`.

## Prerequisites & Dependencies
- Read `docs/ARCHITECTURE.md`.
- Conforms to modern React and Tailwind best practices.

## Detailed Requirements
1. **Dependencies (`apps/web/package.json`)**:
   - `react`, `react-dom`, `react-router-dom`
   - `@tanstack/react-query`
   - `lucide-react`
   - `clsx`, `tailwind-merge`
   - `tailwindcss`, `autoprefixer`, `postcss`

2. **Healthcare UI Theme (`tailwind.config.js`, `index.css`)**:
   - Custom palette:
     - `brand-navy`: `#0f172a`
     - `clinical-blue`: `#1e40af`
     - `risk-low`: `#059669` (emerald)
     - `risk-med`: `#d97706` (amber)
     - `risk-high`: `#dc2626` (rose)
     - `surface-light`: `#f8fafc`

3. **Layout Shell (`apps/web/src/layout/`)**:
   - `Navbar.tsx`: Platform branding ("U.S. Claim Intelligence"), live system status indicator ("API Connected"), active environment tag ("U.S. RCM Staging").
   - `Sidebar.tsx`: Navigation items with Lucide icons:
     - Dashboard (`/`)
     - Claims Queue (`/claims`)
     - Eligibility Checker (`/eligibility`)
     - Revenue Recovery (`/recovery`)
     - Executive Analytics (`/analytics`)
   - `MainLayout.tsx`: Responsive layout combining Navbar, collapsible Sidebar, and main content area with breadcrumbs.

4. **Routing (`apps/web/src/App.tsx`)**:
   - Configure React Router with routes for all 5 core views. Placeholder components for pages owned by other agents are permitted.

## Verification Command
```bash
cd apps/web
npm run build
```
