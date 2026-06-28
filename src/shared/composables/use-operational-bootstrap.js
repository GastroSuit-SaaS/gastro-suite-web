import { watch, onMounted, onUnmounted } from 'vue';
import { useIamStore } from '../../iam/application/iam.store.js';
import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';
import { usePosStore } from '../../pos/application/pos.store.js';
import { useMenuStore } from '../../menu/application/menu.store.js';
import { useTablesStore } from '../../tables/application/tables.store.js';
import { useStationsStore } from '../../stations/application/stations.store.js';
import { requiresBranch } from '../presentation/constants/roles.constants.js';
import { useRoute } from 'vue-router';
import { BRANCH_CHANGED_EVENT } from '../application/branch-switch.js';

const REFRESH_MS = 45_000;

/**
 * Sincroniza turno de caja central al operar en módulos con sucursal activa.
 */
export function useOperationalBootstrap() {
    const iamStore = useIamStore();
    const cashStore = useCashRegisterStore();
    const posStore  = usePosStore();
    const route = useRoute();

    let intervalId = null;

    async function refreshCashRegister() {
        if (!iamStore.hasBranchSelected) return;
        const path = route.path;
        if (!requiresBranch(path) && !path.startsWith('/dashboard')) return;
        try {
            await iamStore.ensureEmployeeLink();
            await Promise.all([
                cashStore.refreshOpenSession(),
                posStore.loadOperationsConfig(),
            ]);
        } catch {
            /* el módulo mostrará error propio si aplica */
        }
    }

    function onVisibilityChange() {
        if (document.visibilityState === 'visible') {
            refreshCashRegister();
        }
    }

    async function onNetworkOnline() {
        const menuStore = useMenuStore();
        const tablesStore = useTablesStore();
        const stationsStore = useStationsStore();
        try {
            const { replayed, failed } = await posStore.syncOfflineQueue();
            if (failed) {
                posStore.error = posStore.error ?? 'No se pudieron sincronizar todas las operaciones pendientes.';
            }
            await Promise.all([
                menuStore.fetchAll(),
                tablesStore.fetchAll(),
                stationsStore.fetchAll(),
                posStore.loadOperationsConfig(),
            ]);
            if (replayed > 0) {
                await posStore.fetchAll();
            }
        } catch { /* cada módulo muestra error propio si aplica */ }
    }

    onMounted(() => {
        refreshCashRegister();
        intervalId = window.setInterval(refreshCashRegister, REFRESH_MS);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('gastro:network-online', onNetworkOnline);
        window.addEventListener(BRANCH_CHANGED_EVENT, refreshCashRegister);
    });

    onUnmounted(() => {
        if (intervalId) window.clearInterval(intervalId);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('gastro:network-online', onNetworkOnline);
        window.removeEventListener(BRANCH_CHANGED_EVENT, refreshCashRegister);
    });

    watch(() => iamStore.activeBranchId, refreshCashRegister);
}
