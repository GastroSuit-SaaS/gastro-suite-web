import { computed } from 'vue';
import { getActivePinia } from 'pinia';
import { useIamStore } from '../../iam/application/iam.store.js';
import { useCompanyStore } from '../../company/application/company.store.js';
import { useBranchesStore } from '../../branches/application/branches.store.js';
import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';
import { usePosStore } from '../../pos/application/pos.store.js';
import { useMenuStore } from '../../menu/application/menu.store.js';
import { useTablesStore } from '../../tables/application/tables.store.js';
import { useStationsStore } from '../../stations/application/stations.store.js';
import { useCommunicationStore } from '../../communication/application/communication.store.js';
import { usePlatformStore } from '../../platform/application/platform.store.js';
import { useInventoryStore } from '../../inventory/application/inventory.store.js';

/**
 * Orquestación cross-module para shell (`public/` + `shared/presentation`).
 * Único punto de acceso a stores ajenos desde layout, toolbar, banners y bootstrap.
 */
export function useShellFacade() {
    const iamStore = useIamStore();
    const companyStore = useCompanyStore();
    const branchesStore = useBranchesStore();
    const cashRegisterStore = useCashRegisterStore();
    const posStore = usePosStore();
    const menuStore = useMenuStore();
    const tablesStore = useTablesStore();
    const stationsStore = useStationsStore();
    const communicationStore = useCommunicationStore();
    const platformStore = usePlatformStore();
    const inventoryStore = useInventoryStore();

    return {
        isAuthenticated: computed(() => iamStore.isAuthenticated),
        userRole: computed(() => iamStore.userRole),
        currentUser: computed(() => iamStore.currentUser),
        token: computed(() => iamStore.token),
        hasBranchSelected: computed(() => iamStore.hasBranchSelected),
        activeBranchId: computed(() => iamStore.activeBranchId),
        activeBranchName: computed(() => iamStore.activeBranchName),
        isOwner: computed(() => iamStore.isOwner),
        companyId: computed(() => iamStore.companyId),
        hasEmployeeLink: computed(() => iamStore.hasEmployeeLink),
        employeeLinkStatus: computed(() => iamStore.employeeLinkStatus),
        employeeLinkMessage: computed(() => iamStore.employeeLinkMessage),

        logout: () => iamStore.logout(),
        ensureEmployeeLink: () => iamStore.ensureEmployeeLink(),
        selectBranch: (branchId, branchName) => iamStore.selectBranch(branchId, branchName),
        clearBranch: () => iamStore.clearBranch(),
        loadRolesCatalog: () => iamStore.loadRolesCatalog(),

        features: computed(() => companyStore.features),
        subscriptionSummary: computed(() => companyStore.subscriptionSummary),
        subscriptionFetchAttempted: computed(() => companyStore.subscriptionFetchAttempted),
        inGracePeriod: computed(() => companyStore.inGracePeriod),
        fetchSubscriptionSummary: () => companyStore.fetchSubscriptionSummary(),

        branchItems: computed(() => branchesStore.items),
        activeBranches: computed(() => branchesStore.activeBranches),
        branchesIsLoading: computed(() => branchesStore.isLoading),
        fetchBranches: () => branchesStore.fetchAll(),

        hasOpenSession: computed(() => cashRegisterStore.hasOpenSession),
        currentCashSession: computed(() => cashRegisterStore.currentSession),
        collectorSummary: computed(() => cashRegisterStore.collectorSummary),
        refreshOpenSession: () => cashRegisterStore.refreshOpenSession(),

        getPosCurrentSale: () => {
            const pinia = getActivePinia();
            if (!pinia) return null;
            try {
                return usePosStore(pinia).currentSale;
            } catch {
                return null;
            }
        },
        syncOfflineQueue: () => posStore.syncOfflineQueue(),
        loadPosOperationsConfig: () => posStore.loadOperationsConfig(),
        fetchPosSales: () => posStore.fetchAll(),
        setPosSyncError: (message) => {
            posStore.error = posStore.error ?? message;
        },

        fetchMenuAll: () => menuStore.fetchAll(),
        fetchTablesAll: () => tablesStore.fetchAll(),
        fetchStationsAll: () => stationsStore.fetchAll(),

        fetchUnreadCount: () => communicationStore.fetchUnreadCount(),
        startNotificationsPolling: () => communicationStore.startPolling(),
        stopNotificationsPolling: () => communicationStore.stopPolling(),
        registerPushTokenIfAvailable: () => communicationStore.registerPushTokenIfAvailable(),

        reloadPendingRequests: () => platformStore.reloadPendingRequests(),
        reloadPlatformDashboard: () => platformStore.reloadDashboard(),

        lowStockProducts: computed(() => inventoryStore.lowStockProducts),
        outOfStockProducts: computed(() => inventoryStore.outOfStockProducts),
        fetchInventoryAll: () => inventoryStore.fetchAll(),
    };
}
