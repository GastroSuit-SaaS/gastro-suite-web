---
name: vue-ddd-modular-monolith
description: >-
  Audits, remediates, and scaffolds Vue 3 + Pinia modular monolith frontends with
  DDD layers (domain, application, infrastructure, presentation), facades, assemblers,
  and shared cross-cutting structure. Use when auditing architecture, fixing layer
  violations, creating greenfield Vue modules, reorganizing shared/, or when the user
  mentions DDD, modular monolith, presentation thin, store facade, or audit:architecture.
---

# Vue DDD Modular Monolith

Arquitectura validada en Gastro Suite Web. Documentación extendida: [reference.md](reference.md).

## Cuándo usar qué

| Tarea | Acción |
|-------|--------|
| Auditar repo | Prompt `.cursor/prompts/audit-architecture.md` + `npm run audit:architecture` |
| Proyecto nuevo | Prompt `.cursor/prompts/greenfield-project.md` |
| Remediar deuda | Prompt `.cursor/prompts/remediate-architecture.md` + fases |
| Solo `shared/` | Prompt `.cursor/prompts/audit-shared-layer.md` |

## Reglas no negociables

1. **Un store Pinia por módulo:** `application/<module>.store.js`
2. **Presentation delgada:** vistas → store propio + constants UI + composables de `shared/presentation/composables/` (nunca `<module>/presentation/composables/`)
3. **Sin DTOs en store:** assemblers con `toEntityFromResource` + `toEntitiesFromResponse`
4. **Cross-module:** facade en módulo dueño de la pantalla; vistas no importan stores ajenos
5. **Domain puro:** sin Vue, Pinia, Axios
6. **Prohibido:** `presentation → infrastructure` (excepto `shared/infrastructure` documentado)

## Taxonomía de módulos

| Tipo | Ejemplos | Extra |
|------|----------|-------|
| CRUD | menu, users, inventory | 4 capas estándar |
| Agregador | dashboard, pos | `*.facade.js` obligatorio |
| Transversal | communication | sin rutas; componentes en shell |
| Plataforma | platform | domain + assemblers como CRUD |
| Shell | public | layout; **`shared/application/shell.facade.js`** (no multi-store directo) |

## Estructura mínima por módulo

```
src/<module>/
├── application/<module>.store.js
├── application/<module>.facade.js    # si agregador
├── domain/models/<entity>.entity.js
├── infrastructure/api/<module>.api.js
├── infrastructure/assemblers/<entity>.assembler.js
└── presentation/<module>.routes.js + views/
```

## Shared (4 capas)

```
shared/application/     tenant-context, store-result, post-login-route, shell.facade.js
shared/domain/          roles, debounce, formatters puros
shared/infrastructure/  base-api, env, offline, realtime, export/
shared/presentation/    composables/, components/, constants/, views/
```

**Legacy prohibido:** `shared/composables/`, `shared/utils/` en raíz.

## Patrones de remediación rápida

| Violación | Fix |
|-----------|-----|
| Vista → otro store | Facade + exponer en store dueño |
| Vista → domain | Re-export en `presentation/constants/` o getter store |
| Vista → application helper | Método/getter en store |
| `presentation/utils/` | Mover a `application/` |
| Dos stores mismo módulo | Fusionar (namespace `reservations` en `tables.store`) |
| Assembler objeto | `class` con `static` |
| `application` → `presentation` | Mover a `domain/` o `application/` |

## Store — contrato mutaciones

```javascript
import { storeSuccess, storeFailure } from '../../shared/application/store-result.js';
// return storeSuccess({ id }) o storeFailure(e, 'mensaje usuario')
```

## Facade — plantilla

```javascript
export function useUsersFacade() {
    const branchesStore = useBranchesStore();
    return {
        branchOptions: computed(() => branchesStore.activeBranches.map(...)),
        async bootstrapManagement() { /* orquesta */ },
    };
}
// users.store.js: const facade = useUsersFacade(); return { branchOptions: facade.branchOptions };
```

## Validación

```bash
npm run build:only
npm run audit:architecture
npm run verify:modules
```

Script portable: [scripts/audit-architecture.mjs](scripts/audit-architecture.mjs) — copiar a `scripts/` del proyecto y ajustar `SRC`.

## Checklist nuevo módulo

- [ ] 4 capas + store único
- [ ] Assembler por entidad expuesta
- [ ] Routes lazy en `<module>.routes.js`
- [ ] Registro en `router/index.js`
- [ ] `reset-application-stores.js` si aplica
- [ ] `handleOperationalEvent` si realtime branch-scoped
- [ ] Audit sin violaciones

## Recursos

- [reference.md](reference.md) — matriz imports, excepciones, fases remediación
- [examples.md](examples.md) — ejemplos reales Gastro Suite
