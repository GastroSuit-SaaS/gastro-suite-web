import { watch, onMounted, onUnmounted } from 'vue';
import { useShellFacade } from '../../application/shell.facade.js';
import { requiresBranch } from '../../domain/roles.js';
import { useRoute } from 'vue-router';
import { BRANCH_CHANGED_EVENT } from '../../application/branch-switch.js';

const REFRESH_MS = 45_000;

/**
 * Sincroniza turno de caja central al operar en módulos con sucursal activa.
 */
export function useOperationalBootstrap() {
    const shell = useShellFacade();
    const route = useRoute();

    let intervalId = null;

    async function refreshCashRegister() {
        if (!shell.hasBranchSelected.value) return;
        const path = route.path;
        if (!requiresBranch(path) && !path.startsWith('/dashboard')) return;
        try {
            await shell.ensureEmployeeLink();
            await Promise.all([
                shell.refreshOpenSession(),
                shell.loadPosOperationsConfig(),
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
        try {
            const { replayed, failed } = await shell.syncOfflineQueue();
            if (failed) {
                shell.setPosSyncError('No se pudieron sincronizar todas las operaciones pendientes.');
            }
            await Promise.all([
                shell.fetchMenuAll(),
                shell.fetchTablesAll(),
                shell.fetchStationsAll(),
                shell.loadPosOperationsConfig(),
            ]);
            if (replayed > 0) {
                await shell.fetchPosSales();
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

    watch(() => shell.activeBranchId.value, refreshCashRegister);
}
