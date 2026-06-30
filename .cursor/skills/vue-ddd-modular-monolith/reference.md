# Referencia — Vue DDD Modular Monolith

## Matriz de imports

| Desde → Hacia | domain | application propio | store ajeno | infra propio | infra ajeno | presentation | shared |
|---------------|--------|-------------------|-------------|--------------|-------------|--------------|--------|
| presentation | ⚠️ evitar | ✅ store | ⚠️ facade | ❌ | ❌ | — | ✅ |
| application | ✅ | ✅ | ⚠️ facade/store público | ✅ | ❌ | ❌ | ✅ |
| infrastructure | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| domain | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Assembler — métodos obligatorios

```javascript
export class ProductAssembler {
    static toEntityFromResource(r) { /* ... */ }
    static toEntitiesFromResponse(response) { /* list | page */ }
}
```

Opcionales: `toEntityFromResponse`, `toCreateResource`, `toUpdateResource`, `toPageFromResponse`.

## Agregadores — prioridad de datos

1. API BFF del módulo + assemblers propios
2. Fallback: facade leyendo otros **stores** (nunca assemblers ajenos)
3. Presentation recibe datos ya compuestos del store

## Cross-module permitido (post-remediación)

| Consumidor | Lee store de | Facade |
|------------|--------------|--------|
| pos | tables, menu, stations, payments, cash-register, company, iam | pos.facade |
| dashboard | payments, pos, tables, stations, cash-register, inventory, iam, branches | dashboard.facade |
| users | branches, iam | users.facade |
| tables | pos | tables.facade |
| menu | stations | menu.facade |
| stations | menu | stations.facade |
| branches | users, iam | branches.facade |
| company | iam | company.facade |
| inventory | iam | inventory.facade |
| reports | iam | reports.facade |
| platform | iam | platform.facade |
| **shell** (`public/`, banners) | todos los necesarios | **shell.facade** (único acceso directo) |
| payments | cash-register, iam | mínimo |
| resto | iam (tenant) | — |

## Shell facade

`shared/application/shell.facade.js` — `useShellFacade()`:

- Consumidores: `public/presentation/*`, composables/banners en `shared/presentation/`
- **Prohibido** importar `use*Store()` de módulos feature desde shell
- Regla audit: `shell→foreign-store`

## Excepciones documentadas (plantilla)

| ID | Excepción | Razón |
|----|-----------|-------|
| EX-01 | VOs en presentation (sign-up) | Formulario multi-paso |
| EX-02 | ~~public/layout multi-store~~ | **Resuelto:** shell.facade.js |
| EX-03 | domain re-export en presentation/constants | Evita presentation→domain |
| EX-04 | shared/presentation/composables en vistas | UI cross-cutting |
| EX-05 | Sub-APIs mismo módulo | REST backend separado |

## Fases de remediación

0. Script audit + baseline  
1. Domain + assemblers + presentation→infra  
2. Facades (pos, dashboard, users, tables, menu, stations, …)  
3. Un store por módulo (communication, tables+reservations)  
4. Presentation delgada (helpers/utils → application vía store)  
5. Rutas lazy + shared 4 capas  
6. Shell facade (`public/` + shared/presentation)  

## Shared — mapa de migración

| Antes | Después |
|-------|---------|
| `shared/composables/` | `shared/presentation/composables/` |
| `shared/utils/debounce.js` | `shared/domain/debounce.js` |
| `shared/utils/order-display.js` | `shared/domain/order-display.js` |
| `shared/utils/excel-export.js` | `shared/infrastructure/export/excel-export.js` |
| roles en presentation only | `shared/domain/roles.js` + re-export |

## Imports shared (post-migración)

```javascript
// Composables
'../../../shared/presentation/composables/use-confirm-dialog.js'

// Domain puro
'../../../shared/domain/order-display.js'

// Infra export
'../../../shared/infrastructure/export/excel-export.js'

// Roles en application
'../../shared/domain/roles.js'

// Roles en presentation (re-export)
'../../../shared/presentation/constants/roles.constants.js'
```

## Realtime

`shared/infrastructure/realtime/operational-event-dispatch.js` → `handleOperationalEvent` en cada store. Stores no se importan entre sí para eventos.

## Definition of Done (PR remediación)

1. Cero `presentation → infrastructure` en módulo tocado
2. Store sin DTOs crudos
3. Assemblers con contrato mínimo
4. Rutas en `<module>.routes.js`
5. Build + audit + verify:modules OK
