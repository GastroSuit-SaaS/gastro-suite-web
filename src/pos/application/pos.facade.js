import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';
import { useStationsStore } from '../../stations/application/stations.store.js';
import { useTablesStore } from '../../tables/application/tables.store.js';
import { useInventoryStore } from '../../inventory/application/inventory.store.js';
import { buildPosHubAlerts } from './pos-hub-alerts.builder.js';

/**
 * Lecturas cross-module para el hub POS. Solo stores — nunca assemblers externos.
 */
export function usePosFacade() {
    const cashRegisterStore = useCashRegisterStore();
    const stationsStore = useStationsStore();
    const tablesStore = useTablesStore();
    const inventoryStore = useInventoryStore();

    async function bootstrapHubData(entitlements) {
        const today = new Date().toISOString().slice(0, 10);
        const tasks = [];
        if (entitlements?.hasKitchen) {
            tasks.push(stationsStore.fetchAll?.().catch(() => {}));
        }
        if (entitlements?.hasInventory) {
            tasks.push(inventoryStore.fetchAll?.().catch(() => {}));
        }
        if (entitlements?.hasReservations) {
            tasks.push(tablesStore.fetchByDateSilent?.(today).catch(() => {}));
        }
        await Promise.all(tasks);
    }

    function hubAlerts({ activeOrdersCount = 0, entitlements = null } = {}) {
        return buildPosHubAlerts({
            cashRegisterStore,
            stationsStore,
            tablesStore,
            inventoryStore,
            activeOrdersCount,
            entitlements,
        });
    }

    return {
        bootstrapHubData,
        hubAlerts,
    };
}
