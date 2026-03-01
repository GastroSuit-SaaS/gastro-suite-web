<script setup>
import { ref, computed } from 'vue'
import { useTablesStore } from '../../application/tables.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { TABLE_STATUS_CONFIG } from '../constants/tables.constants-ui.js'
import CreateAndEditZone from './create-and-edit-zone.vue'
import CreateAndEditTable from './create-and-edit-tables.vue'

const store = useTablesStore()
const { confirmDelete } = useConfirmDialog()

const showZoneDialog  = ref(false)
const showTableDialog = ref(false)
const editingZone     = ref(null)
const editingTable    = ref(null)

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
    <div class="p-4 flex flex-column gap-4">

        <!-- Stat cards -->
        <div class="flex flex-wrap gap-3">

            <!-- Total -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <span class="text-sm text-color-secondary">Total Mesas</span>
                <span class="text-4xl font-bold text-color">{{ store.totalTables }}</span>
            </div>

            <!-- Disponibles -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <div class="flex align-items-center gap-2">
                    <span class="status-dot bg-green-500"></span>
                    <span class="text-sm text-color-secondary">Disponibles</span>
                </div>
                <span class="text-4xl font-bold text-green-500">{{ store.availableTables.length }}</span>
            </div>

            <!-- Ocupadas -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <div class="flex align-items-center gap-2">
                    <span class="status-dot bg-red-500"></span>
                    <span class="text-sm text-color-secondary">Ocupadas</span>
                </div>
                <span class="text-4xl font-bold text-red-500">{{ store.occupiedTables.length }}</span>
            </div>

            <!-- En Limpieza -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <div class="flex align-items-center gap-2">
                    <span class="status-dot bg-blue-500"></span>
                    <span class="text-sm text-color-secondary">En Limpieza</span>
                </div>
                <span class="text-4xl font-bold text-blue-500">{{ store.cleaningTables.length }}</span>
            </div>

        </div>

        <!-- Zone filter + actions -->
        <div class="flex flex-column gap-2">

            <!-- Row 1: label -->
            <div class="flex align-items-center gap-2">
                <i class="pi pi-map-marker text-color-secondary"></i>
                <span class="text-sm text-color-secondary font-medium">Filtrar por Zona:</span>
            </div>

            <!-- Row 2: zone pills (left) + action buttons (right) -->
            <div class="flex align-items-center justify-content-between flex-wrap gap-2">

                <!-- Zone pills -->
                <div class="flex flex-wrap gap-2">
                    <button
                        :class="['zone-btn border-round-xl px-3 py-2 cursor-pointer text-sm font-medium border-1',
                                 store.selectedZoneId === null ? 'zone-btn--active' : 'zone-btn--inactive']"
                        @click="store.selectZone(null)"
                    >
                        Todas las Zonas ({{ store.totalTables }})
                    </button>

                    <div
                        v-for="zone in store.zones"
                        :key="zone.id"
                        class="zone-pill-wrapper"
                    >
                        <button
                            class="zone-btn border-round-xl px-3 py-2 cursor-pointer text-sm font-medium"
                            :class="store.selectedZoneId === zone.id ? 'zone-btn--active' : 'zone-btn--inactive'"
                            :style="{ borderLeft: `4px solid ${zone.color}` }"
                            @click="store.selectZone(zone.id)"
                        >
                            {{ zone.name }} ({{ zone.count }})
                        </button>
                        <div class="zone-pill-actions">
                            <button class="zone-action-btn zone-action-btn--edit" title="Editar zona" @click.stop="openEditZone(zone)">
                                <i class="pi pi-pencil"></i>
                            </button>
                            <button class="zone-action-btn zone-action-btn--delete" title="Eliminar zona" @click.stop="onDeleteZone(zone)">
                                <i class="pi pi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="flex gap-2">
                    <pv-button label="Nueva Zona" icon="pi pi-plus" size="small" @click="openCreateZone" />
                    <pv-button label="Nueva Mesa" icon="pi pi-plus" size="small" severity="success" @click="showTableDialog = true" />
                </div>

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
                <!-- Cabecera: nombre + zona + ícono de estado -->
                <div class="table-card__header">
                    <div>
                        <div class="table-card__name">Mesa {{ table.number }}</div>
                        <div class="table-card__zone-name">{{ zoneColorMap[table.zoneId]?.name ?? 'Sin zona' }}</div>
                    </div>
                    <i :class="['pi table-card__status-icon', TABLE_STATUS_CONFIG[table.status]?.icon ?? 'pi-circle']"></i>
                </div>

                <!-- Capacidad -->
                <div class="table-card__capacity">
                    <i class="pi pi-users"></i>
                    <span v-if="table.status === 'occupied'">
                        {{ table.seatedGuests }}/{{ table.capacity }} personas
                    </span>
                    <span v-else>{{ table.capacity }} personas</span>
                </div>

                <!-- Separador -->
                <div class="table-card__divider"></div>

                <!-- Footer -->
                <div class="table-card__footer">
                    <span class="table-card__status-label">{{ TABLE_STATUS_CONFIG[table.status]?.label ?? table.status }}</span>

                    <!-- Info extra para mesas ocupadas -->
                    <template v-if="table.status === 'occupied' && table.orderId">
                        <div class="table-card__order-info">
                            <div class="table-card__order-row">
                                <span class="table-card__order-time">{{ elapsedTime(table.occupiedSince) }}</span>
                                <span class="table-card__order-amount">S/ {{ table.orderAmount.toFixed(2) }}</span>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Botón contextual: visible solo en hover -->
                <button
                    v-if="table.status === 'occupied'"
                    class="table-card__cta table-card__cta--cobrar"
                    @click.stop
                >
                    <i class="pi pi-credit-card"></i> Cobrar
                </button>
                <button
                    v-else-if="table.status === 'available'"
                    class="table-card__cta table-card__cta--asignar"
                    @click.stop
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

                <!-- Acciones (hover) -->
                <div class="table-card__actions">
                    <button class="table-action-btn table-action-btn--edit" title="Editar mesa" @click="openEditTable(table)">
                        <i class="pi pi-pencil"></i>
                    </button>
                    <button class="table-action-btn table-action-btn--delete" title="Eliminar mesa" @click="onDeleteTable(table)">
                        <i class="pi pi-trash"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-column align-items-center justify-content-center gap-2 py-6">
            <i class="pi pi-table text-4xl text-color-secondary"></i>
            <span class="text-color-secondary">No hay mesas en esta zona</span>
        </div>

    </div>

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
        @update:visible="v => { if (!v) { editingTable = null } }"
    />

</template>

<style scoped>
.stat-card { min-width: 130px; }

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.zone-btn {
    background-color: white;
    border-top: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    /* border-left se aplica via :style con el color de zona */
    transition: background 0.15s ease, color 0.15s ease;
}

.zone-btn--active {
    background: var(--color-primary);
    color: var(--text-primary);
    border-color: var(--color-primary);
}

.zone-btn--inactive {
    color: rgb(19, 18, 18);
}

.zone-btn--inactive:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}

/* ── Grilla de mesas ───────────────────────────────────────────────── */
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

/* Cabecera */
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

/* Capacidad */
.table-card__capacity {
    font-size: 0.8rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.table-card__capacity .pi {
    font-size: 0.8rem;
}

/* Separador */
.table-card__divider {
    height: 1px;
    background: var(--card-border);
    opacity: 0.4;
    margin: 0.1rem 0;
}

/* Footer */
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

/* Info orden (mesas ocupadas) */
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

.table-card__order-id {
    font-size: 0.72rem;
    color: #6b7280;
}

/* Botones de acción (aparecen en hover) */
.table-card__actions {
    display: none;
    position: absolute;
    top: 8px;
    right: 8px;
    gap: 3px;
}

.table-card:hover .table-card__actions {
    display: flex;
}

.table-action-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.1s, filter 0.1s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}

.table-action-btn .pi { font-size: 10px; line-height: 1; display: block; }
.table-action-btn:hover { transform: scale(1.2); filter: brightness(1.15); }
.table-action-btn--edit   { background: #3b82f6; color: #fff; }
.table-action-btn--delete { background: #ef4444; color: #fff; }

/* Botón contextual de acción (hover) */
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

.table-card:hover .table-card__cta {
    display: flex;
}

.table-card__cta--cobrar {
    background: #059669;
    color: #fff;
}

.table-card__cta--cobrar:hover {
    filter: brightness(1.1);
}

.table-card__cta--asignar {
    background: #2563eb;
    color: #fff;
}

.table-card__cta--asignar:hover {
    filter: brightness(1.1);
}

.table-card__cta--limpiar {
    background: #d97706;
    color: #fff;
}

.table-card__cta--limpiar:hover {
    filter: brightness(1.1);
}
.zone-pill-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
}

.zone-pill-actions {
    display: none;
    position: absolute;
    top: -8px;
    right: -8px;
    gap: 2px;
    align-items: center;
}

.zone-pill-wrapper:hover .zone-pill-actions {
    display: flex;
}

.zone-action-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    cursor: pointer;
    transition: transform 0.1s ease, filter 0.1s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.zone-action-btn .pi {
    font-size: 10px;
    line-height: 1;
    display: block;
}

.zone-action-btn:hover {
    transform: scale(1.2);
    filter: brightness(1.15);
}

/* Editar: azul — acción constructiva */
.zone-action-btn--edit {
    background: #3b82f6;
    color: #fff;
}

/* Eliminar: rojo — acción destructiva */
.zone-action-btn--delete {
    background: #ef4444;
    color: #fff;
}
</style>
