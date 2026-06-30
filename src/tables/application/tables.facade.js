import { computed } from 'vue';
import { usePosStore } from '../../pos/application/pos.store.js';

/**
 * Orquestación tables → POS. Presentation de tables no importa pos.store directamente.
 */
export function useTablesFacade() {
    const posStore = usePosStore();

    const activePosConsumption = computed(() => posStore.totalInProcess);

    function saleByTableId(tableId) {
        return posStore.saleByTableId(tableId);
    }

    function openSaleForTable(tableId, zoneId, seatedGuests = 0) {
        return posStore.openSaleForTable(tableId, zoneId, seatedGuests);
    }

    function getCurrentPosSale() {
        return posStore.currentSale;
    }

    return {
        activePosConsumption,
        saleByTableId,
        openSaleForTable,
        getCurrentPosSale,
    };
}
