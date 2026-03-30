<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTablesStore } from '../../application/tables.store.js'
import { usePosStore }    from '../../../pos/application/pos.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { TABLE_STATUS_CONFIG } from '../constants/tables.constants-ui.js'
import { posOrderRoute }  from '../../../pos/presentation/constants/pos.constants-ui.js'
import CreateAndEditZone   from './create-and-edit-zone.vue'
import CreateAndEditTable  from './create-and-edit-tables.vue'
import AssignTableDialog   from './assign-table-dialog.vue'

const store    = useTablesStore()
const posStore = usePosStore()
const router   = useRouter()
const { confirmDelete } = useConfirmDialog()

const activeTab        = ref('floor')   // 'floor' | 'manage'
const showZoneDialog   = ref(false)
const showTableDialog  = ref(false)
const showAssignDialog = ref(false)
const editingZone      = ref(null)
const editingTable     = ref(null)
const assigningTable   = ref(null)

// Mapa rápido zoneId → { color, name } para las tarjetas de mesas
const zoneColorMap = computed(() => {
    const map = {}
    store.zones.forEach(z => { map[z.id] = { color: z.color, name: z.name } })
    return map
})

function elapsedTime(since) {
    if (!since) return ''
    const mins = Math.floor((Date.now() - new Date(since)) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function openCreateZone() {
    editingZone.value = null
    showZoneDialog.value = true
}

function openEditZone(zone) {
    editingZone.value = { id: zone.id, name: zone.name, color: zone.color ?? '#3B82F6', description: zone.description ?? '' }
    showZoneDialog.value = true
}

function onDeleteZone(zone) {
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

function onAssignConfirm({ guests }) {
    const table = assigningTable.value
    posStore.openSaleForTable(table.id, table.zoneId, guests)
    router.push(posOrderRoute(table.id))
    assigningTable.value = null
}

function openOrderForTable(table) {
    posStore.openSaleForTable(table.id, table.zoneId, table.seatedGuests)
    router.push(posOrderRoute(table.id))
}

function onDeleteTable(table) {
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
    editingTable.value   = null
    showTableDialog.value = false
}



</script>

<template>
    <div class="tables-layout">

        <!-- ── Tab navigation ──────────────────────────────────────────── -->
        <div class="tables-tabs">
            <button
                :class="['tab-btn', activeTab === 'floor' && 'tab-btn--active']"
                @click="activeTab = 'floor'"
            >
                <i class="pi pi-th-large"></i> Plano del Salón
            </button>
            <button
                :class="['tab-btn', activeTab === 'manage' && 'tab-btn--active']"
                @click="activeTab = 'manage'"
            >
                <i class="pi pi-cog"></i> Gestionar Mesas
            </button>
        </div>

        <!-- ══════════════════ TAB: PLANO DEL SALÓN ══════════════════════ -->
        <div v-if="activeTab === 'floor'" class="p-4 flex flex-column gap-4 floor-tab">

            <!-- Stat cards -->
            <div class="flex flex-wrap gap-3">
                <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                    <span class="text-sm text-color-secondary">Total Mesas</span>
                    <span class="text-4xl font-bold text-color">{{ store.totalTables }}</span>
                </div>
                <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                    <div class="flex align-items-center gap-2">
                        <span class="status-dot bg-green-500"></span>
                        <span class="text-sm text-color-secondary">Disponibles</span>
                    </div>
                    <span class="text-4xl font-bold text-green-500">{{ store.availableTables.length }}</span>
                </div>
                <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                    <div class="flex align-items-center gap-2">
                        <span class="status-dot bg-red-500"></span>
                        <span class="text-sm text-color-secondary">Ocupadas</span>
                    </div>
                    <span class="text-4xl font-bold text-red-500">{{ store.occupiedTables.length }}</span>
                </div>
                <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                    <div class="flex align-items-center gap-2">
                        <span class="status-dot bg-blue-500"></span>
                        <span class="text-sm text-color-secondary">En Limpieza</span>
                    </div>
                    <span class="text-4xl font-bold text-blue-500">{{ store.cleaningTables.length }}</span>
                </div>
            </div>

            <!-- Zone filter pills (solo lectura en esta pestaña) -->
            <div class="flex flex-column gap-2">
                <div class="flex align-items-center gap-2">
                    <i class="pi pi-map-marker text-color-secondary"></i>
                    <span class="text-sm text-color-secondary font-medium">Filtrar por Zona:</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button
                        :class="['zone-pill', store.selectedZoneId === null && 'zone-pill--active']"
                        @click="store.selectZone(null)"
                    >
                        Todas las Zonas ({{ store.totalTables }})
                    </button>
                    <button
                        v-for="zone in store.zones"
                        :key="zone.id"
                        :class="['zone-pill', store.selectedZoneId === zone.id && 'zone-pill--active']"
                        :style="store.selectedZoneId !== zone.id ? { borderLeft: `4px solid ${zone.color}` } : {}"
                        @click="store.selectZone(zone.id)"
                    >
                        {{ zone.name }} ({{ zone.count }})
                    </button>
                </div>
            </div>

            <!-- Grilla de mesas -->
            <div v-if="store.filteredTables.length > 0" class="tables-grid">
                <div
                    v-for="table in store.filteredTables"
                    :key="table.id"
                    class="table-card"
                    :style="{
                        '--zone-color':   zoneColorMap[table.zoneId]?.color ?? '#6b7280',
                        '--status-color': TABLE_STATUS_CONFIG[table.status]?.color ?? '#6b7280',
                        '--status-bg':    TABLE_STATUS_CONFIG[table.status]?.bg    ?? 'transparent',
                        '--card-border':  TABLE_STATUS_CONFIG[table.status]?.border ?? zoneColorMap[table.zoneId]?.color ?? '#6b7280',
                    }"
                >
                    <div class="table-card__header">
                        <div>
                            <div class="table-card__name">Mesa {{ table.number }}</div>
                            <div class="table-card__zone-name">{{ zoneColorMap[table.zoneId]?.name ?? 'Sin zona' }}</div>
                        </div>
                        <i :class="['pi table-card__status-icon', TABLE_STATUS_CONFIG[table.status]?.icon ?? 'pi-circle']"></i>
                    </div>
                    <div class="table-card__capacity">
                        <i class="pi pi-users"></i>
                        <span v-if="table.status === 'occupied'">{{ table.seatedGuests }}/{{ table.capacity }} personas</span>
                        <span v-else>{{ table.capacity }} personas</span>
                    </div>
                    <div class="table-card__divider"></div>
                    <div class="table-card__footer">
                        <span class="table-card__status-label">{{ TABLE_STATUS_CONFIG[table.status]?.label ?? table.status }}</span>
                        <template v-if="table.status === 'occupied' && table.orderId">
                            <div class="table-card__order-info">
                                <div class="table-card__order-row">
                                    <span class="table-card__order-time">{{ elapsedTime(table.occupiedSince) }}</span>
                                    <span class="table-card__order-amount">S/ {{ table.orderAmount.toFixed(2) }}</span>
                                </div>
                            </div>
                        </template>
                    </div>
                    <button
                        v-if="table.status === 'occupied'"
                        class="table-card__cta table-card__cta--cobrar"
                        @click.stop="openOrderForTable(table)"
                    >
                        <i class="pi pi-eye"></i> Ver Orden
                    </button>
                    <button
                        v-else-if="table.status === 'available'"
                        class="table-card__cta table-card__cta--asignar"
                        @click.stop="openAssignTable(table)"
                    >
                        <i class="pi pi-user-plus"></i> Asignar Mesa
                    </button>
                    <button
                        v-else-if="table.status === 'cleaning'"
                        class="table-card__cta table-card__cta--limpiar"
                        @click.stop="store.setTableStatus(table.id, 'available')"
                    >
                        <i class="pi pi-check"></i> Marcar como Disponible
                    </button>
                </div>
            </div>
            <div v-else class="flex flex-column align-items-center justify-content-center gap-2 py-6">
                <i class="pi pi-table text-4xl text-color-secondary"></i>
                <span class="text-color-secondary">No hay mesas en esta zona</span>
            </div>

        </div>

        <!-- ══════════════════ TAB: GESTIONAR MESAS ══════════════════════ -->
        <div v-else class="p-4 flex flex-column gap-4">

            <!-- ── Zonas ─────────────────────────────────────────────────── -->
            <div class="flex align-items-center justify-content-between">
                <span class="text-base font-bold text-color">Zonas</span>
                <pv-button label="Nueva Zona" icon="pi pi-plus" size="small" @click="openCreateZone" />
            </div>

            <div v-if="store.zones.length > 0" class="zones-grid">
                <div
                    v-for="zone in store.zones"
                    :key="zone.id"
                    class="zone-card"
                    :style="{ '--zone-color': zone.color }"
                >
                    <div class="zone-card__top-bar" :style="{ background: zone.color }"></div>
                    <div class="zone-card__body">
                        <div class="zone-card__icon-wrap" :style="{ background: zone.color + '22' }">
                            <i class="pi pi-map-marker" :style="{ color: zone.color }"></i>
                        </div>
                        <div class="zone-card__info">
                            <div class="zone-card__name">{{ zone.name }}</div>
                            <div class="zone-card__desc">{{ zone.description || 'Sin descripción' }}</div>
                        </div>
                        <div class="zone-card__badge">{{ zone.count }} mesa{{ zone.count !== 1 ? 's' : '' }}</div>
                    </div>
                    <div class="zone-card__actions">
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

            <!-- Divider -->
            <div style="height:1px; background: var(--surface-border); margin: 0.5rem 0;"></div>

            <!-- ── Mesas ──────────────────────────────────────────────────── -->
            <div class="flex align-items-center justify-content-between">
                <span class="text-base font-bold text-color">Mesas</span>
                <pv-button label="Nueva Mesa" icon="pi pi-plus" size="small" severity="success" @click="openCreateTable" />
            </div>

            <div v-if="store.tables.length > 0" class="manage-tables-grid">
                <div
                    v-for="table in store.tables"
                    :key="table.id"
                    class="manage-table-card"
                    :style="{ '--zone-color': zoneColorMap[table.zoneId]?.color ?? '#6b7280' }"
                >
                    <div class="manage-table-card__top-bar" :style="{ background: zoneColorMap[table.zoneId]?.color ?? '#6b7280' }"></div>
                    <div class="manage-table-card__body">
                        <div class="manage-table-card__num">{{ table.number }}</div>
                        <div class="manage-table-card__info">
                            <div class="manage-table-card__name">Mesa {{ table.number }}</div>
                            <div class="manage-table-card__zone">{{ zoneColorMap[table.zoneId]?.name ?? 'Sin zona' }}</div>
                        </div>
                        <div
                            class="manage-table-card__status"
                            :style="{ background: TABLE_STATUS_CONFIG[table.status]?.bg, color: TABLE_STATUS_CONFIG[table.status]?.color }"
                        >
                            {{ TABLE_STATUS_CONFIG[table.status]?.label ?? table.status }}
                        </div>
                    </div>
                    <div class="manage-table-card__detail">
                        <i class="pi pi-users" style="font-size:0.75rem; color:#9ca3af"></i>
                        <span>{{ table.capacity }} personas</span>
                        <span class="manage-table-card__shape">{{ table.shape }}</span>
                    </div>
                    <div class="manage-table-card__actions">
                        <button class="zone-mgmt-btn zone-mgmt-btn--edit" title="Editar" @click="openEditTable(table)">
                            <i class="pi pi-pencil"></i>
                        </button>
                        <button class="zone-mgmt-btn zone-mgmt-btn--delete" title="Eliminar" @click="onDeleteTable(table)">
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="flex flex-column align-items-center justify-content-center gap-2 py-4">
                <i class="pi pi-table text-3xl text-color-secondary"></i>
                <span class="text-color-secondary">No hay mesas configuradas</span>
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
        :edit="!!editingTable"
        @table-saved="onTableSaved"
        @update:visible="v => { if (!v) { editingTable.value = null } }"
    />

</template>

<style scoped>
.tables-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.tables-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--surface-border);
    background: #fff;
    padding: 0 1.25rem;
    flex-shrink: 0;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    color: var(--text-color-secondary, #6b7280);
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.15s;
}
.tab-btn--active {
    color: var(--p-primary-color, #6366f1);
    border-bottom-color: var(--p-primary-color, #6366f1);
    font-weight: 600;
}
.tab-btn:hover:not(.tab-btn--active) { color: #374151; }

/* ── Floor tab scrollable ─────────────────────────────────────────────── */
.floor-tab {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

/* ── Stat cards ───────────────────────────────────────────────────────── */
.stat-card { min-width: 130px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── Zone filter pills (floor tab) ───────────────────────────────────── */
.zone-pill {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    color: #374151;
    transition: background 0.12s;
}
.zone-pill--active {
    background: var(--p-primary-color, #6366f1);
    color: #fff;
    border-color: var(--p-primary-color, #6366f1);
}
.zone-pill:not(.zone-pill--active):hover { background: #f3f4f6; }

/* ── Grilla de mesas (floor) ─────────────────────────────────────────── */
.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.table-card {
    position: relative;
    background: var(--status-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    cursor: default;
    transition: box-shadow 0.15s, transform 0.15s;
}
.table-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    transform: translateY(-2px);
}

.table-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
}
.table-card__name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
}
.table-card__zone-name {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 1px;
}
.table-card__status-icon {
    font-size: 1.1rem;
    color: var(--status-color);
    flex-shrink: 0;
    margin-top: 1px;
}
.table-card__capacity {
    font-size: 0.8rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}
.table-card__capacity .pi { font-size: 0.8rem; }
.table-card__divider {
    height: 1px;
    background: var(--card-border);
    opacity: 0.4;
    margin: 0.1rem 0;
}
.table-card__footer {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}
.table-card__status-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--status-color);
}
.table-card__order-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    margin-top: 0.1rem;
}
.table-card__order-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.table-card__order-time {
    font-size: 0.72rem;
    color: #6b7280;
}
.table-card__order-amount {
    font-size: 0.85rem;
    font-weight: 700;
    color: #111827;
}

/* Botón CTA (hover) */
.table-card__cta {
    display: none;
    width: 100%;
    padding: 0.55rem;
    border: none;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin-top: 0.25rem;
    transition: filter 0.15s;
}
.table-card__cta .pi { font-size: 0.82rem; }
.table-card:hover .table-card__cta { display: flex; }
.table-card__cta--cobrar  { background: #059669; color: #fff; }
.table-card__cta--cobrar:hover  { filter: brightness(1.1); }
.table-card__cta--asignar { background: #2563eb; color: #fff; }
.table-card__cta--asignar:hover { filter: brightness(1.1); }
.table-card__cta--limpiar { background: #d97706; color: #fff; }
.table-card__cta--limpiar:hover { filter: brightness(1.1); }

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

/* ── Manage table cards ──────────────────────────────────────────────── */
.manage-tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
}

.manage-table-card {
    position: relative;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    transition: box-shadow 0.15s;
}
.manage-table-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }

.manage-table-card__top-bar { height: 4px; }

.manage-table-card__body {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem 0.5rem;
}

.manage-table-card__num {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--zone-color, #6b7280);
    color: #fff;
    font-size: 1rem;
    font-weight: 800;
    flex-shrink: 0;
}

.manage-table-card__info { flex: 1; min-width: 0; }

.manage-table-card__name {
    font-size: 0.9rem;
    font-weight: 700;
    color: #111827;
}

.manage-table-card__zone {
    font-size: 0.72rem;
    color: #6b7280;
    margin-top: 1px;
}

.manage-table-card__status {
    font-size: 0.68rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    flex-shrink: 0;
}

.manage-table-card__detail {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0 1rem 0.5rem;
    font-size: 0.75rem;
    color: #9ca3af;
}

.manage-table-card__shape {
    margin-left: auto;
    text-transform: capitalize;
    font-size: 0.7rem;
    background: #f3f4f6;
    border-radius: 4px;
    padding: 0.1rem 0.35rem;
    color: #6b7280;
}

.manage-table-card__actions {
    display: flex;
    gap: 0.4rem;
    padding: 0 1rem 0.85rem;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.15s;
}
.manage-table-card:hover .manage-table-card__actions { opacity: 1; }

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
</style>
