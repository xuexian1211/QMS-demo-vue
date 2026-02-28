# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

S_QMS 1.0 — 汽车零配件质量管理系统 (Automotive Parts Quality Management System) for "舜富精密". Pure frontend demo with all data mocked — no backend integration.

## Commands

```bash
npm run dev          # Dev server on port 3000
npm run build        # Type-check + build (vue-tsc && vite build)
npm run preview      # Preview production build
npm run generate-logs  # Regenerate update logs from scripts/
```

No test runner is configured (Playwright is installed as devDep but no test scripts exist).

## Architecture

**Stack**: Vue 3 (Composition API, `<script setup lang="ts">`), TypeScript, Vite, Ant Design Vue 4.2+, Pinia, Vue Router, ECharts.

**Layout pattern**: Every route wraps `@/layout/MainLayout.vue` as the parent, with the actual page as a child at `path: ''`. The sidebar menu is driven by `src/stores/quality.ts`.

**Routing**: All routes are statically defined in `src/router/index.ts`. Auth guard uses `localStorage.getItem('isLoggedIn')`. Routes with `meta.hideInMenu: true` are detail/edit pages not shown in the sidebar.

**Data**: All data is hardcoded mock data inside each `.vue` file. There is no API layer — `src/api/` contains type definitions and mock helpers only. Mark any future API calls with `// TODO: Connect to Real API`.

**Types**: Shared interfaces live in `src/types/index.ts`. All business entities extend `BaseEntity` (`id`, `createTime`, `updateTime`, `creator`, `updater`).

**View structure**: `src/views/` is organized by domain:
- `basic-data/` — master data (materials, suppliers, customers, process routes)
- `inspection-model/` — inspection configuration (items, schemes, templates, plans, sampling)
- `production-quality/` — quality execution (IQC/IPQC/FQC/OQC checklists, disposals, QRQC)
- `system/` — system admin (users, roles, permissions, menus, logs)
- `tools/` — quality tools (SPC, FMEA, MSA)

**CRUD pattern**: List pages (e.g. `DefectCauseList.vue`) navigate to separate Edit pages (e.g. `DefectCauseEdit.vue`) via router push. The same Edit component handles create/edit/view modes based on route path (`/create`, `/edit/:id`, `/view/:id`).

## Code Rules (from .clinerules)

- **Mandatory**: `<script setup lang="ts">`, explicit `defineProps`/`defineEmits` types, no `any`
- **Naming**: camelCase/PascalCase identifiers (no pinyin), Chinese for UI text and comments
- **CSS**: SCSS with BEM naming
- **Commits and docs**: Must be in Simplified Chinese
