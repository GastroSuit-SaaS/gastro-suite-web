# Documentación Técnica — gastro-suite-web

> **Versión doc:** 1.1.0 · **2026-06-27 (análisis arquitectónico)**  
> **Stack:** Vue 3 · Vite 7 · Pinia 3 · PrimeVue 4 · Axios · STOMP  
> **Validación operativa:** `gastro-suite-api/docs/OPERATIONAL-VALIDATION.md`

---

## 1. Introducción

`gastro-suite-web` es la SPA operativa de **Gastro Suite** para personal de restaurante (OWNER, administrador de sucursal, mesero, cajero, cocina). Arquitectura **modular monolith** con capas domain/application/infrastructure/presentation por feature module.

**Entry point:** `src/main.js` → `src/app.vue`

---

## 2. Stack tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| UI | Vue 3 (Composition API, `<script setup>`) | ^3.5 |
| Build | Vite | ^7.2 |
| Estado | Pinia | ^3.0 |
| Routing | Vue Router 4 (history mode) | ^4.6 |
| UI Kit | PrimeVue 4 + PrimeFlex + PrimeIcons | ^4.5 |
| HTTP | Axios | ^1.13 |
| Realtime | @stomp/stompjs | ^7.3 |
| Export | xlsx | ^0.18 |
| Deploy | Cloudflare Pages (Wrangler) | script `deploy:pages` |

---

## 3. Estructura del proyecto

```
gastro-suite-web/
├── src/
│   ├── main.js                 # Bootstrap app
│   ├── app.vue                 # Root: router-view, toast, confirm
│   ├── router/index.js         # Router central
│   ├── assets/styles/          # CSS global
│   ├── public/                 # Layout shell (sidebar, toolbar)
│   ├── shared/                 # Cross-cutting (application, domain, infrastructure, presentation)
│   ├── iam/                    # Autenticación
│   ├── branches/
│   ├── tables/                 # Mesas + reservas
│   ├── menu/
│   ├── inventory/
│   ├── pos/
│   ├── stations/
│   ├── payments/
│   ├── cash-register/
│   ├── reports/
│   ├── dashboard/
│   └── users/                  # Empleados (API /employees)
├── public/                     # Assets estáticos, _redirects Cloudflare
├── scripts/                    # Verificación build, SPA fallback
├── vite.config.js
├── package.json
├── .env.example
├── .env.production
└── docs/
```

### 3.1 Estructura de un módulo feature

```
src/{module}/
├── domain/models/              # Entidades, VOs, reglas
├── application/
│   └── {module}.store.js       # Pinia store
├── infrastructure/
│   ├── api/{module}.api.js     # Cliente HTTP
│   └── assemblers/             # DTO ↔ entity
└── presentation/
    ├── views/                  # Páginas (rutas)
    ├── components/             # UI del módulo
    ├── constants/              # Labels, mensajes UI
    └── {module}.routes.js      # Rutas hijas
```

### 3.2 Patrones de listado y reglas de capas

**Dos patrones de pantallas de gestión** (coexisten por tipo de dato):

| Patrón | Módulos | Componente base | Cuándo usar |
|--------|---------|-----------------|-------------|
| **Cards + tabs** | `menu`, `branches` | `ModuleTabBar`, cards, `table-pagination-bar` | Catálogos visuales, pocos campos por ítem |
| **DataManager** | `inventory`, `users`, `payments`, `tables` (reservas), `stations` (historial), `cash-register` (movimientos), `platform` (admin) | `data-manager.vue` + columnas/slots | Tablas densas, CRUD o listados operativos |

**Referencias de implementación:**

- Catálogo/cards: `src/menu/` (entidades domain, assembler, `store-result.js` en mutaciones).
- Tablas/CRUD: `src/inventory/` o `src/platform/` (`DataManager`, `CRUD_MESSAGES`, `store-result.js`).

**Reglas de dependencia entre capas:**

```
presentation → application → domain
                ↓
         infrastructure → domain
```

- Los **stores** (`application/`) no deben importar `presentation/` (helpers, constants UI).
- Lógica de vista derivada de métricas/entidades vive en `application/` (p. ej. `dashboard-view.helpers.js`, `cash-movement-display.js`).
- Constantes de dominio compartidas (p. ej. métodos de pago del dashboard) en `domain/`.
- Mutaciones de store retornan `{ ok: true }` / `{ ok: false, message }` vía `shared/application/store-result.js`.
- Mensajes de éxito en vistas: `CRUD_MESSAGES` + nombre de entidad en `*.constants-ui.js`.

---

## 4. Bootstrap y shell

### 4.1 `main.js`

Registra: Pinia, Router, PrimeVue (componentes globales `pv-*`).

### 4.2 Layout autenticado

`public/presentation/views/layout.vue`:

- Sidebar filtrado por rol (`getMenuItemsByRole()`)
- Toolbar con contexto de sucursal
- Banners: caja cerrada, offline, employee-link, inventario bajo, gracia suscripción
- `<router-view :key="activeBranchId">` — remonta al cambiar sucursal
- Hooks: `useOperationalBootstrap()`, `useOperationalSocket()`, `useNotificationsBootstrap()`, `usePlatformNotificationsSync()`

**Orquestación shell:** `public/` y composables/banners globales **no importan stores de módulos**; usan `useShellFacade()` desde `shared/application/shell.facade.js` (ver [ARCHITECTURE.md §3.3](./ARCHITECTURE.md#33-shell-facade-sharedapplicationshellfacadejs)).

### 4.3 Rutas públicas (sin layout)

Definidas en `iam/presentation/iam.routes.js`:

| Ruta | Componente |
|------|------------|
| `/sign-in` | sign-in.vue |
| `/sign-up` | sign-up.vue (stepper multi-paso) |
| `/forgot-password` | forgot-password.vue |
| `/reset-password` | reset-password.vue |

---

## 5. Router

Archivo: `src/router/index.js`

| Ruta | Módulo | Requiere auth | Requiere sucursal |
|------|--------|---------------|-------------------|
| `/dashboard`, `/dashboard/comparison` | dashboard | ✅ | ❌ |
| `/tables`, `/tables/reservations` | tables | ✅ | ✅ |
| `/menu` | menu | ✅ | ✅ |
| `/inventory` | inventory | ✅ | ✅ |
| `/stations` | stations | ✅ | ✅ |
| `/payments` | payments | ✅ | ✅ |
| `/cash-register` | cash-register | ✅ | ✅ |
| `/pos/*` | pos | ✅ | ✅ |
| `/reports` | reports | ✅ | ✅ |
| `/users` | users | ✅ | ❌ |
| `/branches` | branches | ✅ | ❌ |
| `/select-branch` | branches | ✅ | ❌ |

**Guard global:** `iam/infrastructure/authentication.guard.js` en `router.beforeEach`.

---

## 6. Autenticación y autorización

### 6.1 IAM Store

`iam/application/iam.store.js`:

| Acción | API | Notas |
|--------|-----|-------|
| `signIn()` | POST `/auth/sign-in` | Guarda JWT en localStorage |
| `register()` | POST `/auth/register-owner` | Onboarding OWNER atómico |
| `ensureEmployeeLink()` | POST `/auth/ensure-employee` | Vínculo user ↔ employee |
| `selectBranch()` | localStorage | `gs_branch_id` |
| `logout()` | — | Limpia storage + `resetApplicationStores()` |
| `forgotPassword()` | POST `/auth/forgot-password` | Requiere SendGrid en API |
| `resetPassword()` | POST `/auth/reset-password` | Vista `/reset-password` |

### 6.2 Guard

Flujo:

1. Rutas públicas → permitir (redirect si ya autenticado en `/sign-in`)
2. Sin token → `/sign-in?redirect=`
3. `hasRouteAccess(role, path)` → si no, `/dashboard`
4. `requiresBranch(path)` sin branch → OWNER a `/select-branch`, otros a `/dashboard`

### 6.3 Roles

`shared/presentation/constants/roles.constants.js` — debe mantenerse alineado con backend `Roles` enum.

---

## 7. Capa HTTP

### 7.1 Cliente base

`shared/infrastructure/base-api.js`:

- `baseURL`: `getPlatformApiUrl()` → dev `http://localhost:8080/api/v1`
- Interceptor request: `Authorization: Bearer`, `X-Branch-Id`
- Interceptor response: 401 → logout + redirect sign-in
- FormData: no fuerza Content-Type JSON

### 7.2 Endpoints genéricos

`shared/infrastructure/base-endpoint.js`:

- `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- `listAt(path)`, `postAt(path)`, `postSub(id, subpath)`

### 7.3 Configuración

`shared/infrastructure/env.js` — prefijos configurables vía `VITE_*`:

```javascript
apiEnv.branches      // /branches
apiEnv.posSales      // /pos/sales
apiEnv.payments      // /payments
// ... ver archivo completo
```

---

## 8. Pinia Stores

| Store ID | Archivo | Responsabilidad |
|----------|---------|-----------------|
| `iam` | `iam/application/iam.store.js` | Sesión, branch, registro |
| `branches` | `branches/application/branches.store.js` | CRUD sucursales |
| `tables` | `tables/application/tables.store.js` | Zonas, mesas, estado |
| `reservations` | `tables/application/reservations.store.js` | Reservas diarias |
| `menu` | `menu/application/menu.store.js` | Ítems y categorías (+ offline cache) |
| `inventory` | `inventory/application/inventory.store.js` | Productos, stock |
| `pos` | `pos/application/pos.store.js` | Ventas, checkout, offline outbox |
| `stations` | `stations/application/stations.store.js` | Estaciones, kanban tickets |
| `payments` | `payments/application/payments.store.js` | Pagos, reembolsos |
| `cash-register` | `cash-register/application/cash-register.store.js` | Turnos, movimientos |
| `reports` | `reports/application/reports.store.js` | Reportes |
| `users` | `users/application/users.store.js` | Empleados |
| `dashboard` | `dashboard/application/dashboard.store.js` | Métricas BFF + fallback client + comparison |

**Reset en logout:** `shared/application/reset-application-stores.js`

---

## 9. Realtime (STOMP)

| Archivo | Rol |
|---------|-----|
| `shared/infrastructure/realtime/operational-socket.js` | Cliente STOMP |
| `shared/infrastructure/realtime/operational-events.js` | Tipos y canales |
| `shared/infrastructure/realtime/operational-event-dispatch.js` | Enruta a stores |
| `shared/presentation/composables/use-operational-socket.js` | Integración Vue |

**URL:** `VITE_WS_OPERATIONAL_URL` o derivada de API base.

**Dispatch:** eventos filtrados por `activeBranchId` → stores correspondientes (pos, stations, tables, cash-register, payments, dashboard, reservations).

---

## 10. Modo offline

| Feature | Implementación |
|---------|----------------|
| Detección red | `shared/infrastructure/offline/network.js` |
| Read cache | `read-cache.js` — menú, mesas |
| Outbox POS | `pos/application/pos-offline-sync.js` + `outbox-storage.js` |
| Replay | `use-operational-bootstrap.js` → evento `gastro:network-online` |

Operaciones encoladas: `CREATE_SALE`, `UPDATE_SALE`, `DISPATCH_TO_STATIONS`.

---

## 11. Tenant context

`shared/application/tenant-context.js`:

- `requireActiveBranchId()` — lanza si no hay sucursal seleccionada
- `requireCompanyId()` — desde IAM store

Usado por stores branch-scoped (menu, pos, inventory, etc.).

---

## 12. Assemblers

Patrón consistente en cada módulo:

```javascript
// infrastructure/assemblers/x.assembler.js
toEntityFromResponse(dto)
toCreateResource(entity)
toUpdateResource(entity)
toEntitiesFromResponse(list)
```

Mapean snake_case/camelCase del backend a entidades domain.

---

## 13. Desarrollo local

### 13.1 Requisitos

- Node.js 20+
- API corriendo en `localhost:8080`

### 13.2 Comandos

```bash
npm install
npm run dev          # Vite dev server (default :5173)
npm run build        # Build prod + verificaciones
npm run preview      # Preview dist
npm run deploy:pages # Cloudflare Pages
```

### 13.3 Variables de entorno

Copiar `.env.example`:

```env
VITE_PLATFORM_API_URL=http://localhost:8080/api/v1
VITE_WS_OPERATIONAL_URL=ws://localhost:8080/ws/operational
```

Producción: `.env.production` o variables en Cloudflare Pages CI.

---

## 14. Build y deploy

`vite.config.js`:

- Alias `@` → `./src`
- Manual chunks: primevue, vue, axios
- Bundle visualizer (dev)

Scripts post-build:

- `verify-production-build.js`
- `verify-dist-assets.js`
- `copy-spa-fallback.js` — SPA routing en Cloudflare

`public/_redirects`, `public/_headers` — config Cloudflare Pages.

---

## 15. Convenciones para contribuir

1. **Nuevo módulo:** seguir estructura domain/application/infrastructure/presentation.
2. **HTTP:** extender `BaseApi` + `BaseEndpoint`; paths en `env.js`.
3. **Estado:** Pinia composition API (`defineStore` con setup function).
4. **Rutas:** `{module}.routes.js` importado en `router/index.js`.
5. **Roles:** actualizar `roles.constants.js` + verificar backend.
6. **Realtime:** handler en store como `handleOperationalEvent(event)`.
7. **No usar** rutas `/support/*` del backend.
8. **Infra compartida:** `src/shared/infrastructure/` (HTTP, env, realtime, offline).

---

## 16. Brechas conocidas (frontend)

Ver [OPERATIONAL-VALIDATION.md](../gastro-suite-api/docs/OPERATIONAL-VALIDATION.md) y [INTEGRATION.md](./INTEGRATION.md).

| ID | Brecha | Plan |
|----|--------|------|
| WEB-01 | Imagen menú | ~~PLAN-01~~ ✅ |
| WEB-02 | Forgot/reset password | ~~PLAN-02~~ ✅ |
| WEB-03 | Dashboard BFF | ~~PLAN-03~~ ✅ |
| WEB-05 | Sin tests Vitest | PLAN-11 |
| WEB-09 | Transfer mesa desync cocina | Orquestación BFF |
| WEB-10 | Checkout sin bloqueo UI caja cerrada | UX |
| WEB-11 | Sin módulo communication | Nuevo módulo |
| WEB-12 | pos.store monolítico | Refactor |

Detalle tracking: [ACTION-PLAN.md](./ACTION-PLAN.md)

---

## 17. Referencias cruzadas

| Tema | Documento |
|------|-----------|
| **Arquitectura canónica (capas, facades, dependencias)** | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Plan remediación arquitectónica** | [ARCHITECTURE-REMEDIATION-PLAN.md](./ARCHITECTURE-REMEDIATION-PLAN.md) · [archive/](./archive/ARCHITECTURE-REMEDIATION-PLAN.md) |
| Validación operativa + SaaS | `gastro-suite-api/docs/OPERATIONAL-VALIDATION.md` |
| Backend técnico | `gastro-suite-api/docs/TECHNICAL.md` |
| Base conocimiento | `gastro-suite-api/docs/KNOWLEDGE-BASE.md` |
| Matriz integración | [INTEGRATION.md](./INTEGRATION.md) |
| Plan de acción | [ACTION-PLAN.md](./ACTION-PLAN.md) |
