---
name: vue-ddd-architecture-remediation
description: >-
  Executes phased remediation of Vue modular DDD frontends: facades, thin presentation,
  store consolidation, shared layer migration, assembler contracts. Use when fixing
  architecture violations, implementing ARCHITECTURE-REMEDIATION-PLAN, or after an audit
  when the user wants changes applied with build and audit validation per phase.
---

# Vue DDD Architecture Remediation

## Workflow

Follow `.cursor/prompts/remediate-architecture.md` phases 0–6 in order.

After **each** phase:

```bash
npm run build:only
npm run audit:architecture
npm run verify:modules
```

## Phase priorities

| Fase | Objetivo |
|------|----------|
| 0 | audit script + baseline |
| 1 | domain, assemblers, quitar presentation→infra |
| 2 | facades (pos, dashboard, users, tables, menu, stations, …) |
| 3 | un store por módulo |
| 4 | presentation delgada (helpers/utils vía store) |
| 5 | rutas lazy + shared 4 capas |
| 6 | shell facade (`public/` + shared/presentation) |

## Fix patterns

| Violación | Acción |
|-----------|--------|
| Vista → store ajeno | facade + store dueño |
| Shell → store de módulo | `shell.facade.js` |
| Vista → domain | re-export constants o store getter |
| presentation/utils | application/ + store export |
| application → presentation | mover a domain/application |
| shared/composables | shared/presentation/composables |

## Constraints

- Minimal diff; no unrelated refactors
- No git commit unless user asks
- Document new exceptions in ARCHITECTURE.md §8

## Full reference

[../vue-ddd-modular-monolith/SKILL.md](../vue-ddd-modular-monolith/SKILL.md) · [examples.md](../vue-ddd-modular-monolith/examples.md)
