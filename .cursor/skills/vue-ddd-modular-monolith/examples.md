# Ejemplos — Gastro Suite Web

## Presentation delgada (dashboard)

**Antes:** vista importa `iam`, `branches`, `domain`, helpers de application.

**Después:** solo `useDashboardStore()` + composables shared.

```javascript
// dashboard.store.js expone:
// isOwner, ownerBranchOptions, bootstrapOwnerView, formatRelativeTime, compareOptionsForEntitlements
```

## Facade users

```javascript
// users.facade.js
export function useUsersFacade() {
    const branchesStore = useBranchesStore();
    const iamStore = useIamStore();
    return {
        branchOptions: computed(() => branchesStore.activeBranches.map(...)),
        assignableRolesForPlan: (ent) => iamStore.assignableRoles.filter(...),
        bootstrapManagement: () => Promise.all([branchesStore.fetchAll(), iamStore.loadRolesCatalog()]),
    };
}
```

## POS sin assemblers ajenos

```javascript
// pos.store.js — delegación
stationsStore.ticketFromResource(r)
paymentsStore.toCheckoutBffResource(draft)
// NO: import StationTicketAssembler from stations/infrastructure
```

## Cash register — display vía store

```javascript
// cash-register.store.js re-exporta:
movementOrderLabel, movementDescriptionText, exportCashMovementsExcel, buildSessionSummaryRows
// session-movements-table.vue: store.movementOrderLabel(mov)
```

## Communication rename

```
notifications.store.js → communication.store.js (alias deprecado useNotificationsStore)
```

## Platform NON-COMPLIANT → COMPLIANT

```
platform/domain/models/*.entity.js
platform/infrastructure/assemblers/*.assembler.js
platform.store.js usa assemblers, no response.data crudo
```

## Shell facade (layout + bootstrap)

```javascript
// shared/application/shell.facade.js — único punto cross-module para public/ y shared/presentation
export function useShellFacade() {
    const iamStore = useIamStore();
    const companyStore = useCompanyStore();
    // ...
    return {
        userRole: computed(() => iamStore.userRole),
        logout: () => iamStore.logout(),
        fetchSubscriptionSummary: () => companyStore.fetchSubscriptionSummary(),
        // ...
    };
}

// public/presentation/views/layout.vue
import { useShellFacade } from '../../../shared/application/shell.facade.js';
const shell = useShellFacade();
```

## Audit scripts

```bash
npm run audit:architecture
npm run verify:modules   # 15/15 módulos feature
# ✅ sin violaciones
```

Violaciones típicas detectadas:

- `presentation→infrastructure`
- `application→foreign-infrastructure`
- `shared-legacy-path` (shared/composables, shared/utils)
- `shared-application→presentation`
