import { useMenuStore } from '../../menu/application/menu.store.js';

/**
 * Orquestación stations → menu.
 */
export function useStationsFacade() {
    const menuStore = useMenuStore();

    async function ensureMenuLoaded() {
        await menuStore.fetchAll().catch(() => {});
    }

    function availableMenuItemsCount(stationId) {
        return menuStore.items.filter((i) => i.isAvailable && i.stationId === stationId).length;
    }

    return {
        ensureMenuLoaded,
        availableMenuItemsCount,
    };
}
