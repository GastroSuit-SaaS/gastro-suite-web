# Base de Conocimiento — gastro-suite-web

> **Proyecto:** Frontend SPA · **Última actualización:** 2026-06-27 (análisis arquitectónico profundo)  
> **Índice global:** `gastro-suite-api/docs/KNOWLEDGE-BASE-INDEX.md`  
> **Validación operativa:** `gastro-suite-api/docs/OPERATIONAL-VALIDATION.md`  
> **Backend:** `gastro-suite-api/docs/KNOWLEDGE-BASE.md`

Documento de **conocimiento en profundidad** del frontend. Fuente de verdad para dominio UI, stores, integración HTTP, offline y realtime.

---

## Tabla de contenidos

1. [Arquitectura y convenciones](#1-arquitectura-y-convenciones)
2. [Inventario global](#2-inventario-global)
3. [Capa shared (transversal)](#3-capa-shared-transversal)
4. [Módulo: iam](#4-módulo-iam)
5. [Módulo: branches](#5-módulo-branches)
6. [Módulo: tables + reservations](#6-módulo-tables--reservations)
7. [Módulo: menu](#7-módulo-menu)
8. [Módulo: inventory](#8-módulo-inventory)
9. [Módulo: pos](#9-módulo-pos)
10. [Módulo: stations](#10-módulo-stations)
11. [Módulo: payments](#11-módulo-payments)
12. [Módulo: cash-register](#12-módulo-cash-register)
13. [Módulo: reports](#13-módulo-reports)
14. [Módulo: dashboard](#14-módulo-dashboard)
15. [Módulo: users](#15-módulo-users)
16. [Módulo: public (shell)](#16-módulo-public-shell)
17. [Roles, guards y navegación](#17-roles-guards-y-navegación)
18. [Integración HTTP](#18-integración-http)
19. [Offline y resiliencia](#19-offline-y-resiliencia)
20. [Realtime STOMP](#20-realtime-stomp)
21. [Mapa de dependencias entre módulos](#21-mapa-de-dependencias-entre-módulos)
22. [Flujo operativo diario (implementado)](#22-flujo-operativo-diario-implementado)
23. [Brechas y madurez](#23-brechas-y-madurez)
24. [Changelog](#24-changelog)

---

## 1. Arquitectura y convenciones

### 1.1 Patrón por módulo feature

```
src/{module}/
├── domain/models/           # Entidades, VOs, reglas cliente
├── application/*.store.js   # Pinia (estado + acciones)
├── infrastructure/
│   ├── api/*.api.js         # HTTP (extends BaseApi)
│   └── assemblers/          # DTO ↔ entity
└── presentation/
    ├── views/               # Páginas enrutadas
    ├── components/          # UI del módulo
    ├── constants/           # Labels, mensajes UI
    └── {module}.routes.js   # Rutas hijas
```

### 1.2 Entry y boot

| Archivo | Rol |
|---------|-----|
| `src/main.js` | Pinia + Router + PrimeVue global `pv-*` |
| `src/app.vue` | Root router-view, toast, confirm |
| `src/router/index.js` | Router central + guard |

### 1.3 Convenciones

| Concepto | Convención |
|----------|------------|
| Store Pinia | `use{Module}Store`, id = nombre módulo |
| API class | `{Module}Api extends BaseApi` |
| Assembler | `{Entity}Assembler.toEntityFromResponse()` |
| Rutas | `{module}.routes.js` importado en router |
| Carpeta infra | **`infrustructure`** (typo intencional, no renombrar sin refactor global) |
| Scope sucursal | `requireActiveBranchId()` antes de API branch-scoped |
| Scope empresa | `requireCompanyId()` o `iamStore.companyId` |

### 1.4 Política API

- Base: `getPlatformApiUrl()` → dev `http://localhost:8080/api/v1`
- **Nunca** llamar `/support/*`
- Headers autenticados: `Authorization: Bearer {gs_token}`, `X-Branch-Id: {gs_branch_id}`

---

## 2. Inventario global

| Métrica | Cantidad |
|---------|----------|
| Módulos feature | 13 (+ public shell) |
| Pinia stores | 14 |
| Archivos `*.api.js` | 13 |
| Entidades domain (`*.entity.js`) | 21 |
| Rutas autenticadas (layout) | 12 módulos |
| Composables shared | 12 |
| Integración E2E núcleo operativo | **78–82%** |
| Integración global FE↔BE | **~58–62%** |

---

## 3. Capa shared (transversal)

### 3.1 Session storage

**Archivo:** `src/shared/infrustructure/session-storage.js`

| Constante | Key localStorage | Uso |
|-----------|------------------|-----|
| `SESSION_KEYS.TOKEN` | `gs_token` | JWT |
| `SESSION_KEYS.BRANCH_ID` | `gs_branch_id` | Sucursal activa |
| `SESSION_KEYS.BRANCH_NAME` | `gs_branch_name` | Nombre sucursal UI |
| `SESSION_KEYS.USER` | `gs_user` | Snapshot usuario |

**Logout:** `clearAllAppLocalStorage()` — token, branch, read caches, outbox.

### 3.2 HTTP client

**`base-api.js`**
- Axios timeout 10s
- No envía JWT en URLs `/auth/`
- FormData: no fuerza Content-Type
- 401 → logout IAM + redirect `/sign-in`

**`base-endpoint.js`** — helpers: `getById`, `create`, `update`, `delete`, `listAt`, `postAt`, `postSub`, `patchSub`

### 3.3 Environment

**Archivo:** `src/shared/infrustructure/env.js`

Todas las variables `VITE_*` — ver `.env.example`. Destacadas:

| Variable | Default dev | Uso |
|----------|-------------|-----|
| `VITE_PLATFORM_API_URL` | `localhost:8080/api/v1` | REST base |
| `VITE_WS_OPERATIONAL_URL` | (derivada) | STOMP |
| `VITE_POS_BILLABLE_REQUIRES_SENT` | true | Regla líneas cobrables |

### 3.4 Tenant context

**`src/shared/application/tenant-context.js`**
- `requireActiveBranchId()` — lanza si no hay sucursal
- `requireCompanyId()` — desde IAM

### 3.5 Reset stores on logout

**`reset-application-stores.js`** — dispose todos los stores excepto `iam`.

### 3.6 Composables

| Composable | Archivo | Consumidores |
|------------|---------|--------------|
| `useOperationalBootstrap` | `use-operational-bootstrap.js` | layout — refresh caja 45s, replay offline |
| `useOperationalSocket` | `use-operational-socket.js` | layout — STOMP |
| `useCentralCashSession` | `use-central-cash-session.js` | pos-payment |
| `useConfirmDialog` | `use-confirm-dialog.js` | mayoría management views |
| `useNotification` | `use-notification.js` | menu, inventory, payments, etc. |
| `useToolbarContext` | `use-toolbar-context.js` | POS, stations |
| `useDateFormatter` | `use-date-formatter.js` | tables, cash-register |
| `useNetworkStatus` | `use-network-status.js` | offline banner |

### 3.7 Banners globales (layout)

| Componente | Condición visible |
|------------|-------------------|
| `offline-status-banner` | Outbox pendiente o sin red |
| `employee-link-status-banner` | Falta vínculo employee/company; en `/reports` también si `!hasEmployeeLink` |
| `cash-register-status-banner` | Sin sesión caja abierta (roles caja) |

---

## 4. Módulo: iam

**Carpeta:** `src/iam/`

### 4.1 Domain

| Clase | Archivo | Propiedades / métodos clave |
|-------|---------|----------------------------|
| `User` | `domain/models/user.entity.js` | `id`, `username`, `roles[]`, `empresaId`, `sucursalId`, `employeeId`; `hasRole()`, `isOwner`, `hasBranch` |
| `EmpresaRegistration` | `empresa-registration.vo.js` | `ruc`, `razonSocial`; `validate()` |
| `SucursalRegistration` | `sucursal-registration.vo.js` | geo Perú; `validate()` |
| `UsuarioRegistration` | `usuario-registration.vo.js` | credenciales signup; `validate()` |

### 4.2 Store — `useIamStore`

**Archivo:** `application/iam.store.js`

| State | Getters | Actions |
|-------|---------|---------|
| `currentUser`, `token`, `activeBranchId`, `activeBranchName`, `isLoading`, `error`, `employeeLinkStatus`, `employeeLinkMessage`, `rolesCatalog` | `isAuthenticated`, `userRole`, `isOwner`, `hasBranchSelected`, `companyId`, `hasEmployeeLink`, `assignableRoles` | `signIn`, `logout`, `register`, `forgotPassword`, `resetPassword`, `selectBranch`, `clearBranch`, `ensureEmployeeLink`, `loadRolesCatalog` |

### 4.3 API — `IamApi`

| Método | HTTP |
|--------|------|
| `signIn` | POST `/auth/sign-in` |
| `signUp` | POST `/auth/sign-up` |
| `registerOwner` | POST `/auth/register-owner` |
| `forgotPassword` | POST `/auth/forgot-password` |
| `resetPassword` | POST `/auth/reset-password` |
| `ensureEmployeeLink` | POST `/auth/ensure-employee` |
| `createCompany` | POST `/companies` |

### 4.4 Rutas

| Path | Vista |
|------|-------|
| `/sign-in` | `sign-in.vue` |
| `/sign-up` | `sign-up.vue` (stepper 3 pasos) |
| `/forgot-password` | `forgot-password.vue` |
| `/reset-password` | `reset-password.vue` |

### 4.5 Assemblers

- `user.assembler.js` — DTO multi-alias → `User`
- `registration.assembler.js` — VOs → register-owner body

### 4.6 Post-login

**`shared/application/post-login-route.js`**
- CASHIER → `/cash-register`
- OWNER sin branch → `/select-branch`
- Default → `/dashboard`

---

## 5. Módulo: branches

**Carpeta:** `src/branches/`

### 5.1 Domain — `Branch`

`id`, `empresaId`, `codigo`, `nombre`, `direccion`, geo, `encargadoId`, `posBillableRequiresSent`, `isActive`  
Getters: `fullAddress`, `displayName`

### 5.2 Store — `useBranchesStore`

Actions: `fetchAll`, `fetchById`, `create`, `update`, `remove`, `toggleActive`

### 5.3 API

`GET /companies/{companyId}/branches`, CRUD `/branches/{id}`

### 5.4 Rutas

| Path | Vista | Rol |
|------|-------|-----|
| `/branches` | `branch-management.vue` | OWNER |
| `/select-branch` | `select-branch.vue` | OWNER (standalone, sin layout) |

### 5.5 Assembler

DTO: `branchId`, `branchCode`, `branchName`, `branchAddress`, `employeeId`, `posBillableRequiresSent`

---

## 6. Módulo: tables + reservations

**Carpeta:** `src/tables/` — **dos stores**.

### 6.1 Domain

| Entidad | Constantes | Estados / formas |
|---------|------------|------------------|
| `Table` | `TABLE_STATUS`, `TABLE_SHAPE` | available, occupied, cleaning, reserved |
| `Zone` | — | color, tableCount |
| `Reservation` | `RESERVATION_STATUS` | confirmed, seated, cancelled, no_show |

**Table getters:** `isOccupied`, `urgencyLevel`, `occupiedMinutes`

### 6.2 Store — `useTablesStore`

**Getters clave:** `occupiedTables`, `availableTables`, `occupancyRate`, `filteredTables`

**Actions:** CRUD zones/tables, `setTableStatus`, `assignTable`, `freeTable`, `setTableOrderId`, `handleOperationalEvent`

### 6.3 Store — `useReservationsStore`

**Actions:** `fetchByDate`, `create`, `cancel`, `checkIn`, `handleOperationalEvent`

### 6.4 APIs

**TablesApi:** zones + tables CRUD, `updateStatus`, `assign`, `free`  
**ReservationsApi:** list by date, create, cancel, check-in

### 6.5 Rutas

| Path | Vista |
|------|-------|
| `/tables` | `tables-management.vue` |
| `/tables/reservations` | `reservations-management.vue` |

### 6.6 Offline

Read cache: `gastro_suite_read_cache_tables_{branchId}`  
Hydrate: `tables.store.hydrateFromCache()`

### 6.7 Realtime

Eventos: `table.status.changed`, `reservation.*` → patch local o refetch silent

---

## 7. Módulo: menu

**Carpeta:** `src/menu/`

### 7.1 Domain

- `MenuItem` — `price`, `prepTime`, `stationId`, `imageUrl`, `isAvailable`, `sku`
- `Category` — `sortOrder`, `color`, `count`
- Helper: `menu-sort.js` → `sortBySortOrder`

### 7.2 Store — `useMenuStore`

**Getters:** `filteredItems`, `availableItems`, `categories`

**Actions:** CRUD items/categories, `setItemAvailability`, `fetchAll`, `hydrateFromCache`

**Upload imagen (PLAN-01 ✅):** tras create/update, `uploadItemImageIfPresent` → `PATCH /menu-items/{id}/image` (multipart `image`). Si falla upload, producto persiste y retorna `imageWarning`.

### 7.3 API — `MenuApi`

List by branch, CRUD `/menu-items`, `/menu-categories`  
`uploadItemImage(itemId, imageFile)` → `PATCH /menu-items/{id}/image`

### 7.4 Offline

Cache: `gastro_suite_read_cache_menu_{branchId}` — categories + items

---

## 8. Módulo: inventory

**Carpeta:** `src/inventory/`

### 8.1 Domain

| Entidad | Constantes | Lógica cliente |
|---------|------------|----------------|
| `Product` | `STOCK_STATUS` | `isLowStock`, `margin`, `marginPercentage` |
| `InventoryCategory` | — | igual shape que menu category |
| `StockMovement` | `MOVEMENT_TYPE`, `MOVEMENT_DIRECTION` | `signedQuantity`, `isEntry` |

### 8.2 Store — `useInventoryStore`

Filtros: search, category, status, movement type/direction  
Getters: `lowStockProducts`, `totalStockValue`, `filteredMovements`

### 8.3 API

Products, categories, movements — list by branch + CRUD

---

## 9. Módulo: pos

**Carpeta:** `src/pos/` — **módulo más complejo.**

### 9.1 Domain

| Entidad | Constantes | Comportamiento |
|---------|------------|----------------|
| `Sale` | `SALE_STATUS`, `SALE_TYPE`, `DELIVERY_STATUS`, `SALE_TAX_RATE` | `addItem`, notas línea, descuentos, `transferToTable`, delivery advance |
| `SaleItem` | — | `isSent`, `billable`, descuentos línea |
| `SplitBill` | `SPLIT_MODE` | `createEqualSplits`, `createItemSplits`, `markPaid` |

### 9.2 Store — `usePosStore` (grande)

**State:** `sales`, `currentSale`, `kitchenTicketsAll`, `billableRequiresSent`, catalog filters

**Getters clave:** `activeOrders`, `currentOrderTotals`, `kitchenOrderStatus`, `filteredCatalog`, `saleByTableId`

**Actions agrupadas:**

| Grupo | Funciones |
|-------|-----------|
| Carga | `fetchAll`, `loadOperationsConfig`, `fetchById`, `loadSaleContext` |
| Venta | `openSaleForTable`, `openTakeawaySale`, `openDeliverySale`, item mutations, `advanceDeliveryStatus` |
| Cocina | `sendCurrentSaleToStations`, `refreshKitchenTickets`, `getItemKitchenStatusKey`, `canModifySaleLine` |
| Pago | `confirmPayment`, `confirmSplitPayment` (parcial + propina) |
| Otros | `transferSale`, `cancelCurrentSale`, `syncOfflineQueue`, `handleOperationalEvent` |

### 9.3 API — `PosApi`

| Método | Endpoint |
|--------|----------|
| CRUD sales | `/pos/sales` |
| `checkout` | POST `.../checkout` |
| `checkoutSplit` | POST `.../checkout-split` |
| `dispatchToStations` | POST `.../dispatch-to-stations` |
| `updateDeliveryStatus` | PATCH `.../delivery-status` |
| `listKitchenTicketsBySale` | GET `/branches/{id}/pos/tickets?saleId=` |
| `getOperationsConfig` | GET `/pos/operations-config` |

### 9.4 Rutas y flujo UX

```
/pos → pos-terminal.vue
  → /pos/tables?zone=… → pos-table-floor.vue (reutiliza table-floor-panel.vue)
    → /pos/order/:saleId → pos-order.vue
      → /pos/payment/:saleId → pos-payment.vue
```

**Redirects legacy:** `/pos/select-zone` y `/pos/select-zone/:zoneId` → `pos-tables` (con `?zone=` si aplica).

**Tables admin:** `/tables` → `tables-management.vue` (plano compartido vía `table-floor-panel`, sin modo `from=pos`).

### 9.5 Assembler — `SaleAssembler`

- `toCreateResource`, `toUpdateResource`, `fromCheckoutResponse`, `fromDispatchResponse`
- `isPersistedSaleId(id)` — distingue UUID vs temp offline id

### 9.6 Offline outbox

**Archivo:** `application/pos-offline-sync.js`  
**Storage:** `gastro_suite_offline_outbox`

| Tipo outbox | Cuándo |
|-------------|--------|
| `CREATE_SALE` | Venta creada sin red |
| `UPDATE_SALE` | Cambios líneas offline |
| `DISPATCH_TO_STATIONS` | Dispatch pendiente |

Replay: `syncOfflineQueue()` en `gastro:network-online`

### 9.7 Realtime

`kitchen.ticket.*` → refresh tickets  
`sale.updated` → refetch sale

---

## 10. Módulo: stations

**Carpeta:** `src/stations/`

### 10.1 Domain

- `Station` — estación cocina
- `StationTicket` — `TICKET_STATUS`; getters `elapsedMinutes`, `urgencyLevel`

### 10.2 Store — `useStationsStore`

**Kanban getters:** `receivedTickets`, `preparingTickets`, `readyTickets`, `readyCount`

**Actions:** `advanceTicket`, `cancelTicket`, `archiveTicket`, `sendSaleToStations`, `handleOperationalEvent`

### 10.3 API

Stations CRUD + tickets CRUD bajo `/pos/tickets`

### 10.4 Rol

Principalmente **COOK** (+ OWNER, BRANCH_ADMIN)

---

## 11. Módulo: payments

**Carpeta:** `src/payments/`

### 11.1 Domain

**`Payment`** — `PAYMENT_METHOD` (cash, card, yape, plin), `RECEIPT_TYPE`, `PAYMENT_STATUS`  
Getters: `netCollected`, `isRefundable`, `isToday`

**`payment-net.js`** — `paymentNetCollected(payment)` — lógica neto cobrado

### 11.2 Store — `usePaymentsStore`

**Getters dashboard:** `todayTotal`, `todayByMethod`, `todayCount`, `todaysPayments`

**Actions:** `fetchAll`, `createRefund`, `previewRefund`, `listRefunds`, `handleOperationalEvent`

### 11.3 API

List by branch, CRUD, refunds preview/create/list

---

## 12. Módulo: cash-register

**Carpeta:** `src/cash-register/`

### 12.1 Domain

- `CashRegisterSession` — `SESSION_STATUS`; getters `duration`, `hasCashShortage`
- `CashMovement` — `MOVEMENT_TYPE`, `MOVEMENT_CATEGORY`; `isLinkedToPayment`

### 12.2 Store — `useCashRegisterStore`

**Getters:** `hasOpenSession`, `sessionExpectedCash`, `sessionBalance`, `sessionSalesByMethod`

**Actions:** `openSession`, `closeSession`, `refreshOpenSession`, `addMovement`, `fetchCollectorSummary`

### 12.3 API

Sessions: open/close/list/open-by-branch/collector-summary  
Movements: CRUD

### 12.4 Integración POS

Checkout POS **requiere** sesión abierta — validado backend y UX via `useCentralCashSession`.

---

## 13. Módulo: reports

**Carpeta:** `src/reports/`

### 13.1 Domain — `Report`

`REPORT_TYPE`, `REPORT_STATUS`, `EXPORT_FORMAT`  
Methods: `isGenerated`, `isFailed`

### 13.2 Store

`generate()` — POST report PENDING; requiere `employeeId`  
`fetchAll`, `fetchById`, `remove`

### 13.3 Employee-link UX (PLAN-06 ✅)

- Getter `iamStore.hasEmployeeLink` (`!!currentUser?.employeeId`)
- Banner en `/reports` si falta vínculo (mensaje `REPORTS_MESSAGES.EMPLOYEE_LINK_REQUIRED`)
- `reports-home.vue`: botón generar deshabilitado + tooltip; `onMounted` llama `ensureEmployeeLink`
- `reports.store.generate()`: reintenta `ensureEmployeeLink` antes de validar `employeeId`

---

## 14. Módulo: dashboard

**Carpeta:** `src/dashboard/`

### 14.1 Patrón: read-model BFF + fallback client-side

**Primario:** `GET /branches/{branchId}/dashboard/metrics` → `OperationalMetrics` en store (`metricsSource: api`).

**Fallback:** agrega sub-stores con la **misma forma anidada** si el endpoint no responde (`metricsSource: client`).

**Contrato `OperationalMetrics`:**

| Sección | Campos |
|---------|--------|
| `sales` | `revenue`, `paymentCount`, `avgTicket`, `byMethod`, `topItems[]` |
| `diningRoom` | `totalTables`, `occupiedTables`, `availableTables`, `reservedTables`, `cleaningTables`, `occupancyRate`, `reservationsToday`, `activeOrders` |
| `kitchen` | `received`, `preparing`, `ready`, `totalToday`, `stations[]` |
| `cashRegister` | `open`, `shiftName`, `expectedCash`, `paymentCount` |
| `inventory` | `lowStockCount` |

Zona horaria operativa: `America/Lima`. Query opcional: `?date=YYYY-MM-DD`.

### 14.2 API

`dashboard.api.js` — `getMetrics(branchId, date?)`, `getComparison(branchId, date?, compare?)`

Ruta UI: `/dashboard/comparison` → `dashboard-comparison.vue`

### 14.3 Realtime

`payment.*` → `handleOperationalEvent` refetch parcial

---

## 15. Módulo: users

**Carpeta:** `src/users/` — gestiona **Employee** backend, no User aggregate.

### 15.1 Domain — `UserProfile`

Campos empleado + `role`, `sucursalId`; `fullName`, `initials`

### 15.2 Store — `useUsersStore`

CRUD empleados por company

### 15.3 API — `UsersApi`

Base path: **`/employees`** (env `VITE_USERS_ENDPOINT`)

### 15.4 Roles UI (PLAN-04 ✅)

- `GET /roles` → `roles.api.list` → `iam.store.loadRolesCatalog()` (post-login + `layout.vue`)
- `assignableRoles` excluye OWNER; fallback a `ROLES` locales si API falla (`rolesCatalogSource`: `api` | `fallback`)
- `buildUserRoleOptions()` en `users.constants-ui.js` enriquece labels desde catálogo API
- `ROLE_ALLOWED_ROUTES` sigue estático para guards/menú

---

## 16. Módulo: public (shell)

**Carpeta:** `src/public/`

| Componente | Rol |
|------------|-----|
| `layout.vue` | Shell autenticado; bootstrap + socket; `:key="activeBranchId"` |
| `sidebar.vue` | Nav filtrado por rol |
| `toolbar.vue` | Título, back, logout |
| `branch-switcher.vue` | Cambio sucursal OWNER |

**Constants:** `layout.constants-ui.js` → `getMenuItemsByRole(role, hasBranch)`

---

## 17. Roles, guards y navegación

### 17.1 Matriz de rutas por rol

**Archivo:** `shared/presentation/constants/roles.constants.js`

| Rol | Rutas |
|-----|-------|
| OWNER | Todo incl. `/branches`, `/select-branch` |
| BRANCH_ADMIN | Operativo + `/users` |
| WAITER | `/dashboard`, `/pos`, `/tables` |
| CASHIER | `/dashboard`, `/pos`, `/payments`, `/cash-register` |
| COOK | `/dashboard`, `/stations` |

### 17.2 Rutas que requieren sucursal

`/tables`, `/menu`, `/pos`, `/stations`, `/payments`, `/cash-register`, `/inventory`, `/reports`

### 17.3 Guard

**`iam/infrastructure/authentication.guard.js`**

1. Públicas IAM → allow
2. Sin token → `/sign-in?redirect=`
3. `hasRouteAccess(role, path)` → deny → `/dashboard`
4. `requiresBranch(path)` sin branch → OWNER `/select-branch`, otros `/dashboard`

---

## 18. Integración HTTP

**Matriz completa:** [INTEGRATION.md](./INTEGRATION.md)

### Resumen consumo por módulo

| Módulo | API file | Endpoints principales |
|--------|----------|----------------------|
| iam | `iam.api.js` | `/auth/*`, `/companies` |
| branches | `branches.api.js` | `/branches` |
| tables | `tables.api.js` | `/zones`, `/tables` |
| reservations | `reservations.api.js` | `/reservations` |
| menu | `menu.api.js` | `/menu-items`, `/menu-categories` |
| inventory | `inventory.api.js` | `/inventory/*` |
| pos | `pos.api.js` | `/pos/sales`, checkout, dispatch |
| stations | `stations.api.js` | `/stations`, `/pos/tickets` |
| payments | `payments.api.js` | `/payments`, refunds |
| cash-register | `cash-register.api.js` | sessions, movements |
| reports | `reports.api.js` | `/reports` |
| users | `users.api.js` | `/employees` |

---

## 19. Offline y resiliencia

| Mecanismo | Módulos | Storage key |
|-----------|---------|-------------|
| Read cache | menu, tables, pos ops config | `gastro_suite_read_cache_{domain}_{branchId}` |
| Write outbox | pos only | `gastro_suite_offline_outbox` |
| Network events | shared | `gastro:network-online/offline` |

**Bootstrap replay:** `useOperationalBootstrap` → `posStore.syncOfflineQueue()` → refetch menu/tables/stations

---

## 20. Realtime STOMP

### 20.1 Cliente

`shared/infrustructure/realtime/operational-socket.js`  
URL: `VITE_WS_OPERATIONAL_URL` o derivada de API

### 20.2 Event types

**Archivo:** `operational-events.js`

```
kitchen.ticket.created | .updated | .cancelled
sale.updated
table.status.changed
cash.session.opened | .closed
cash.movement.created
payment.completed | .refunded
reservation.created | .updated | .cancelled
```

### 20.3 Dispatch

**`operational-event-dispatch.js`** — filtra por `activeBranchId`, import dinámico stores:

| Prefijo evento | Stores |
|----------------|--------|
| `kitchen.ticket.*` | stations, pos |
| `sale.updated` | pos |
| `table.status.*` | tables |
| `cash.*` | cash-register |
| `payment.*` | payments, dashboard |
| `reservation.*` | tables, reservations |

---

## 21. Mapa de dependencias entre módulos

```
IAM ──provides──► token, branchId, companyId, employeeId
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    branches      tables         users
        │             │
        └──────► POS ◄── menu
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
    stations  payments  cash-register
         │         │         │
         └────────► dashboard (aggregador)
```

**Acoplamiento intencional:** POS importa tables, menu, stations, payments, cash-register (~1.350 líneas en `pos.store.js`).

---

## 22. Flujo operativo diario (implementado)

Documento completo: `gastro-suite-api/docs/OPERATIONAL-VALIDATION.md`

```
Login → [OWNER: /select-branch] → [CASHIER: abrir caja /cash-register]
  → /pos → /pos/tables → /pos/order/:id → dispatch → /pos/payment/:id
  → [COOK: /stations] → cierre caja (arqueo)
```

| Paso operativo | Pantalla | Store | Backend |
|----------------|----------|-------|---------|
| Apertura caja | `cash-register-home.vue` | `cash-register.store` | `POST /cash-register/sessions/open` |
| Selección mesa | `pos-table-floor.vue` | `tables.store`, `pos.store` | POST `/pos/sales` |
| Toma pedido | `pos-order.vue` | `pos.store`, `menu.store` | PATCH sale/items, notas |
| Comanda | `pos-order.vue` | `pos.store` | POST `.../dispatch-to-stations` |
| Cocina | `stations-management.vue` | `stations.store` | PATCH `/pos/tickets/{id}` |
| Cobro | `pos-payment.vue` | `pos.store`, `payments.store` | POST `.../checkout` |
| Delivery | `pos-terminal`, `pos-order` | `pos.store` | PATCH `.../delivery-status` |

### Capacidades NO implementadas en UI

- Unión / separación de mesas
- Variantes / combos / promociones menú
- Módulo communication (notificaciones push/in-app)
- Admin subscriptions / companies post-onboarding
- Emisión comprobante SUNAT (solo captura NOTA/BOLETA/FACTURA en pago)

---

## 23. Brechas y madurez

| ID | Brecha | Plan |
|----|--------|------|
| WEB-01 | Imagen menú | ~~PLAN-01~~ ✅ |
| WEB-02 | Forgot/reset password | ~~PLAN-02~~ ✅ |
| WEB-03 | Dashboard BFF | ~~PLAN-03~~ ✅ |
| WEB-04 | Roles hardcoded | ~~PLAN-04~~ ✅ |
| WEB-05 | Sin tests Vitest | PLAN-11 |
| WEB-06 | Branch switcher + stale state | PLAN-16 |
| WEB-07 | Labels bajo contraste modales | ~~PLAN-28~~ ✅ |
| WEB-08 | Header delivery saturaba búsqueda | ~~PLAN-28~~ ✅ |
| WEB-09 | Transfer mesa desync cocina | PLAN-31 |
| WEB-10 | Checkout sin bloqueo UI si caja cerrada | PLAN-33 |
| WEB-11 | Sin módulo communication | PLAN-34 |
| WEB-12 | pos.store monolítico (~1350 líneas) | Refactor composables |

### Madurez por módulo (operación + SaaS)

| Módulo | E2E | Offline | SaaS-ready |
|--------|-----|---------|------------|
| pos | ✅ | ✅ outbox | 🟡 |
| payments | ✅ | — | 🟡 |
| cash-register | ✅ | realtime | 🟡 |
| menu | ✅ | read cache | 🟡 |
| iam | ✅ | — | 🟡 |
| dashboard | ✅ | fallback client | 🟡 |
| tables/reservations | ✅ | read cache | 🟡 |
| inventory | ✅ | — | 🟡 |
| reports | ✅ | — | 🟡 |
| users/employees | ✅ | — | 🟡 |
| branches | ✅ | — | 🟡 |
| communication | 🔴 | — | N/A |
| subscriptions admin | 🔴 | — | 🔴 |

---

## 24. Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-27 | PLAN-03 | Contrato anidado `OperationalMetrics` (sales, diningRoom, kitchen, cashRegister, inventory) + vista dashboard por áreas operativas. |
| 2026-06-27 | PLAN-04 | Catálogo roles desde GET /roles con fallback; `assignableRoles` en IAM store. |
| 2026-06-27 | PLAN-06 | UX employee-link en reportes: `hasEmployeeLink`, banner, botón disabled, `ensureEmployeeLink` en store. |
| 2026-06-27 | PLAN-01 | Integración upload imagen menú en web (`menu.api.js`, `menu.store.js`). |
| 2026-06-27 | PLAN-25 | POS delivery + pago parcial: terminal, order, payment, store, filtros hub. |
| 2026-06-27 | PLAN-26 | Inventario web: edit/delete movimientos, modo edición, banner stock bajo. |
| 2026-06-27 | PLAN-27 | Auth web: `base-api.js`, `iam.store.js`, `roles.api.js` (tenant + logout 401). |
| 2026-06-27 | PLAN-28 | Estilos `surface-text.css`; UX header delivery; fix meta “Orden #30”. |
| 2026-06-27 | PLAN-02, PLAN-05 | Forgot/reset password web: iam.api, store, reset-password.vue. |
| 2026-06-27 | ACTION-PLAN | Progreso 10/30; Fase 1 completa (6/6). |
| 2026-06-27 | Inventario | 14 stores, 13 APIs, 21 entidades domain |
| 2026-06-27 | **Análisis arquitectónico** | Sección flujo operativo diario; madurez SaaS; brechas WEB-09–12; corrección IAM forgot/reset; delivery-status; dashboard comparison; ref `OPERATIONAL-VALIDATION.md`. |

```markdown
<!-- Plantilla -->
| YYYY-MM-DD | [PLAN-XX] Descripción. Archivos: `path`. |
```
