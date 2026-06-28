<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTablesStore } from '../../../tables/application/tables.store.js'
import { usePosStore } from '../../application/pos.store.js'
import { posOrderRoute } from '../constants/pos.constants-ui.js'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'
import TableFloorPanel from '../../../tables/presentation/components/table-floor-panel.vue'
import AssignTableDialog from '../../../tables/presentation/views/assign-table-dialog.vue'

const route = useRoute()
const router = useRouter()
const store = useTablesStore()
const posStore = usePosStore()

const showAssignDialog = ref(false)
const assigningTable = ref(null)
let syncingFromRoute = false

function applyRouteZone() {
    const zone = route.query.zone
    syncingFromRoute = true
    if (zone != null && zone !== '' && zone !== '__all__') {
        store.selectZone(zone)
    } else {
        store.selectZone(null)
    }
    syncingFromRoute = false
}

function syncZoneToRoute(zoneId) {
    if (syncingFromRoute) return

    const nextQuery = { ...route.query }
    if (zoneId != null && zoneId !== '') {
        nextQuery.zone = String(zoneId)
    } else {
        delete nextQuery.zone
    }

    const current = route.query.zone ?? null
    const next = nextQuery.zone ?? null
    if (String(current ?? '') === String(next ?? '')) return

    router.replace({ name: 'pos-tables', query: nextQuery })
}

onMounted(async () => {
    await Promise.all([
        store.tables.length ? Promise.resolve() : store.fetchAll(),
        posStore.sales.length ? Promise.resolve() : posStore.fetchAll(),
    ])
    applyRouteZone()
})

watch(() => route.query.zone, applyRouteZone)
watch(() => store.selectedZoneId, syncZoneToRoute)

function openAssignTable(table) {
    assigningTable.value = table
    showAssignDialog.value = true
}

async function onAssignConfirm({ guests }) {
    const table = assigningTable.value
    if (!table) return
    const sale = await posStore.openSaleForTable(table.id, table.zoneId, guests)
    if (sale?.id) router.push(posOrderRoute(sale.id))
    assigningTable.value = null
}

async function openOrderForTable(table) {
    const sale = await posStore.openSaleForTable(table.id, table.zoneId, table.seatedGuests)
    if (sale?.id) router.push(posOrderRoute(sale.id))
}
</script>

<template>
    <div class="pos-table-floor p-4">
        <module-state-feedback
            :loading="store.isLoading"
            :error="store.error"
            loading-label="Cargando mesas…"
            @retry="store.fetchAll()"
        >
            <table-floor-panel
                @assign="openAssignTable"
                @open-order="openOrderForTable"
            />
        </module-state-feedback>
    </div>

    <AssignTableDialog
        v-model:visible="showAssignDialog"
        :table="assigningTable"
        @assigned="onAssignConfirm"
    />
</template>

<style scoped>
.pos-table-floor {
    min-height: 100%;
}
</style>
