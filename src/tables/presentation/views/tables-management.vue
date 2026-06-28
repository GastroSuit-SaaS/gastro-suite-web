<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTablesStore } from '../../application/tables.store.js'
import { usePosStore }    from '../../../pos/application/pos.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { TABLE_STATUS } from '../../domain/models/table.entity.js'
import { posOrderRoute }  from '../../../pos/presentation/constants/pos.constants-ui.js'
import CreateAndEditZone       from './create-and-edit-zone.vue'
import CreateAndEditTable      from './create-and-edit-tables.vue'
import AssignTableDialog       from './assign-table-dialog.vue'
import ReservationsManagement  from './reservations-management.vue'
import ModuleStateFeedback     from '../../../shared/presentation/components/module-state-feedback.vue'
import ModuleTabBar            from '../../../shared/presentation/components/module-tab-bar.vue'
import ModuleTab               from '../../../shared/presentation/components/module-tab.vue'
import TableFloorPanel         from '../components/table-floor-panel.vue'
import { useSubscriptionEntitlements } from '../../../shared/composables/use-subscription-entitlements.js'

const store    = useTablesStore()
const posStore = usePosStore()
const router   = useRouter()
const { confirmDelete } = useConfirmDialog()
const { entitlements } = useSubscriptionEntitlements()

onMounted(() => {
    store.fetchAll()
})

watch(
    () => entitlements.value.hasReservations,
    (allowed) => {
        if (!allowed && activeTab.value === 'reservations') {
            activeTab.value = 'floor'
        }
    },
)

const activeTab        = ref('floor')
const showZoneDialog   = ref(false)
const showTableDialog  = ref(false)
const showAssignDialog = ref(false)
const editingZone      = ref(null)
const editingTable     = ref(null)
const assigningTable   = ref(null)

function openCreateZone() {
    editingZone.value = null
    showZoneDialog.value = true
}

function openEditZone(zone) {
    editingZone.value = { id: zone.id, name: zone.name, color: zone.color ?? '#3B82F6', description: zone.description ?? '' }
    showZoneDialog.value = true
}

function onDeleteZone(zone) {
    const hasOccupied = store.tables.some(t => t.zoneId === zone.id && t.isOccupied)
    if (hasOccupied) {
        // Cannot delete a zone that still has occupied tables
        return
    }
    confirmDelete('la zona', zone.name, () => store.removeZone(zone.id))
}

function openEditTable(table) {
    editingTable.value = { ...table }
    showTableDialog.value = true
}

function openCreateTable() {
    editingTable.value = null
    showTableDialog.value = true
}

function openAssignTable(table) {
    assigningTable.value = table
    showAssignDialog.value = true
}

async function onAssignConfirm({ guests }) {
    const table = assigningTable.value
    const sale = await posStore.openSaleForTable(table.id, table.zoneId, guests)
    if (sale?.id) router.push(posOrderRoute(sale.id))
    assigningTable.value = null
}

async function openOrderForTable(table) {
    const sale = await posStore.openSaleForTable(table.id, table.zoneId, table.seatedGuests)
    if (sale?.id) router.push(posOrderRoute(sale.id))
}

function onDeleteTable(table) {
    if (table.isOccupied) {
        // Cannot delete a table with an active order
        return
    }
    confirmDelete('la mesa', `Mesa ${table.number}`, () => store.remove(table.id))
}

function onZoneSaved(data) {
    if (editingZone.value) {
        store.updateZone({ ...editingZone.value, ...data })
    } else {
        store.createZone(data)
    }
    editingZone.value = null
}

function onTableSaved(table) {
    if (editingTable.value) {
        store.update(editingTable.value.id, table)
    } else {
        store.create(table)
    }
    editingTable.value    = null
    showTableDialog.value = false
}

watch(showTableDialog, (visible) => {
    if (!visible) editingTable.value = null
})

function markTableAvailable(tableId) {
    store.setTableStatus(tableId, TABLE_STATUS.AVAILABLE)
}

function clearTableReservation(tableId) {
    store.clearReservation(tableId)
}

</script>

<template>
    <div class="tables-layout">

        <!-- ── Tab navigation ──────────────────────────────────────────── -->
        <module-tab-bar v-model="activeTab">
            <module-tab value="floor" icon="pi-th-large">
                Plano del Salón
            </module-tab>
            <module-tab value="manage" icon="pi-map-marker">
                Zonas
            </module-tab>
            <module-tab v-if="entitlements.hasReservations" value="reservations" icon="pi-calendar">
                Reservas
            </module-tab>
        </module-tab-bar>

        <!-- ══════════════════ TAB: PLANO DEL SALÓN ══════════════════════ -->
        <div v-if="activeTab === 'floor'" class="p-4 flex flex-column gap-4 floor-tab">
            <module-state-feedback
                :loading="store.isLoading"
                :error="store.error"
                loading-label="Cargando mesas…"
                @retry="store.fetchAll()"
            >
                <table-floor-panel
                    show-admin-actions
                    @assign="openAssignTable"
                    @open-order="openOrderForTable"
                    @mark-available="markTableAvailable"
                    @clear-reservation="clearTableReservation"
                    @create-table="openCreateTable"
                />
            </module-state-feedback>
        </div>

        <div v-else-if="activeTab === 'reservations'" class="module-tab-body module-page-body--scroll">
            <reservations-management />
        </div>

        <!-- ══════════════════ TAB: ZONAS ════════════════════════════════ -->
        <div v-else class="p-4 flex flex-column gap-4">

            <!-- ── Zonas ─────────────────────────────────────────────────── -->
            <div class="flex align-items-center justify-content-between">
                <span class="text-base font-bold text-color">Zonas</span>
                <pv-button label="Nueva Zona" icon="pi pi-plus" size="small" @click="openCreateZone" />
            </div>

            <div v-if="store.allZones.length > 0" class="zones-grid">
                <div
                    v-for="zone in store.allZones"
                    :key="zone.id"
                    :class="['zone-card', !zone.isActive && 'zone-card--inactive']"
                    :style="{ '--zone-color': zone.color }"
                >
                    <div class="zone-card__top-bar" :style="{ background: zone.isActive ? zone.color : '#9ca3af' }"></div>
                    <div class="zone-card__body">
                        <div class="zone-card__icon-wrap" :style="{ background: zone.color + '22' }">
                            <i class="pi pi-map-marker" :style="{ color: zone.color }"></i>
                        </div>
                        <div class="zone-card__info">
                            <div class="zone-card__name">{{ zone.name }}</div>
                            <div class="zone-card__desc">{{ zone.description || 'Sin descripción' }}</div>
                        </div>
                        <div class="flex flex-column align-items-end gap-1">
                            <div class="zone-card__badge">{{ zone.tableCount }} mesa{{ zone.tableCount !== 1 ? 's' : '' }}</div>
                            <span :class="['zone-card__active-badge', zone.isActive ? 'zone-card__active-badge--on' : 'zone-card__active-badge--off']">
                                {{ zone.isActive ? 'Activa' : 'Inactiva' }}
                            </span>
                        </div>
                    </div>
                    <div class="zone-card__actions">
                        <button
                            :class="['zone-mgmt-btn', 'zone-mgmt-btn--power', zone.isActive ? 'zone-mgmt-btn--power-on' : 'zone-mgmt-btn--power-off']"
                            :title="zone.isActive ? 'Desactivar zona' : 'Activar zona'"
                            @click="store.updateZone({ ...zone, isActive: !zone.isActive })"
                        >
                            <i class="pi pi-power-off"></i>
                        </button>
                        <button class="zone-mgmt-btn zone-mgmt-btn--edit" title="Editar" @click="openEditZone(zone)">
                            <i class="pi pi-pencil"></i>
                        </button>
                        <button class="zone-mgmt-btn zone-mgmt-btn--delete" title="Eliminar" @click="onDeleteZone(zone)">
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="flex flex-column align-items-center justify-content-center gap-2 py-4">
                <i class="pi pi-map-marker text-3xl text-color-secondary"></i>
                <span class="text-color-secondary">No hay zonas configuradas</span>
            </div>

        </div>

    </div>

    <AssignTableDialog
        v-model:visible="showAssignDialog"
        :table="assigningTable"
        @assigned="onAssignConfirm"
    />
    <CreateAndEditZone
        v-model:visible="showZoneDialog"
        :zone="editingZone"
        :edit="!!editingZone"
        @zone-saved="onZoneSaved"
    />
    <CreateAndEditTable
        v-model:visible="showTableDialog"
        :table="editingTable"
        :zones="store.zones"
        :existing-tables="store.tables"
        :edit="!!editingTable"
        @table-saved="onTableSaved"
    />

</template>

<style scoped>
.tables-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

.floor-tab {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

/* ── Zone cards (manage tab) ─────────────────────────────────────────── */
.zones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
}

.zone-card {
    position: relative;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    transition: box-shadow 0.15s;
}
.zone-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }

.zone-card--inactive {
    opacity: 0.55;
    filter: grayscale(0.7);
    transition: opacity 0.2s, filter 0.2s;
}
.zone-card--inactive:hover {
    opacity: 0.75;
    filter: grayscale(0.4);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.zone-card__top-bar { height: 4px; }

.zone-card__body {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1rem;
}

.zone-card__icon-wrap {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.3rem;
}

.zone-card__info { flex: 1; min-width: 0; }

.zone-card__name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
}

.zone-card__desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.zone-card__badge {
    font-size: 0.68rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    background: #eff6ff;
    color: #1d4ed8;
    flex-shrink: 0;
}

.zone-card__actions {
    display: flex;
    gap: 0.4rem;
    padding: 0 1rem 0.85rem;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.15s;
}
.zone-card:hover .zone-card__actions { opacity: 1; }

/* ── Shared manage action buttons ────────────────────────────────────── */
.zone-mgmt-btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    color: #6b7280;
    transition: background 0.12s, color 0.12s;
}
.zone-mgmt-btn--edit:hover   { background: #eff6ff; color: #2563eb; border-color: #93c5fd; }
.zone-mgmt-btn--delete:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }

/* Power toggle button */
.zone-mgmt-btn--power { transition: background 0.15s, color 0.15s, border-color 0.15s; }
.zone-mgmt-btn--power-on  { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
.zone-mgmt-btn--power-on:hover  { background: #dcfce7; color: #15803d; border-color: #86efac; }
.zone-mgmt-btn--power-off { color: #9ca3af; border-color: #e5e7eb; background: #f9fafb; }
.zone-mgmt-btn--power-off:hover { background: #f0fdf4; color: #16a34a; border-color: #86efac; }

.zone-card__active-badge {
    font-size: 0.63rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
    flex-shrink: 0;
}
.zone-card__active-badge--on  { background: #dcfce7; color: #15803d; }
.zone-card__active-badge--off { background: #fee2e2; color: #b91c1c; }
</style>
