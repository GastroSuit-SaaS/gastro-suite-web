---
name: vue-ddd-greenfield-scaffold
description: >-
  Scaffolds new Vue 3 + Vite + Pinia projects or feature modules using modular DDD
  layers, shared infrastructure, assemblers, stores, and lazy routes. Use when
  starting a project from scratch, creating a new bounded context module, or
  bootstrapping frontend architecture with domain/application/infrastructure/presentation.
---

# Vue DDD Greenfield Scaffold

## Workflow

1. Confirm stack: Vue 3, Vite, Pinia, Vue Router
2. Scaffold `shared/` (4 capas) before any feature module
3. Create `iam` module first (auth, guard, tenant)
4. Add feature modules from user list — one complete CRUD as reference
5. Wire `router/index.js` composing `<module>.routes.js`
6. Add `docs/ARCHITECTURE.md` + `scripts/audit-architecture.mjs`
7. Validate: `npm run build` + `npm run audit:architecture`

## Prompt template

Use `.cursor/prompts/greenfield-project.md` — replace `{{MODULES}}` and `{{PROJECT_NAME}}`.

## Minimum files per module

```
application/<module>.store.js
domain/models/<entity>.entity.js
infrastructure/api/<module>.api.js
infrastructure/assemblers/<entity>.assembler.js
presentation/<module>.routes.js
presentation/views/<module>-management.vue
presentation/constants/<module>.constants-ui.js
```

## Shared first

```
shared/infrastructure/base-api.js
shared/infrastructure/env.js
shared/application/tenant-context.js
shared/application/store-result.js
shared/domain/roles.js
shared/presentation/composables/use-confirm-dialog.js
```

## Full reference

[../vue-ddd-modular-monolith/SKILL.md](../vue-ddd-modular-monolith/SKILL.md)
