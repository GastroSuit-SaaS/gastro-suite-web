# Plan de Acción — Cierre de Brechas

> **Última actualización:** 2026-06-27 (Sprints 1–3 cerrados — espejo API)  
> **Progreso global:** 22 / 37 ítems completados (59%) · ver detalle en `gastro-suite-api/docs/ACTION-PLAN.md`  
> **Plan ejecutivo:** `gastro-suite-api/docs/GAP-CLOSURE-PLAN.md`  
> **Validación operativa:** `gastro-suite-api/docs/OPERATIONAL-VALIDATION.md`  
> **Guía detallada (pasos, archivos, contratos, tests):** [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)  
> **Documento espejo:** `gastro-suite-web/docs/ACTION-PLAN.md`

## Cómo usar este documento

1. Al **iniciar** un ítem: cambiar `[ ]` → `[~]` y anotar fecha en *Inicio*.
2. Al **completar**: cambiar `[~]` → `[x]`, anotar *Fin* y archivos tocados.
3. Actualizar **Progreso global** en el encabezado.
4. Registrar en `KNOWLEDGE-BASE.md` → sección **Changelog**.
5. Actualizar `INTEGRATION.md` si cambia estado de integración.

**Leyenda:** `[ ]` Pendiente · `[~]` En progreso · `[x]` Completado · `[—]` Cancelado/diferido

---

## Resumen por fase

| Fase | Descripción | Ítems | Completados |
|------|-------------|-------|-------------|
| F0 | MVP operativo (POS / inventario / auth) | 6 | 4 |
| F0b | Operación restaurante (post-análisis 2026-06-27) | 5 | 0 |
| F1 | Integración inmediata | 6 | 6 |
| F2 | Deuda arquitectónica | 6 | 0 |
| F3 | Administración SaaS | 4 | 0 |
| F4 | Producto Perú (SUNAT) | 4 | 0 |
| F5 | Producción hardening | 4 | 0 |

---

## Fase 0 — MVP operativo (prioridad inmediata)

Trabajo de operación diaria completado en sesiones recientes. No estaba en el plan original de brechas.

### PLAN-25 — Canales POS: delivery + pago parcial

- [x] **Estado:** Completado · **Esfuerzo:** L (3–5d) · **Repos:** api + web
- **Backend:** `SaleChannel`, `DeliveryStatus`, `PARTIALLY_PAID`; agregado `Sale`; BFF checkout/dispatch; `PATCH .../delivery-status`
- **Frontend:** `sale.entity`, assembler, `pos.store`; terminal, order, payment, filtros hub
- **Docs:** `docs/DELIVERY-FLOW.md`
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27
- **Verificación:** compile API · `npm run build` web

### PLAN-26 — Inventario: editar/eliminar movimientos + stock

- [x] **Estado:** Completado · **Esfuerzo:** M (1–2d) · **Repos:** api + web
- **Backend:** `UpdateInventoryMovementCommandUseCase` y `DeleteInventoryMovementCommandUseCase` revierten/aplican stock del producto
- **Frontend:** `updateMovement`/`deleteMovement` API; store; `register-stock-movement.vue` modo edición; acciones en `inventory-management.vue`; `low-stock-status-banner.vue` en layout
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27

### PLAN-27 — Auth tenant JWT (`UserPrincipal`)

- [x] **Estado:** Completado · **Esfuerzo:** M (1d) · **Repos:** api + web
- **Problema:** Login OK pero rutas con tenant en path (`/companies/{id}/branches`) → 401; `/roles` pasaba
- **Backend:** `TenantAccessService` reconoce `UserPrincipal`; `TenantAccessRequestFilter`; `WebSecurityConfiguration` — solo sign-in/sign-up/register-owner públicos; test `TenantAccessServiceTest`
- **Frontend:** `base-api.js` rutas públicas acotadas; logout 401 solo si había token; `roles.api.js` `skipSessionLogout`; `loadRolesCatalog()` no bloquea login
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27
- **Pendiente validación:** ✅ smoke test 2026-06-27 — sign-in + `/companies/{id}/branches` → 200

### PLAN-28 — UX POS y contraste estilos base

- [x] **Estado:** Completado · **Esfuerzo:** S (2–4h) · **Repos:** web
- **Estilos:** `surface-text.css`, tokens `--text-on-light` en `variables.css`; clases `.text-color` / `.text-color-secondary`
- **POS:** header delivery simplificado (1 chip); dirección en panel orden; fix “Pendiente” duplicado; fix “Orden #30” (`orderPanelMeta`)
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27

### PLAN-29 — RBAC restante + tests integración tenant

- [x] **Estado:** Completado (api) · **Inicio:** 2026-06-27 | **Fin:** 2026-06-27

### PLAN-30 — SubscriptionLimitService (límites SaaS)

- [x] **Estado:** Completado · banner gracia en `layout.vue` · **Fin:** 2026-06-27

---

## Fase 0b — Operación restaurante (post-análisis arquitectónico)

Ver `gastro-suite-api/docs/OPERATIONAL-VALIDATION.md`.

### PLAN-31 — Orquestación transferencia de mesa (BFF)

- [x] **Estado:** Completado · `pos.api.js` → `POST .../transfer-table` · **Fin:** 2026-06-27

### PLAN-32 — Recetas menú → descuento inventario

- [—] **Estado:** Diferido

### PLAN-33 — Bloqueo UI checkout sin caja abierta

- [x] **Estado:** Completado · `pos-payment.vue` · **Fin:** 2026-06-27

### PLAN-34 — Módulo frontend Communication

- [x] **Estado:** Completado · `src/communication/` + campana toolbar · **Fin:** 2026-06-27

### PLAN-35 — Reporte ventas por método de pago

- [x] **Estado:** Completado · `reports-home.vue` + export CSV/Excel · **Fin:** 2026-06-27

---

## Fase 1 — Integración inmediata (prioridad alta)

Brechas con backend listo o UI a medias. Impacto directo en operación diaria.

### PLAN-01 — Subida de imágenes en menú

- [x] **Estado:** Completado · **Esfuerzo:** S (2–4h) · **Detalle:** [IMPLEMENTATION-PLAN § PLAN-01](./IMPLEMENTATION-PLAN.md#plan-01--subida-de-imágenes-en-menú)
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27
- **Archivos:** `menu.api.js`, `menu.store.js`, `menu-management.vue`
- **Verificación:** `npm run build` OK

### PLAN-02 — Recuperación de contraseña

- [x] **Estado:** Completado · **Esfuerzo:** L (2–3d) · **Repos:** api + web
- **Backend:** `POST /auth/forgot-password`, `POST /auth/reset-password`
- **Frontend:** `iam.api`, `iam.store`, `forgot-password.vue`, `reset-password.vue`
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27

### PLAN-03 — Dashboard: decidir estrategia

- [x] **Estado:** Completado
- **Decisión:** Opción B — BFF `GET /branches/{branchId}/dashboard/metrics` + fallback client-side con contrato `OperationalMetrics` anidado
- **Contrato:** `sales`, `diningRoom`, `kitchen`, `cashRegister`, `inventory` (zona `America/Lima`)
- **Criterio de done:** Decisión documentada + código alineado (sin API fantasma)
- **Repos:** api + web
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27
- **Archivos:** `dashboard.api.js`, `dashboard-metric.entity.js`, `dashboard-metric.assembler.js`, `dashboard-metrics.builder.js`, `dashboard.store.js`, `dashboard-home.vue`
- **Verificación:** `npm run build` OK

### PLAN-04 — Sincronizar catálogo de roles

- [x] **Estado:** Completado
- **Brecha:** Frontend hardcodea roles; backend expone `GET /api/v1/roles`
- **Frontend:** `loadRolesCatalog()` en IAM store; UI usuarios usa `assignableRoles` + fallback
- **Criterio de done:** Roles en UI coinciden con backend; sin drift silencioso
- **Repos:** web
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27
- **Archivos:** `roles.api.js`, `role.assembler.js`, `iam.store.js`, `layout.vue`, `users-management.vue`, `create-and-edit-user.vue`, `users.constants-ui.js`
- **Verificación:** `npm run build` OK

### PLAN-05 — Limpiar ruta reset-password huérfana

- [x] **Estado:** Completado (PLAN-02)
- **Frontend:** `reset-password.vue` en `iam.routes.js`
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27

### PLAN-06 — Verificar employee-link en reportes

- [x] **Estado:** Completado
- **Brecha:** `reports.store.generate()` exige `employeeId`; validar UX del banner
- **Criterio de done:** Flujo documentado; mensaje claro si falta vínculo
- **Repos:** web
- **Inicio:** 2026-06-27 | **Fin:** 2026-06-27
- **Archivos:** `iam.store.js`, `employee-link-status-banner.vue`, `reports-home.vue`, `reports.store.js`, `reports.constants-ui.js`
- **Verificación:** `npm run build` OK

---

## Fase 2 — Deuda arquitectónica

### PLAN-07 — Flyway + baseline schema

- [ ] **Estado:** Pendiente
- **Brecha:** Flyway disabled; `ddl-auto: update` en dev
- **Acción:** Habilitar Flyway, baseline V1, `ddl-auto: validate` en prod
- **Criterio de done:** `./mvnw flyway:migrate` crea schema idéntico al actual
- **Repos:** api
- **Inicio:** — | **Fin:** —

### PLAN-08 — Tests integración flujos críticos

- [ ] **Estado:** Pendiente
- **Brecha:** ~10 test classes / ~1295 archivos
- **Prioridad:** checkout POS, register-owner, open/close caja, refunds
- **Base existente:** `ControllerIntegrationTestBase`, Testcontainers
- **Criterio de done:** ≥4 tests integración verdes en CI
- **Repos:** api
- **Inicio:** — | **Fin:** —

### PLAN-09 — Deprecar/documentar API `/support/*`

- [ ] **Estado:** Pendiente
- **Brecha:** ~90 endpoints duplicados
- **Acción:** Marcar deprecated en OpenAPI o mover a módulo admin separado
- **Criterio de done:** Documento de política API; web confirmado sin uso
- **Repos:** api
- **Inicio:** — | **Fin:** —

### PLAN-10 — Autorización declarativa

- [ ] **Estado:** Pendiente
- **Brecha:** Solo `OperationalAuthorizationService` programático
- **Acción:** Evaluar `@PreAuthorize` en controllers BFF sensibles
- **Criterio de done:** Pagos, caja y reservas con doble capa (filtro + método)
- **Repos:** api
- **Inicio:** — | **Fin:** —

### PLAN-11 — Tests frontend (Vitest)

- [ ] **Estado:** Pendiente
- **Brecha:** Sin script `test` en `package.json`
- **Prioridad:** stores POS, payments, iam guard
- **Criterio de done:** `npm test` en CI con ≥3 suites
- **Repos:** web
- **Inicio:** — | **Fin:** —

### PLAN-12 — Corregir typos package (opcional)

- [ ] **Estado:** Pendiente
- **Brecha:** `shared/intefaces`, `shared/infrustructure`
- **Acción:** Refactor coordinado o documentar como permanente
- **Criterio de done:** Decisión registrada en KNOWLEDGE-BASE
- **Repos:** api + web
- **Inicio:** — | **Fin:** —

---

## Fase 3 — Administración SaaS

### PLAN-13 — UI Subscriptions

- [ ] **Estado:** Pendiente
- **Backend:** `/api/v1/subscriptions`, `/subscriptions/companies`
- **Frontend:** Nuevo módulo o sección en branches/settings (OWNER)
- **Criterio de done:** CRUD suscripción empresa visible para OWNER
- **Repos:** web (+ api si faltan campos BFF)
- **Inicio:** — | **Fin:** —

### PLAN-14 — Gestión de empresa post-onboarding

- [ ] **Estado:** Pendiente
- **Backend:** `PATCH/DELETE /companies/{id}` existentes
- **Frontend:** Pantalla edición datos fiscales empresa
- **Criterio de done:** OWNER puede actualizar RUC, razón social, etc.
- **Repos:** web
- **Inicio:** — | **Fin:** —

### PLAN-15 — Admin entidad User (opcional)

- [ ] **Estado:** Pendiente
- **Backend:** `/support/users` CRUD
- **Frontend:** Hoy solo `Employee`; evaluar gestión username/password
- **Criterio de done:** Decisión producto + implementación mínima si aplica
- **Repos:** api + web
- **Inicio:** — | **Fin:** —

### PLAN-16 — Multi-sucursal OWNER UX

- [ ] **Estado:** Pendiente
- **Acción:** Revisar `select-branch`, `branch-switcher`, persistencia contexto
- **Criterio de done:** Cambio sucursal no pierde estado crítico; documentado
- **Repos:** web
- **Inicio:** — | **Fin:** —

---

## Fase 4 — Producto Perú (SUNAT / Billing)

### PLAN-17 — Diseño bounded context Billing

- [ ] **Estado:** Pendiente
- **Brecha:** README promete SUNAT; sin código
- **Acción:** ADR con agregados (Comprobante, Serie, Tributos), integración OSE/SUNAT
- **Criterio de done:** ADR aprobado en `docs/adr/`
- **Repos:** api
- **Inicio:** — | **Fin:** —

### PLAN-18 — Emisión boleta/factura MVP

- [ ] **Estado:** Pendiente
- **Depende:** PLAN-17
- **Criterio de done:** POST comprobante desde checkout POS (ambiente beta SUNAT)
- **Repos:** api + web
- **Inicio:** — | **Fin:** —

### PLAN-19 — Notas de crédito

- [ ] **Estado:** Pendiente
- **Depende:** PLAN-18
- **Criterio de done:** NC vinculada a refund de pago
- **Repos:** api + web
- **Inicio:** — | **Fin:** —

### PLAN-20 — Domain events operativos

- [ ] **Estado:** Pendiente
- **Acción:** Eventos SalePaid, TicketReady → desacoplar STOMP y reportes async
- **Criterio de done:** ≥2 eventos con handlers sin acoplamiento directo BFF
- **Repos:** api
- **Inicio:** — | **Fin:** —

---

## Fase 5 — Producción hardening

### PLAN-21 — Refresh token JWT

- [ ] **Estado:** Pendiente
- **Brecha:** Token 7 días, logout solo por 401
- **Criterio de done:** Refresh flow + rotación documentada
- **Repos:** api + web
- **Inicio:** — | **Fin:** —

### PLAN-22 — Observabilidad checkout/offline

- [ ] **Estado:** Pendiente
- **Acción:** Métricas Actuator custom (outbox replay, checkout failures)
- **Criterio de done:** Dashboard ops o logs estructurados
- **Repos:** api + web
- **Inicio:** — | **Fin:** —

### PLAN-23 — README web actualizado

- [ ] **Estado:** Pendiente
- **Brecha:** README default Vue template
- **Criterio de done:** README con setup, env vars, deploy Cloudflare
- **Repos:** web
- **Inicio:** — | **Fin:** —

### PLAN-24 — Alinear README API con realidad

- [ ] **Estado:** Pendiente
- **Brecha:** SUNAT listado como existente
- **Criterio de done:** README distingue "roadmap" vs "implementado"
- **Repos:** api
- **Inicio:** — | **Fin:** —

---

## Registro de sesiones (opcional)

| Fecha | Ítems trabajados | Notas |
|-------|------------------|-------|
| 2026-06-27 | — | Creación del plan. Análisis arquitectónico inicial. |
| 2026-06-27 | PLAN-03, PLAN-04, PLAN-06 | Dashboard BFF, roles API, employee-link reportes. |
| 2026-06-27 | PLAN-02, PLAN-05 | Forgot/reset password FE+BE. PLAN-27 validado. |
| 2026-06-27 | **Análisis arquitectónico** | KB/INTEGRATION/TECHNICAL + `OPERATIONAL-VALIDATION.md`; PLAN-31–35. |
| 2026-06-27 | **Sprints 1–3 cerrados** | Espejo API: platform, company, communication, POS, reports, branch-switch. |

---

## Orden de ejecución recomendado (2026-06-27)

**Sprints 1–3 — ✅ Completados** (detalle en `gastro-suite-api/docs/GAP-CLOSURE-PLAN.md`)

**Siguiente fase (pre-producción):** PLAN-07 · PLAN-11 (Vitest) · PLAN-23 (README web) · PLAN-37 (Stripe) cuando aplique

---

## Métricas objetivo

| Métrica | Actual | Objetivo F1 | Objetivo final |
|---------|--------|-------------|----------------|
| Integración E2E núcleo | ~78–82% | ~88% | ~95% |
| Integración visión producto | ~58–62% | ~65% | ~85% |
| Operación diaria completa | ~55% | ~70% | ~90% |
| SaaS comercial | ~15–20% | ~40% | ~85% |
| Tests backend (suites CI) | 12 | 15 | 30+ |
| Tests frontend | 0 | 3 | 15+ |
| Ítems plan completados | 22/37 | 32/37 | — |
