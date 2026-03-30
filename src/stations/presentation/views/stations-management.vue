<script setup>
import { ref, computed } from 'vue'
import { useStationsStore } from '../../application/stations.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { TICKET_STATUS_CONFIG, TICKET_COLUMNS } from '../constants/stations.constants-ui.js'
import CreateAndEditStation from './create-and-edit-station.vue'

const store = useStationsStore()
const { confirmDelete } = useConfirmDialog()

const activeTab         = ref('display')   // 'display' | 'stations'
const showStationDialog = ref(false)
const editingStation    = ref(null)

// ── Helpers ───────────────────────────────────────────────────────────────
function elapsedTime(date) {
    if (!date) return ''
    const mins = Math.floor((Date.now() - new Date(date)) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function ticketsByColumn(colKey) {
    return store.filteredTickets.filter(t => t.status === colKey)
}

function menuItemCountForStation(stationId) {
    // Rough count from tickets (mock) — real impl from menu store
    return store.tickets.filter(t => t.stationId === stationId).length
}

// ── Station CRUD ──────────────────────────────────────────────────────────
function openCreateStation() {
    editingStation.value = null
    showStationDialog.value = true
}

function openEditStation(station) {
    editingStation.value = { ...station }
    showStationDialog.value = true
}

function onStationSaved(data) {
    if (editingStation.value) {
        store.updateStation(editingStation.value.id, data)
    } else {
        store.createStation(data)
    }
    editingStation.value = null
}

function onDeleteStation(station) {
    confirmDelete('la estación', station.name, () => store.removeStation(station.id))
}
</script>

<template>
    <div class="stations-layout">

        <!-- ── Tab navigation ──────────────────────────────────────────── -->
        <div class="stations-tabs">
            <button
                :class="['tab-btn', activeTab === 'display' && 'tab-btn--active']"
                @click="activeTab = 'display'"
            >
                <i class="pi pi-th-large"></i> Pantalla de Cocina
            </button>
            <button
                :class="['tab-btn', activeTab === 'stations' && 'tab-btn--active']"
                @click="activeTab = 'stations'"
            >
                <i class="pi pi-cog"></i> Gestionar Estaciones
            </button>
        </div>

        <!-- ══════════════════ TAB: PANTALLA KANBAN ══════════════════════ -->
        <div v-if="activeTab === 'display'" class="p-4 flex flex-column gap-4 display-tab">

            <!-- Stat cards -->
            <div class="flex flex-wrap gap-3">
                <div class="stat-card surface-card border-1 surface-border border-round-lg p-3 flex flex-column gap-1 flex-1">
                    <span class="text-sm text-color-secondary">Total Tickets Hoy</span>
                    <span class="text-3xl font-bold text-color">{{ store.totalToday }}</span>
                </div>
                <div class="stat-card surface-card border-1 surface-border border-round-lg p-3 flex flex-column gap-1 flex-1">
                    <div class="flex align-items-center gap-2">
                        <span class="status-dot" style="background:#3b82f6"></span>
                        <span class="text-sm text-color-secondary">Recibidos</span>
                    </div>
                    <span class="text-3xl font-bold" style="color:#3b82f6">{{ store.receivedTickets.length }}</span>
                </div>
                <div class="stat-card surface-card border-1 surface-border border-round-lg p-3 flex flex-column gap-1 flex-1">
                    <div class="flex align-items-center gap-2">
                        <span class="status-dot" style="background:#f59e0b"></span>
                        <span class="text-sm text-color-secondary">En Preparación</span>
                    </div>
                    <span class="text-3xl font-bold" style="color:#f59e0b">{{ store.preparingTickets.length }}</span>
                </div>
                <div class="stat-card surface-card border-1 surface-border border-round-lg p-3 flex flex-column gap-1 flex-1">
                    <div class="flex align-items-center gap-2">
                        <span class="status-dot" style="background:#10b981"></span>
                        <span class="text-sm text-color-secondary">Listos</span>
                    </div>
                    <span class="text-3xl font-bold" style="color:#10b981">{{ store.readyCount }}</span>
                </div>
            </div>

            <!-- Station filter pills -->
            <div class="flex flex-column gap-2">
                <div class="flex align-items-center gap-2">
                    <i class="pi pi-bolt text-color-secondary"></i>
                    <span class="text-sm text-color-secondary font-medium">Filtrar por Estación:</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button
                        :class="['filter-pill', store.selectedStationId === null && 'filter-pill--active']"
                        @click="store.selectStation(null)"
                    >
                        Todas ({{ store.totalToday }})
                    </button>
                    <button
                        v-for="st in store.activeStations"
                        :key="st.id"
                        :class="['filter-pill', store.selectedStationId === st.id && 'filter-pill--active']"
                        :style="{ borderLeft: `4px solid ${st.color}` }"
                        @click="store.selectStation(st.id)"
                    >
                        {{ st.name }} ({{ store.tickets.filter(t => t.stationId === st.id).length }})
                    </button>
                </div>
            </div>

            <!-- Kanban board -->
            <div class="kanban-board">
                <div
                    v-for="col in TICKET_COLUMNS"
                    :key="col.key"
                    class="kanban-col"
                >
                    <!-- Column header -->
                    <div class="kanban-col__header" :style="{ background: col.bg, borderBottom: `2px solid ${col.color}` }">
                        <div class="flex align-items-center gap-2">
                            <i :class="['pi', TICKET_STATUS_CONFIG[col.key].icon]" :style="{ color: col.color }"></i>
                            <span class="font-semibold" :style="{ color: col.color }">{{ col.label }}</span>
                        </div>
                        <span class="kanban-col__count" :style="{ background: col.color }">
                            {{ ticketsByColumn(col.key).length }}
                        </span>
                    </div>

                    <!-- Ticket cards -->
                    <div class="kanban-col__body">
                        <div v-if="ticketsByColumn(col.key).length === 0" class="kanban-col__empty">
                            <i class="pi pi-inbox text-2xl text-color-secondary"></i>
                            <span class="text-sm text-color-secondary">Sin tickets</span>
                        </div>

                        <div
                            v-for="ticket in ticketsByColumn(col.key)"
                            :key="ticket.id"
                            class="ticket-card"
                            :style="{ borderLeft: `4px solid ${TICKET_STATUS_CONFIG[ticket.status].color}` }"
                        >
                            <!-- Ticket header -->
                            <div class="ticket-card__header">
                                <div class="flex align-items-center gap-1">
                                    <span class="ticket-card__table">Mesa {{ ticket.tableNumber }}</span>
                                    <span class="ticket-card__order">#{{ ticket.saleId }}</span>
                                </div>
                                <div class="flex align-items-center gap-1">
                                    <span
                                        v-if="ticket.stationId"
                                        class="ticket-card__station-badge"
                                        :style="{ background: store.stations.find(s => s.id === ticket.stationId)?.color + '22', color: store.stations.find(s => s.id === ticket.stationId)?.color }"
                                    >
                                        {{ ticket.stationName }}
                                    </span>
                                </div>
                            </div>

                            <!-- Items list -->
                            <ul class="ticket-card__items">
                                <li v-for="(item, i) in ticket.items" :key="i" class="ticket-card__item">
                                    <span class="ticket-card__qty">× {{ item.quantity }}</span>
                                    <span class="ticket-card__item-name">{{ item.menuItemName }}</span>
                                    <span v-if="item.note" class="ticket-card__note">{{ item.note }}</span>
                                </li>
                            </ul>

                            <!-- Footer: time + action -->
                            <div class="ticket-card__footer">
                                <span class="ticket-card__time">
                                    <i class="pi pi-clock"></i>
                                    {{ elapsedTime(ticket.createdAt) }}
                                </span>
                                <button
                                    v-if="TICKET_STATUS_CONFIG[ticket.status].next"
                                    class="ticket-card__advance-btn"
                                    :style="{ background: TICKET_STATUS_CONFIG[TICKET_STATUS_CONFIG[ticket.status].next]?.color ?? '#10b981' }"
                                    @click="store.advanceTicket(ticket.id)"
                                >
                                    {{ TICKET_STATUS_CONFIG[ticket.status].nextLabel }}
                                </button>
                                <button
                                    v-else
                                    class="ticket-card__remove-btn"
                                    @click="store.removeTicket(ticket.id)"
                                >
                                    <i class="pi pi-trash"></i> Archivar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════════════════ TAB: ESTACIONES CRUD ═══════════════════════ -->
        <div v-else class="p-4 flex flex-column gap-4">

            <!-- Actions -->
            <div class="flex justify-content-end">
                <pv-button label="Nueva Estación" icon="pi pi-plus" size="small" severity="success" @click="openCreateStation" />
            </div>

            <!-- Station grid -->
            <div v-if="store.stations.length > 0" class="stations-grid">
                <div
                    v-for="station in store.stations"
                    :key="station.id"
                    class="station-card"
                    :style="{ '--station-color': station.color }"
                >
                    <!-- Top accent bar -->
                    <div class="station-card__top-bar" :style="{ background: station.color }"></div>

                    <!-- Body -->
                    <div class="station-card__body">
                        <div class="station-card__icon-wrap" :style="{ background: station.color + '22' }">
                            <span class="station-card__initial" :style="{ color: station.color }">{{ station.name.charAt(0).toUpperCase() }}</span>
                        </div>
                        <div class="station-card__info">
                            <div class="station-card__name">{{ station.name }}</div>
                            <div class="station-card__desc">{{ station.description }}</div>
                        </div>
                        <div class="station-card__badge" :style="{ background: station.isActive ? '#d1fae5' : '#fee2e2', color: station.isActive ? '#065f46' : '#991b1b' }">
                            {{ station.isActive ? 'Activa' : 'Inactiva' }}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="station-card__actions">
                        <button class="station-action-btn station-action-btn--edit" title="Editar" @click="openEditStation(station)">
                            <i class="pi pi-pencil"></i>
                        </button>
                        <button class="station-action-btn station-action-btn--delete" title="Eliminar" @click="onDeleteStation(station)">
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div v-else class="flex flex-column align-items-center justify-content-center gap-2 py-6">
                <i class="pi pi-bolt text-4xl text-color-secondary"></i>
                <span class="text-color-secondary">No hay estaciones configuradas</span>
            </div>
        </div>

    </div>

    <!-- Dialogs -->
    <CreateAndEditStation
        v-model:visible="showStationDialog"
        :station="editingStation"
        :edit="!!editingStation"
        @station-saved="onStationSaved"
    />
</template>

<style scoped>
.stations-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.stations-tabs {
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

/* ── Display tab scrollable ───────────────────────────────────────────── */
.display-tab {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

/* ── Stat cards ───────────────────────────────────────────────────────── */
.stat-card { min-width: 130px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Station filter pills → uses global .filter-pill from utilities.css */

/* ── Kanban board ─────────────────────────────────────────────────────── */
.kanban-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    min-height: 400px;
}

.kanban-col {
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
}

.kanban-col__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 0.9rem;
    flex-shrink: 0;
}

.kanban-col__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    border-radius: 999px;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0 0.4rem;
}

.kanban-col__body {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.kanban-col__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem 0;
}

/* ── Ticket cards ─────────────────────────────────────────────────────── */
.ticket-card {
    background: #fff;
    border-radius: 8px;
    padding: 0.8rem;
    border: 1px solid #e5e7eb;
    border-left-width: 4px;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.ticket-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.ticket-card__table {
    font-size: 0.88rem;
    font-weight: 700;
    color: #111827;
}

.ticket-card__order {
    font-size: 0.72rem;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 4px;
    padding: 0.1rem 0.35rem;
}

.ticket-card__station-badge {
    font-size: 0.68rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
}

.ticket-card__items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.ticket-card__item {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    font-size: 0.8rem;
}

.ticket-card__qty {
    font-weight: 700;
    color: #374151;
    flex-shrink: 0;
}

.ticket-card__item-name {
    color: #111827;
    flex: 1;
}

.ticket-card__note {
    font-size: 0.7rem;
    color: #9ca3af;
    font-style: italic;
}

.ticket-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 0.25rem;
}

.ticket-card__time {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    color: #9ca3af;
}

.ticket-card__advance-btn {
    border: none;
    border-radius: 6px;
    padding: 0.3rem 0.7rem;
    color: #fff;
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.12s;
}
.ticket-card__advance-btn:hover { opacity: 0.85; }

.ticket-card__remove-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.28rem 0.6rem;
    background: #fff;
    color: #9ca3af;
    font-size: 0.72rem;
    cursor: pointer;
}
.ticket-card__remove-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

/* ── Stations grid ────────────────────────────────────────────────────── */
.stations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
}

.station-card {
    position: relative;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    transition: box-shadow 0.15s;
}
.station-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.09);
}

.station-card__top-bar {
    height: 4px;
}

.station-card__body {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1rem;
}

.station-card__icon-wrap {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.station-card__initial {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
    user-select: none;
}

.station-card__info {
    flex: 1;
    min-width: 0;
}

.station-card__name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
}

.station-card__desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.station-card__badge {
    font-size: 0.68rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    flex-shrink: 0;
}

.station-card__actions {
    display: flex;
    gap: 0.4rem;
    padding: 0 1rem 0.85rem;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.15s;
}
.station-card:hover .station-card__actions { opacity: 1; }

.station-action-btn {
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
.station-action-btn--edit:hover  { background: #eff6ff; color: #2563eb; border-color: #93c5fd; }
.station-action-btn--delete:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
</style>
