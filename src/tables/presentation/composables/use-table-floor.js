import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTablesStore } from '../../application/tables.store.js'
import { usePosStore } from '../../../pos/application/pos.store.js'
import { useDateFormatter } from '../../../shared/composables/use-date-formatter.js'

export function useTableFloor() {
    const store = useTablesStore()
    const posStore = usePosStore()
    const { elapsedTime } = useDateFormatter()

    const now = ref(Date.now())
    let clockInterval = null

    onMounted(() => {
        clockInterval = setInterval(() => { now.value = Date.now() }, 30_000)
    })

    onUnmounted(() => {
        clearInterval(clockInterval)
    })

    const zoneColorMap = computed(() => {
        const map = {}
        store.allZones.forEach((z) => { map[z.id] = { color: z.color, name: z.name } })
        return map
    })

    const tableSearch = ref('')
    const selectedStatus = ref(null)
    const activeConsumption = computed(() => posStore.totalInProcess)
    const occupancyRate = computed(() => store.occupancyRate)

    const zoneFilterOptions = computed(() => [
        { label: `Todas las Zonas (${store.totalTables})`, value: '__all__', color: null },
        ...store.zones.map((z) => ({
            label: `${z.name} (${z.tableCount})`,
            value: z.id,
            color: z.color,
        })),
    ])

    const selectedZoneFilter = computed({
        get: () => store.selectedZoneId ?? '__all__',
        set: (val) => store.selectZone(val === '__all__' ? null : val),
    })

    const filteredAndSearched = computed(() => {
        let base = store.filteredTables
        if (selectedStatus.value) base = base.filter((t) => t.status === selectedStatus.value)
        if (!tableSearch.value.trim()) return base
        const q = tableSearch.value.trim().toLowerCase()
        return base.filter((t) => String(t.number).toLowerCase().includes(q))
    })

    function toggleStatus(status) {
        selectedStatus.value = selectedStatus.value === status ? null : status
    }

    function urgencyClass(table) {
        const _ = now.value
        const level = table.urgencyLevel
        return level !== 'ok' ? `table-card--${level}` : ''
    }

    return {
        store,
        posStore,
        elapsedTime,
        tableSearch,
        selectedStatus,
        zoneColorMap,
        zoneFilterOptions,
        selectedZoneFilter,
        filteredAndSearched,
        activeConsumption,
        occupancyRate,
        toggleStatus,
        urgencyClass,
    }
}
