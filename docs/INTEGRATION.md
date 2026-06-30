# Matriz de Integración Frontend ↔ Backend

> **Última actualización:** 2026-06-29 (cierre brechas platform, communication, employees, company)  
> **Base API:** `{VITE_PLATFORM_API_URL}` → dev: `http://localhost:8080/api/v1`  
> **Política:** El web consume **solo** rutas BFF/operativas. **Cero** llamadas a `/support/*`.  
> **Validación operativa:** `gastro-suite-api/docs/OPERATIONAL-VALIDATION.md`

**Leyenda:** ✅ Integrado · 🟡 Parcial · 🔴 Sin integración · N/A No aplica (reemplazado o interno)

---

## Resumen ejecutivo

| Categoría | ✅ | 🟡 | 🔴 |
|-----------|----|----|-----|
| Operaciones core | 15 | 2 | 0 |
| Administración SaaS | 5 | 0 | 0 |
| Communication | 2 | 0 | 4 |
| Infra / realtime | 2 | 0 | 0 |
| **Total áreas** | **24** | **2** | **4** |

| Dimensión | % |
|-----------|---|
| Núcleo operativo (POS→cocina→caja→mesas) E2E | **78–82%** |
| Integración global FE↔BE | **~68–72%** |
| SaaS admin (platform SYSTEM + owner subscription) | **~85%** |

---

## 1. IAM y onboarding

| Backend | Método | Frontend | Store / API | Estado |
|---------|--------|----------|-------------|--------|
| `/auth/sign-in` | POST | `iam.api.signIn` | `iam.store.signIn` | ✅ |
| `/auth/sign-up` | POST | `iam.api.signUp` | — (legacy) | 🟡 |
| `/auth/register-owner` | POST | `iam.api.registerOwner` | `iam.store.register` | ✅ |
| `/auth/ensure-employee` | POST | `iam.api.ensureEmployeeLink` | `iam.store.ensureEmployeeLink` | ✅ |
| `/companies` | POST | onboarding vía `register-owner` | `iam.store.register` | ✅ |
| `/companies` | GET | — | — | N/A (SYSTEM usa `/platform/companies/overview`) |
| `/companies/{id}` | GET/PATCH | `company.api.getById/update` | `company.store` | ✅ |
| `/companies/{id}` | DELETE | — | — | N/A (solo SYSTEM; sin UI tenant) |
| `/auth/forgot-password` | POST | `iam.api.forgotPassword` | `iam.store.forgotPassword` | ✅ |
| `/auth/reset-password` | POST | `iam.api.resetPassword` | `reset-password.vue` | ✅ |
| `/support/users` | CRUD | — | — | N/A (intencional; web usa `/employees`) |
| `/roles` | GET | `roles.api.list` | `iam.store.loadRolesCatalog` | ✅ |

---

## 2. Sucursales

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/companies/{companyId}/branches` | GET | `branches.api.listByCompany` | ✅ |
| `/branches` | POST | `branches.api.create` | ✅ |
| `/branches/{id}` | GET/PATCH/DELETE | `branches.api.*` | ✅ |
| `/support/branches` | * | — | N/A (intencional) |

---

## 3. Mesas y zonas

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/zones` | GET | `tables.api.listZonesByBranch` | ✅ |
| `/zones` | POST | `tables.api.createZone` | ✅ |
| `/zones/{id}` | GET/PATCH/DELETE | `tables.api.*` | ✅ |
| `/zones/{zoneId}/tables` | GET | `tables.api.listTablesByZone` | ✅ |
| `/tables` | POST | `tables.api.createTable` | ✅ |
| `/tables/{id}` | GET/PATCH/DELETE | `tables.api.*` | ✅ |

**Eventos realtime:** `TABLE_STATUS_CHANGED` → `tables.store`

---

## 4. Reservas

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/reservations` | GET | `reservations.api.listByDate` | ✅ |
| `/branches/{branchId}/reservations` | POST | `reservations.api.create` | ✅ |
| `/reservations/{id}/cancel` | POST | `reservations.api.cancel` | ✅ |
| `/reservations/{id}/check-in` | POST | `reservations.api.checkIn` | ✅ |

**Auth backend:** OWNER, BRANCH_ADMIN, WAITER.

---

## 5. Menú

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/menu-items` | GET | `menu.api.listItemsByBranch` | ✅ |
| `/branches/{branchId}/menu-categories` | GET | `menu.api.listCategoriesByBranch` | ✅ |
| `/menu-items` | POST | `menu.api.createItem` | ✅ |
| `/menu-items/{id}` | GET/PATCH/DELETE | `menu.api.*` | ✅ |
| `/menu-categories` | POST/PATCH/DELETE | `menu.api.*` | ✅ |
| `/menu-items/{id}/image` | PATCH (multipart) | `menu.api.uploadItemImage` | ✅ |

**Nota:** `menu.store.uploadItemImageIfPresent` invoca upload post create/update (PLAN-01 ✅).

---

## 6. Inventario

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/inventory/products` | GET | `inventory.api.listProducts` | ✅ |
| `/branches/{branchId}/inventory/categories` | GET | `inventory.api.listCategories` | ✅ |
| `/branches/{branchId}/inventory/movements` | GET | `inventory.api.listMovements` | ✅ |
| `/inventory/products` | POST | `inventory.api.createProduct` | ✅ |
| `/inventory/products/{id}` | PATCH/DELETE | `inventory.api.*` | ✅ |
| `/inventory/categories` | POST/PATCH/DELETE | `inventory.api.*` | ✅ |
| `/inventory/movements` | POST | `inventory.api.createMovement` | ✅ |

---

## 7. POS (ventas)

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/pos/sales` | GET | `pos.api.listByBranch` | ✅ |
| `/pos/sales` | POST | `pos.api.create` | ✅ |
| `/pos/sales/{id}` | GET/PATCH/DELETE | `pos.api.*` | ✅ |
| `/pos/sales/{id}/checkout` | POST | `pos.api.checkout` | ✅ |
| `/pos/sales/{id}/checkout-split` | POST | `pos.api.checkoutSplit` | ✅ |
| `/pos/sales/{id}/dispatch-to-stations` | POST | `pos.api.dispatchToStations` | ✅ |
| `/pos/sales/{id}/delivery-status` | PATCH | `pos.api.updateDeliveryStatus` | ✅ |
| `/pos/operations-config` | GET | `pos.api.getOperationsConfig` | ✅ |
| `/branches/{branchId}/pos/tickets?saleId=` | GET | `pos.api.listKitchenTicketsBySale` | ✅ |

**Offline:** outbox replay para create/update/dispatch.

**Pantallas:** `pos-terminal` → `pos-table-floor` (`/pos/tables`) → `pos-order` → `pos-payment`  
**Legacy:** `/pos/select-zone` y `/pos/select-zone/:zoneId` redirigen a `pos-tables` (query `?zone=`).

---

## 8. Estaciones y cocina

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/stations` | GET | `stations.api.listByBranch` | ✅ |
| `/stations` | POST | `stations.api.createStation` | ✅ |
| `/stations/{id}` | GET/PATCH/DELETE | `stations.api.*` | ✅ |
| `/branches/{branchId}/pos/tickets` | GET | `stations.api.listTickets` | ✅ |
| `/pos/tickets` | POST | `stations.api.createTicket` | ✅ |
| `/pos/tickets/{id}` | PATCH/DELETE | `stations.api.*` | ✅ |

---

## 9. Pagos

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/payments` | GET | `payments.api.listByBranch` | ✅ |
| `/payments/{id}` | GET/PATCH/DELETE | `payments.api.*` | ✅ |
| `/payments` | POST | vía checkout POS principalmente | ✅ |
| `/payments/{id}/refunds` | POST | `payments.api.createRefund` | ✅ |
| `/payments/{id}/refunds/preview` | POST | preview reembolso | ✅ |
| `/payments/{id}/refunds` | GET | list refunds | ✅ |

---

## 10. Caja registradora

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/cash-register/sessions/open` | POST | `cash-register.api.openSession` | ✅ |
| `/cash-register/sessions/close` | POST | `cash-register.api.closeSession` | ✅ |
| `/branches/{branchId}/cash-register/sessions` | GET | list sessions | ✅ |
| `/branches/{branchId}/cash-register/sessions/open` | GET | `refreshOpenSession` | ✅ |
| `/cash-register/sessions/{id}/collectors-summary` | GET | resumen cobradores | ✅ |
| `/branches/{branchId}/cash-register/movements` | GET | list movements | ✅ |
| `/cash-register/movements` | POST | create movement | ✅ |
| `/cash-register/movements/{id}` | PATCH/DELETE | edit/delete | ✅ |

---

## 11. Reportes

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/reports` | GET | `reports.api.listByBranch` | ✅ |
| `/reports` | POST | `reports.api.create` (generate) | ✅ |
| `/reports/{id}` | GET/PATCH/DELETE | `reports.api.*` | ✅ |

**Precondición UI:** `employeeId` vinculado (`ensureEmployeeLink`).

**UX (PLAN-06 ✅):** En `/reports`, banner + botón "Generar reporte" deshabilitado si `!hasEmployeeLink`; `generate()` reintenta `ensureEmployeeLink` antes de fallar; mensaje unificado en `REPORTS_MESSAGES.EMPLOYEE_LINK_REQUIRED`.

---

## 12. Empleados (módulo users)

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/companies/{companyId}/employees` | GET | `users.api.listByCompany` | ✅ (OWNER) |
| `/branches/{branchId}/employees` | GET | `users.api.listByBranch` | ✅ (`BRANCH_ADMIN` con sucursal activa) |
| `/employees` | POST | `users.api.create` | ✅ |
| `/employees/{id}` | GET/PATCH/DELETE | `users.api.*` | ✅ |

---

## 13. Dashboard

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/branches/{branchId}/dashboard/metrics` | GET | `dashboard.api.getMetrics` | ✅ |
| `/branches/{branchId}/dashboard/comparison` | GET | `dashboard.api.getComparison` | ✅ |

**Query comparison:** `?date=YYYY-MM-DD&compare=yesterday|last_week|last_month`  
**Fallback:** agregación client-side (5 stores) si API falla | ✅ |

**Query opcional:** `?date=YYYY-MM-DD` (día operativo, zona `America/Lima`).

---

## 14. Communication

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/me/notifications` | GET/PATCH/DELETE | `notifications.api` | ✅ |
| `/me/notifications/unread-count` | GET | `notifications.api` | ✅ |
| `/me/push-tokens` | POST/DELETE | `push-tokens.api` | ✅ |
| `/conversations` | POST/GET/PATCH | — | 🔴 (sin módulo chat) |
| `/conversations/{id}/messages` | GET/POST | — | 🔴 |
| `/users/{id}/notifications` | * | — | N/A (reemplazado por BFF `/me/*`) |
| `/users/{id}/push-tokens` | * | — | N/A (reemplazado por BFF `/me/*`) |
| `/push-notifications` | POST | — | N/A (uso interno servidor) |
| `/email-notifications/*` | POST | — | N/A (password reset vía `CommunicationContextFacade`) |

**UI:** `notifications-bell.vue` en layout + STOMP `/topic/users/{id}/notifications` + FCM (PLAN-34 ✅).

---

## 15. Subscriptions (SaaS)

| Backend | Método | Frontend | Estado |
|---------|--------|----------|--------|
| `/platform/subscription-plans` | CRUD | `platform.api` + `platform-plans.vue` | ✅ |
| `/platform/subscription-requests` | GET + approve/reject | `platform-subscription-requests.vue` | ✅ |
| `/platform/companies/overview` | GET | `platform-companies.vue` | ✅ |
| `/companies/{id}/owner/subscription-summary` | GET | `company.api` + `company-subscription.vue` | ✅ |
| `/companies/{id}/owner/subscription-plans` | GET | `company.api` | ✅ |
| `/companies/{id}/owner/subscription` | POST | `company.store.choosePlan` | ✅ |
| `/subscriptions/companies` | POST | `platform.api.assignCompanySubscription` | ✅ |
| `/subscriptions/companies/{id}` | PATCH | `platform.api.updateCompanySubscription` | ✅ |
| `/subscriptions/companies/{id}` | DELETE | `platform.api.deleteCompanySubscription` | ✅ |

**Requisito API:** `gastrosuite.platform.enabled=true` (no `@Profile dev`; `@ConditionalOnProperty`).  
**Requisito web:** `VITE_PLATFORM_ENABLED=true` para rutas `/platform/*`.

---

## 16. Realtime WebSocket

| Backend | Frontend | Estado |
|---------|----------|--------|
| STOMP `/ws/operational` | `operational-socket.js` | ✅ |
| Topics `/topic/branch/{id}/{channel}` | `operational-event-dispatch.js` | ✅ |
| Topic `/topic/users/{id}/notifications` | `user-notifications-socket.js` | ✅ |

Canales operacionales: `kitchen`, `floor`, `cash`, `payments`, `reservations`.

---

## 17. Headers de integración

Todas las llamadas autenticadas (excepto `/auth/*` y bootstrap platform):

```http
Authorization: Bearer {gs_token}
X-Branch-Id: {gs_branch_id}
Content-Type: application/json
```

Definidos en: `shared/infrastructure/base-api.js`  
Storage keys: `shared/infrastructure/session-storage.js`

---

## 18. Endpoints backend sin consumidor web

| Grupo | Razón |
|-------|-------|
| `/api/v1/support/*` | Superficie admin duplicada; política: no usar desde web |
| **Chat** (`/conversations/*`) | Sin módulo FE (roadmap) |
| `/users/{id}/notifications` | Legacy; web usa `/me/*` |
| `/email-notifications/*` | Solo uso interno (SendGrid) |
| `/push-notifications` | Solo disparo servidor |
| `GET /companies` (listado crudo) | SYSTEM usa `/platform/companies/overview` |
| `/test/image-upload` | Solo dev backend |
| Billing/SUNAT | Bounded context no implementado |

---

## 19. Brechas operativas (integración)

| Brecha | Impacto | Estado / Plan |
|--------|---------|---------------|
| Transfer mesa no sync tickets backend | Cocina muestra mesa antigua | ✅ PLAN-31 |
| Checkout sin caja → error backend | UX: banner; pedidos permitidos por default | ✅ PLAN-33; configurable PLAN-45 |
| Ítems sin estación sin ticket | Líneas no visibles en cocina | ✅ PLAN-40 |
| Pago parcial → edición confusa | Usuario agrega ítems tras abono | ✅ PLAN-42 |
| Entitlements permisivos post-login | Flash de rutas premium | ✅ PLAN-43 |
| Comprobante UI vs SUNAT | Expectativa fiscal incorrecta | ✅ PLAN-44 |
| Cobro offline | Cola sin checkout | ✅ PLAN-48 v1 |
| PRODUCT_MIX solo UUIDs | Reporte ilegible | ✅ PLAN-41 |
| Venta no descuenta stock | Inventario desconectado | PLAN-32 diferido |
| Sin emisión SUNAT | Legal Perú | PLAN-17–19 (roadmap) |
| Chat / conversaciones | Sin UI mensajería | Roadmap communication |

---

## 20. Actualización de esta matriz

Al cerrar un ítem del ACTION-PLAN:

1. Cambiar estado en la fila correspondiente (🟡/🔴 → ✅).
2. Añadir fila si hay endpoint nuevo.
3. Actualizar porcentaje en encabezado.
4. Registrar en `gastro-suite-api/docs/KNOWLEDGE-BASE.md` → Changelog.

---

## Referencias

- [OPERATIONAL-VALIDATION.md](../gastro-suite-api/docs/OPERATIONAL-VALIDATION.md)
- [ACTION-PLAN.md](./ACTION-PLAN.md)
- [TECHNICAL.md](./TECHNICAL.md)
- `gastro-suite-api/docs/KNOWLEDGE-BASE.md`
- OpenAPI: http://localhost:8080/scalar
