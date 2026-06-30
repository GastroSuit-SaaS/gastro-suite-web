import { computed } from 'vue';
import { useStationsStore } from '../../stations/application/stations.store.js';

/**
 * Orquestación menu → stations.
 */
export function useMenuFacade() {
    const stationsStore = useStationsStore();

    const stationSelectOptions = computed(() =>
        stationsStore.activeStations.map((s) => ({
            label: s.name,
            value: s.id,
        })),
    );

    const activeStations = computed(() => stationsStore.activeStations);

    async function fetchStationsIfNeeded() {
        await stationsStore.fetchStations();
    }

    return {
        stationSelectOptions,
        activeStations,
        fetchStationsIfNeeded,
    };
}
