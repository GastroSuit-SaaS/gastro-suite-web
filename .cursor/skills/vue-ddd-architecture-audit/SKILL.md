---
name: vue-ddd-architecture-audit
description: >-
  Performs read-only architectural audits on Vue 3 + Pinia modular DDD frontends.
  Produces compliance matrix, violation report, and phased remediation plan.
  Use when the user asks to audit architecture, check layer boundaries, compliance
  percentage, or review module structure without implementing fixes yet.
---

# Vue DDD Architecture Audit

## Workflow

1. Read `docs/ARCHITECTURE.md` if present; else use [../vue-ddd-modular-monolith/reference.md](../vue-ddd-modular-monolith/reference.md)
2. Run `npm run audit:architecture` and `npm run verify:modules` (copy scripts from `vue-ddd-modular-monolith/scripts/` if missing)
3. Grep imports: `presentation` → `infrastructure`, cross-module stores in views, shell without `shell.facade.js`
4. Classify each module: COMPLIANT / PARTIAL / NON-COMPLIANT
5. Output using template in `.cursor/prompts/audit-architecture.md`

## Focus areas

- Store único por módulo
- Assemblers presentes y usados
- Facades en agregadores y hubs (pos, dashboard, users, tables, menu, stations, …)
- Shell vía `shared/application/shell.facade.js` (no stores directos en public/)
- Sin `presentation/composables|utils|helpers/` en módulos feature
- `shared/` en 4 capas (no `composables/` ni `utils/` en raíz)
- Rutas lazy en `<module>.routes.js`

## Do not

- Change code unless user explicitly requests remediation
- Mark COMPLIANT without verifying imports in presentation layer

## Full rules

See [../vue-ddd-modular-monolith/SKILL.md](../vue-ddd-modular-monolith/SKILL.md)
