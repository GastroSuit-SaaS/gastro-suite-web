<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStationsStore } from '../../application/stations.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { TICKET_STATUS_CONFIG, TICKET_COLUMNS } from '../constants/stations.constants-ui.js'
import CreateAndEditStation      from './create-and-edit-station.vue'
import ModuleStateFeedback       from '../../../shared/presentation/components/module-state-feedback.vue'

const store = useStationsStore()
const { confirmDelete } = useConfirmDialog()

const activeTab         = ref('display')   // 'display' | 'stations'
const showStationDialog = ref(false)
const editingStation    = ref(null)

// ── Focus mode (single-station view for kitchen screens) ─────────────────
const focusedStation    = ref(null)   // null = normal | Station = locked view
const showStationPicker = ref(false)

function enterFocusMode(station) {
    focusedStation.value    = station
    showStationPicker.value = false
    // Lock store filter to this station so stat-bar counts are accurate
    store.selectStation(station.id)
}

function exitFocusMode() {
    focusedStation.value = null
    store.selectStation(null)
}

const focusedTickets = computed(() => {
    if (!focusedStation.value) return []
    let list = store.tickets.filter(t => t.stationId === focusedStation.value.id)
    if (statusFilter.value) list = list.filter(t => t.status === statusFilter.value)
    const q = searchQuery.value.trim().toLowerCase().replace(/^#/, '')
    if (q) list = list.filter(t =>
        String(t.tableNumber).includes(q) ||
        String(t.saleId).includes(q) ||
        t.items.some(i => i.menuItemName.toLowerCase().includes(q))
    )
    return list
})

// ── Search & filter ───────────────────────────────────────────────────────
const searchQuery  = ref('')
const statusFilter = ref('')   // '' | 'received' | 'preparing' | 'ready'

const searchedTickets = computed(() => {
    let list = store.filteredTickets
    const q = searchQuery.value.trim().toLowerCase().replace(/^#/, '')
    if (q) {
        list = list.filter(t => {
            if (String(t.tableNumber).includes(q))     return true
            if (String(t.saleId).includes(q))          return true
            if (t.stationName.toLowerCase().includes(q)) return true
            if (t.items.some(i => i.menuItemName.toLowerCase().includes(q))) return true
            return false
        })
    }
    if (statusFilter.value) {
        list = list.filter(t => t.status === statusFilter.value)
    }
    return list
})

const hasActiveSearch = computed(() => searchQuery.value.trim() !== '' || statusFilter.value !== '')

function clearSearch() {
    searchQuery.value  = ''
    statusFilter.value = ''
}

// ── Live clock for reactive timers ──────────────────────────────────────
const now = ref(Date.now())
let _timerInterval = null
onMounted(() => {
    store.fetchAll()
    _timerInterval = setInterval(() => { now.value = Date.now() }, 30_000)
})
onUnmounted(() => { clearInterval(_timerInterval) })

// ── Helpers ───────────────────────────────────────────────────────────────
function elapsedMins(date) {
    if (!date) return 0
    return Math.floor((now.value - new Date(date)) / 60000)
}

function elapsedTime(date) {
    const mins = elapsedMins(date)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// Semáforo: verde <15m · amarillo 15-30m · rojo >30m
function timeUrgency(ticket) {
    const _ = now.value // ensure reactivity tracked
    return ticket.urgencyLevel
}

// Progreso de la orden: cuántos tickets del mismo saleId están listos
function orderProgress(ticket) {
    const all   = store.tickets.filter(t => t.saleId === ticket.saleId)
    const ready = all.filter(t => t.status === 'ready').length
    return { ready, total: all.length, complete: ready === all.length }
}

function ticketsByColumn(colKey) {
    return searchedTickets.value.filter(t => t.status === colKey)
}

function focusedByColumn(colKey) {
    return focusedTickets.value.filter(t => t.status === colKey)
}

const hasAnyTickets  = computed(() => searchedTickets.value.length > 0)
const hasAnyFocused  = computed(() => focusedTickets.value.length > 0)

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

// ── Cancel ticket dialog ──────────────────────────────────────────────────
const showCancelDialog  = ref(false)
const cancelTicketId    = ref(null)
const cancelReason      = ref('')

function openCancelDialog(ticketId) {
    cancelTicketId.value = ticketId
    cancelReason.value   = ''
    showCancelDialog.value = true
}

function confirmCancel() {
    if (!cancelTicketId.value) return
    store.cancelTicket(cancelTicketId.value, cancelReason.value)
    showCancelDialog.value = false
    cancelTicketId.value   = null
    cancelReason.value     = ''
}

// ── New ticket alert ─────────────────────────────────────────────────────
const newTicketIds = ref(new Set())
const _prevIds     = ref(new Set(store.tickets.map(t => t.id)))
watch(() => store.tickets.length, () => {
    store.tickets.forEach(t => {
        if (!_prevIds.value.has(t.id)) {
            newTicketIds.value = new Set([...newTicketIds.value, t.id])
            _prevIds.value.add(t.id)
            setTimeout(() => {
                const s = new Set(newTicketIds.value)
                s.delete(t.id)
                newTicketIds.value = s
            }, 4000)
        }
    })
})

// ── Waiter call tracking ──────────────────────────────────────────────────
const calledWaiterIds = ref(new Set())
function callWaiter(ticketId) {
    calledWaiterIds.value = new Set([...calledWaiterIds.value, ticketId])
    setTimeout(() => {
        const s = new Set(calledWaiterIds.value)
        s.delete(ticketId)
        calledWaiterIds.value = s
    }, 30000)
}

// ── Urgency border color (based on elapsed time, not status) ─────────────
function urgencyBorderColor(ticket) {
    if (ticket.status === 'delivered' || ticket.status === 'cancelled') {
        return TICKET_STATUS_CONFIG[ticket.status].color
    }
    const m = elapsedMins(ticket.createdAt)
    if (m < 15) return '#10b981'
    if (m < 30) return '#f59e0b'
    return '#ef4444'
}
</script>

<template>
    <div class="stations-layout">

        <!-- ── Loading / Error / Contenido ───────────────────────────── -->
        <module-state-feedback
            :loading="store.isLoading"
            :error="store.error"
            loading-label="Cargando estaciones..."
            @retry="store.fetchAll()"
        >

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
            <button
                :class="['tab-btn', activeTab === 'history' && 'tab-btn--active']"
                @click="activeTab = 'history'"
            >
                <i class="pi pi-history"></i> Historial
                <span v-if="store.ticketHistory.length" class="tab-badge">{{ store.ticketHistory.length }}</span>
            </button>
            <!-- Modo estación: separado a la derecha -->
            <div class="tab-spacer"></div>
            <button
                class="tab-btn tab-btn--focus"
                title="Ver solo una estación (pantalla de cocina)"
                @click="showStationPicker = true"
            >
                <i class="pi pi-desktop"></i> Modo Estación
            </button>
        </div>

        <!-- ── Station picker overlay ─────────────────────────────────── -->
        <Teleport to="body">
            <Transition name="picker-fade">
                <div v-if="showStationPicker" class="station-picker-overlay" @click.self="showStationPicker = false">
                    <div class="station-picker-panel">
                        <div class="station-picker-panel__header">
                            <div>
                                <h2 class="station-picker-panel__title">
                                    <i class="pi pi-desktop"></i> Seleccionar Estación
                                </h2>
                                <p class="station-picker-panel__sub">
                                    Elige tu estación para activar la vista dedicada de cocina
                                </p>
                            </div>
                            <button class="station-picker-panel__close" @click="showStationPicker = false">
                                <i class="pi pi-times"></i>
                            </button>
                        </div>

                        <div class="station-picker-grid">
                            <button
                                v-for="st in store.activeStations"
                                :key="st.id"
                                class="station-picker-card"
                                :style="{ '--stc': st.color }"
                                @click="enterFocusMode(st)"
                            >
                                <div class="station-picker-card__dot" :style="{ background: st.color }"></div>
                                <div class="station-picker-card__initial" :style="{ background: st.color + '22', color: st.color }">
                                    {{ st.name.charAt(0).toUpperCase() }}
                                </div>
                                <div class="station-picker-card__name">{{ st.name }}</div>
                                <div class="station-picker-card__count">
                                    {{ store.tickets.filter(t => t.stationId === st.id && t.status !== 'ready').length }} pendientes
                                </div>
                            </button>
                        </div>

                        <p v-if="store.activeStations.length === 0" class="station-picker-empty">
                            No hay estaciones activas. Crea estaciones en la pestaña Gestionar.
                        </p>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- ── Cancel ticket dialog ───────────────────────────────────── -->
        <Teleport to="body">
            <Transition name="picker-fade">
                <div v-if="showCancelDialog" class="station-picker-overlay" @click.self="showCancelDialog = false">
                    <div class="cancel-dialog">
                        <div class="cancel-dialog__header">
                            <div class="cancel-dialog__icon"><i class="pi pi-times-circle"></i></div>
                            <div>
                                <h3 class="cancel-dialog__title">Cancelar Ticket</h3>
                                <p class="cancel-dialog__sub">El ticket pasará al historial como cancelado</p>
                            </div>
                            <button class="station-picker-panel__close" @click="showCancelDialog = false">
                                <i class="pi pi-times"></i>
                            </button>
                        </div>
                        <div class="cancel-dialog__body">
                            <label class="cancel-dialog__label">Motivo de cancelación (opcional)</label>
                            <textarea
                                v-model="cancelReason"
                                class="cancel-dialog__textarea"
                                placeholder="Ej: Ingrediente agotado, error en pedido, cliente cambió de opinión…"
                                rows="3"
                            ></textarea>
                        </div>
                        <div class="cancel-dialog__footer">
                            <button class="cancel-dialog__btn-secondary" @click="showCancelDialog = false">Volver</button>
                            <button class="cancel-dialog__btn-danger" @click="confirmCancel">
                                <i class="pi pi-times-circle"></i> Cancelar Ticket
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- ══════════════════ MODO ESTACIÓN DEDICADO ════════════════════ -->
        <div v-if="focusedStation" class="focus-mode" :style="{ '--fsc': focusedStation.color }">

            <!-- Focus mode header -->
            <div class="focus-hdr">
                <div class="focus-hdr__left">
                    <div class="focus-hdr__dot"></div>
                    <div>
                        <div class="focus-hdr__name">{{ focusedStation.name }}</div>
                        <div class="focus-hdr__desc">{{ focusedStation.description }}</div>
                    </div>
                </div>

                <!-- Mini stat bar -->
                <div class="focus-stats">
                    <button
                        :class="['focus-stat', statusFilter === 'received' && 'focus-stat--active']"
                        @click="statusFilter = statusFilter === 'received' ? '' : 'received'"
                    >
                        <span class="focus-stat__num" style="color:#3b82f6">
                            {{ store.tickets.filter(t => t.stationId === focusedStation.id && t.status === 'received').length }}
                        </span>
                        <span class="focus-stat__lbl">Recibidos</span>
                    </button>
                    <div class="focus-stats__sep"></div>
                    <button
                        :class="['focus-stat', statusFilter === 'preparing' && 'focus-stat--active']"
                        @click="statusFilter = statusFilter === 'preparing' ? '' : 'preparing'"
                    >
                        <span class="focus-stat__num" style="color:#f59e0b">
                            {{ store.tickets.filter(t => t.stationId === focusedStation.id && t.status === 'preparing').length }}
                        </span>
                        <span class="focus-stat__lbl">En Preparación</span>
                    </button>
                    <div class="focus-stats__sep"></div>
                    <button
                        :class="['focus-stat', statusFilter === 'ready' && 'focus-stat--active']"
                        @click="statusFilter = statusFilter === 'ready' ? '' : 'ready'"
                    >
                        <span class="focus-stat__num" style="color:#10b981">
                            {{ store.tickets.filter(t => t.stationId === focusedStation.id && t.status === 'ready').length }}
                        </span>
                        <span class="focus-stat__lbl">Listos</span>
                    </button>
                </div>

                <!-- Search + exit -->
                <div class="focus-hdr__right">
                    <div class="focus-search">
                        <i class="pi pi-search"></i>
                        <input v-model="searchQuery" type="text" placeholder="Buscar mesa o plato…" />
                        <button v-if="searchQuery" @click="searchQuery = ''"><i class="pi pi-times"></i></button>
                    </div>
                    <button class="focus-exit-btn" @click="exitFocusMode">
                        <i class="pi pi-sign-out"></i>
                        <span>Salir del modo estación</span>
                    </button>
                </div>
            </div>

            <!-- Focus kanban board -->
            <div class="focus-kanban">
                <div
                    v-for="col in TICKET_COLUMNS"
                    :key="col.key"
                    :class="['focus-col', hasAnyFocused && focusedByColumn(col.key).length === 0 && 'focus-col--empty-col']"
                >
                    <!-- Column header -->
                    <div class="focus-col__header" :style="{ background: col.bg, borderBottom: `2px solid ${col.color}` }">
                        <template v-if="hasAnyFocused && focusedByColumn(col.key).length === 0">
                            <div class="focus-col__header-collapsed">
                                <i :class="['pi', TICKET_STATUS_CONFIG[col.key].icon]" :style="{ color: col.color }"></i>
                                <span class="focus-col__header-collapsed__label" :style="{ color: col.color }">{{ col.label }}</span>
                                <span class="focus-col__count" :style="{ background: col.color }">0</span>
                            </div>
                        </template>
                        <template v-else>
                            <div class="flex align-items-center gap-2">
                                <i :class="['pi', TICKET_STATUS_CONFIG[col.key].icon]" :style="{ color: col.color }"></i>
                                <span class="font-semibold" :style="{ color: col.color }">{{ col.label }}</span>
                            </div>
                            <span class="focus-col__count" :style="{ background: col.color }">
                                {{ focusedByColumn(col.key).length }}
                            </span>
                        </template>
                    </div>

                    <!-- Column body -->
                    <div class="focus-col__body">
                        <div v-if="focusedByColumn(col.key).length === 0" class="focus-col__empty">
                            <i class="pi pi-inbox text-2xl text-color-secondary"></i>
                            <span class="text-sm text-color-secondary">Sin tickets</span>
                        </div>

                        <div
                            v-for="ticket in focusedByColumn(col.key)"
                            :key="ticket.id"
                            :class="['focus-ticket', newTicketIds.has(ticket.id) && 'ticket-card--new', timeUrgency(ticket) === 'critical' && 'ticket-card--critical']"
                            :style="{ borderLeft: `6px solid ${urgencyBorderColor(ticket)}` }"
                        >
                            <!-- Header -->
                            <div class="focus-ticket__body">
                                <div class="focus-ticket__meta">
                                    <span class="focus-ticket__table">Mesa {{ ticket.tableNumber }}</span>
                                    <span class="focus-ticket__order">#{{ ticket.saleId }}</span>
                                    <span :class="['ticket-time', 'ticket-time--' + timeUrgency(ticket)]" style="margin-left:auto">
                                        <i class="pi pi-clock"></i>
                                        {{ elapsedTime(ticket.createdAt) }}
                                    </span>
                                    <button
                                        v-if="TICKET_STATUS_CONFIG[ticket.status].canCancel"
                                        class="ticket-card__cancel-btn ticket-card__cancel-btn--corner"
                                        title="Cancelar ticket"
                                        @click="openCancelDialog(ticket.id)"
                                    >
                                        <i class="pi pi-times"></i>
                                    </button>
                                </div>

                                <ul class="focus-ticket__items">
                                    <li v-for="(item, i) in ticket.items" :key="i" class="focus-ticket__item">
                                        <span class="focus-ticket__qty">× {{ item.quantity }}</span>
                                        <span class="focus-ticket__item-name">{{ item.menuItemName }}</span>
                                        <span v-if="item.note" class="focus-ticket__note">{{ item.note }}</span>
                                    </li>
                                </ul>
                            </div>

                            <!-- Order progress -->
                            <div class="focus-ticket__progress">
                                <div
                                    v-for="t in store.tickets.filter(x => x.saleId === ticket.saleId)"
                                    :key="t.id"
                                    class="ticket-card__progress-seg"
                                    :style="{ background: t.status === 'ready' ? '#10b981' : t.status === 'preparing' ? '#f59e0b' : '#d1d5db' }"
                                    :title="t.stationName + ': ' + t.status"
                                ></div>
                            </div>

                            <!-- Footer -->
                            <div class="focus-ticket__footer">
                                <span v-if="orderProgress(ticket).complete" class="order-complete-badge">
                                    <i class="pi pi-check-circle"></i> Orden lista
                                </span>
                                <span v-else class="order-progress-badge">
                                    {{ orderProgress(ticket).ready }}/{{ orderProgress(ticket).total }}
                                </span>

                                <div class="flex gap-2">
                                    <button
                                        v-if="ticket.status === 'ready'"
                                        :class="['call-waiter-btn', calledWaiterIds.has(ticket.id) && 'call-waiter-btn--called']"
                                        :title="calledWaiterIds.has(ticket.id) ? 'Mesero avisado' : 'Llamar mesero'"
                                        @click="callWaiter(ticket.id)"
                                    >
                                        <i :class="['pi', calledWaiterIds.has(ticket.id) ? 'pi-check' : 'pi-bell']"></i>
                                    </button>
                                    <button
                                        v-if="TICKET_STATUS_CONFIG[ticket.status].next"
                                        class="focus-ticket__advance-btn"
                                        :style="{ background: TICKET_STATUS_CONFIG[TICKET_STATUS_CONFIG[ticket.status].next]?.color ?? '#6366f1' }"
                                        @click="store.advanceTicket(ticket.id)"
                                    >
                                        <i class="pi pi-arrow-right"></i>
                                        {{ TICKET_STATUS_CONFIG[ticket.status].nextLabel }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════════════════ TAB: PANTALLA KANBAN ══════════════════════ -->
        <div v-else-if="activeTab === 'display'" class="p-4 flex flex-column gap-4 display-tab">

            <!-- ── Compact stat bar (clickable status filters) ────────── -->
            <div class="stat-bar">
                <button
                    :class="['stat-bar__item', statusFilter === '' && 'stat-bar__item--active']"
                    @click="statusFilter = ''"
                >
                    <span class="stat-bar__num">{{ store.totalToday }}</span>
                    <span class="stat-bar__lbl">Total hoy</span>
                </button>
                <div class="stat-bar__sep"></div>
                <button
                    :class="['stat-bar__item', statusFilter === 'received' && 'stat-bar__item--active']"
                    style="--sc:#3b82f6"
                    @click="statusFilter = statusFilter === 'received' ? '' : 'received'"
                >
                    <span class="stat-bar__dot" style="background:#3b82f6"></span>
                    <span class="stat-bar__num" style="color:#3b82f6">{{ store.receivedTickets.length }}</span>
                    <span class="stat-bar__lbl">Recibidos</span>
                </button>
                <button
                    :class="['stat-bar__item', statusFilter === 'preparing' && 'stat-bar__item--active']"
                    style="--sc:#f59e0b"
                    @click="statusFilter = statusFilter === 'preparing' ? '' : 'preparing'"
                >
                    <span class="stat-bar__dot" style="background:#f59e0b"></span>
                    <span class="stat-bar__num" style="color:#f59e0b">{{ store.preparingTickets.length }}</span>
                    <span class="stat-bar__lbl">En Preparación</span>
                </button>
                <button
                    :class="['stat-bar__item', statusFilter === 'ready' && 'stat-bar__item--active']"
                    style="--sc:#10b981"
                    @click="statusFilter = statusFilter === 'ready' ? '' : 'ready'"
                >
                    <span class="stat-bar__dot" style="background:#10b981"></span>
                    <span class="stat-bar__num" style="color:#10b981">{{ store.readyCount }}</span>
                    <span class="stat-bar__lbl">Listos</span>
                </button>
            </div>

            <!-- ── Single toolbar: search + station pills ────────────── -->
            <div class="toolbar">
                <div class="toolbar__search">
                    <i class="pi pi-search toolbar__search-icon"></i>
                    <input
                        v-model="searchQuery"
                        type="text"
                        class="toolbar__search-input"
                        placeholder="Mesa, # orden, plato o estación…"
                    />
                    <button v-if="hasActiveSearch" class="toolbar__clear" title="Limpiar" @click="clearSearch">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <div class="toolbar__sep"></div>

                <div class="toolbar__stations">
                    <button
                        :class="['st-pill', store.selectedStationId === null && 'st-pill--all']"
                        @click="store.selectStation(null)"
                    >
                        <i class="pi pi-th-large"></i>
                        Todas
                        <span class="st-pill__count">{{ store.totalToday }}</span>
                    </button>
                    <button
                        v-for="st in store.activeStations"
                        :key="st.id"
                        :class="['st-pill', store.selectedStationId === st.id && 'st-pill--active']"
                        :style="store.selectedStationId === st.id
                            ? { background: st.color, borderColor: st.color, color: '#fff' }
                            : { borderLeftColor: st.color }"
                        @click="store.selectStation(st.id)"
                    >
                        {{ st.name }}
                        <span class="st-pill__count">{{ store.tickets.filter(t => t.stationId === st.id).length }}</span>
                    </button>
                </div>

                <span v-if="hasActiveSearch" class="toolbar__results">
                    {{ searchedTickets.length }} resultado{{ searchedTickets.length !== 1 ? 's' : '' }}
                </span>
            </div>

            <!-- Kanban board -->
            <div class="kanban-board">
                <div
                    v-for="col in TICKET_COLUMNS"
                    :key="col.key"
                    :class="['kanban-col', hasAnyTickets && ticketsByColumn(col.key).length === 0 && 'kanban-col--empty-col']"
                >
                    <!-- Column header -->
                    <div class="kanban-col__header" :style="{ background: col.bg, borderBottom: `2px solid ${col.color}` }">
                        <template v-if="hasAnyTickets && ticketsByColumn(col.key).length === 0">
                            <div class="kanban-col__header-collapsed">
                                <i :class="['pi', TICKET_STATUS_CONFIG[col.key].icon]" :style="{ color: col.color }"></i>
                                <span class="kanban-col__header-collapsed__label" :style="{ color: col.color }">{{ col.label }}</span>
                                <span class="kanban-col__count" :style="{ background: col.color }">0</span>
                            </div>
                        </template>
                        <template v-else>
                            <div class="flex align-items-center gap-2">
                                <i :class="['pi', TICKET_STATUS_CONFIG[col.key].icon]" :style="{ color: col.color }"></i>
                                <span class="font-semibold" :style="{ color: col.color }">{{ col.label }}</span>
                            </div>
                            <span class="kanban-col__count" :style="{ background: col.color }">
                                {{ ticketsByColumn(col.key).length }}
                            </span>
                        </template>
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
                            :class="['ticket-card', newTicketIds.has(ticket.id) && 'ticket-card--new', timeUrgency(ticket) === 'critical' && 'ticket-card--critical']"
                            :style="{ borderLeft: `4px solid ${urgencyBorderColor(ticket)}` }"
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
                                    <button
                                        v-if="TICKET_STATUS_CONFIG[ticket.status].canCancel"
                                        class="ticket-card__cancel-btn ticket-card__cancel-btn--corner"
                                        title="Cancelar ticket"
                                        @click="openCancelDialog(ticket.id)"
                                    >
                                        <i class="pi pi-times"></i>
                                    </button>
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

                            <!-- Order progress bar -->
                            <div class="ticket-card__progress">
                                <div
                                    v-for="t in store.tickets.filter(x => x.saleId === ticket.saleId)"
                                    :key="t.id"
                                    class="ticket-card__progress-seg"
                                    :style="{ background: t.status === 'ready' ? '#10b981' : t.status === 'preparing' ? '#f59e0b' : '#d1d5db' }"
                                    :title="t.stationName + ': ' + t.status"
                                ></div>
                            </div>

                            <!-- Footer: time semaphore + action -->
                            <div class="ticket-card__footer">
                                <span :class="['ticket-time', 'ticket-time--' + timeUrgency(ticket)]">
                                    <i class="pi pi-clock"></i>
                                    {{ elapsedTime(ticket.createdAt) }}
                                </span>
                                <div class="flex align-items-center gap-1">
                                    <span
                                        v-if="orderProgress(ticket).complete"
                                        class="order-complete-badge"
                                    >
                                        <i class="pi pi-check-circle"></i> Orden lista
                                    </span>
                                    <span v-else class="order-progress-badge">
                                        {{ orderProgress(ticket).ready }}/{{ orderProgress(ticket).total }}
                                    </span>
                                    <button
                                        v-if="ticket.status === 'ready'"
                                        :class="['call-waiter-btn', calledWaiterIds.has(ticket.id) && 'call-waiter-btn--called']"
                                        :title="calledWaiterIds.has(ticket.id) ? 'Mesero avisado' : 'Llamar mesero'"
                                        @click="callWaiter(ticket.id)"
                                    >
                                        <i :class="['pi', calledWaiterIds.has(ticket.id) ? 'pi-check' : 'pi-bell']"></i>
                                    </button>
                                    <button
                                        v-if="TICKET_STATUS_CONFIG[ticket.status].next"
                                        class="ticket-card__advance-btn"
                                        :style="{ background: TICKET_STATUS_CONFIG[TICKET_STATUS_CONFIG[ticket.status].next]?.color ?? '#6366f1' }"
                                        @click="store.advanceTicket(ticket.id)"
                                    >
                                        {{ TICKET_STATUS_CONFIG[ticket.status].nextLabel }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════════════════ TAB: ESTACIONES CRUD ═══════════════════════ -->
        <div v-else-if="activeTab === 'stations'" class="p-4 flex flex-column gap-4">

            <!-- Actions -->
            <div class="flex justify-content-end">
                <pv-button label="Nueva Estación" icon="pi pi-plus" size="small" severity="success" @click="openCreateStation" />
            </div>

            <!-- Station grid -->
            <div v-if="store.stations.length > 0" class="stations-grid">
                <div
                    v-for="station in store.stations"
                    :key="station.id"
                    :class="['station-card', !station.isActive && 'station-card--inactive']"
                    :style="{ '--station-color': station.color }"
                >
                    <!-- Top accent bar -->
                    <div class="station-card__top-bar" :style="{ background: station.isActive ? station.color : '#9ca3af' }"></div>

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
                        <button
                            :class="['station-action-btn', 'station-action-btn--power', station.isActive ? 'station-action-btn--power-on' : 'station-action-btn--power-off']"
                            :title="station.isActive ? 'Desactivar estación' : 'Activar estación'"
                            @click="store.updateStation(station.id, { ...station, isActive: !station.isActive })"
                        >
                            <i class="pi pi-power-off"></i>
                        </button>
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

        <!-- ══════════════════ TAB: HISTORIAL ════════════════════════════ -->
        <div v-else-if="activeTab === 'history'" class="p-4 flex flex-column gap-3 display-tab">

            <!-- Empty state -->
            <div v-if="store.filteredHistory.length === 0" class="flex flex-column align-items-center justify-content-center gap-2 py-6">
                <i class="pi pi-history text-4xl text-color-secondary"></i>
                <span class="text-color-secondary">Sin historial para este turno</span>
            </div>

            <!-- History list -->
            <div v-else class="history-list">
                <div
                    v-for="ticket in store.filteredHistory"
                    :key="ticket.id"
                    class="history-row"
                    :style="{ borderLeft: `4px solid ${TICKET_STATUS_CONFIG[ticket.status]?.color ?? '#9ca3af'}` }"
                >
                    <!-- Status chip -->
                    <span
                        class="history-row__status"
                        :style="{ background: TICKET_STATUS_CONFIG[ticket.status]?.bg ?? '#f3f4f6', color: TICKET_STATUS_CONFIG[ticket.status]?.color ?? '#6b7280' }"
                    >
                        <i :class="['pi', TICKET_STATUS_CONFIG[ticket.status]?.icon ?? 'pi-circle']"></i>
                        {{ TICKET_STATUS_CONFIG[ticket.status]?.label ?? ticket.status }}
                    </span>

                    <!-- Table + order -->
                    <div class="history-row__meta">
                        <span class="history-row__table">Mesa {{ ticket.tableNumber }}</span>
                        <span class="history-row__order">#{{ ticket.saleId }}</span>
                        <span
                            class="history-row__station"
                            :style="{ background: store.stations.find(s => s.id === ticket.stationId)?.color + '22', color: store.stations.find(s => s.id === ticket.stationId)?.color }"
                        >{{ ticket.stationName }}</span>
                    </div>

                    <!-- Items summary -->
                    <div class="history-row__items">
                        <span v-for="(item, i) in ticket.items" :key="i" class="history-row__item">
                            {{ item.quantity }}× {{ item.menuItemName }}<template v-if="i < ticket.items.length - 1">, </template>
                        </span>
                    </div>

                    <!-- Timestamps -->
                    <div class="history-row__times">
                        <span v-if="ticket.createdAt" class="history-row__ts">
                            <i class="pi pi-inbox"></i> {{ new Date(ticket.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) }}
                        </span>
                        <span v-if="ticket.readyAt" class="history-row__ts history-row__ts--ready">
                            <i class="pi pi-check"></i> {{ new Date(ticket.readyAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) }}
                        </span>
                        <span v-if="ticket.deliveredAt" class="history-row__ts history-row__ts--delivered">
                            <i class="pi pi-user"></i> {{ new Date(ticket.deliveredAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) }}
                        </span>
                        <span v-if="ticket.cancelledAt" class="history-row__ts history-row__ts--cancelled">
                            <i class="pi pi-times-circle"></i> {{ new Date(ticket.cancelledAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) }}
                        </span>
                        <span v-if="ticket.cancelReason" class="history-row__reason">
                            "{{ ticket.cancelReason }}"
                        </span>
                    </div>
                </div>
            </div>
        </div>

        </module-state-feedback>
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

/* Loading/Error states handled by shared ModuleStateFeedback component */

/* ── Compact stat bar ─────────────────────────────────────────────────── */
.stat-bar {
    display: flex;
    align-items: stretch;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
}

.stat-bar__item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s;
    position: relative;
}
.stat-bar__item:hover { background: #f9fafb; }
.stat-bar__item--active { background: #f5f3ff; }
.stat-bar__item--active::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: var(--sc, #6366f1);
}

.stat-bar__dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.stat-bar__num {
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1;
    color: #111827;
}

.stat-bar__lbl {
    font-size: 0.72rem;
    font-weight: 500;
    color: #6b7280;
    white-space: nowrap;
}

.stat-bar__sep {
    width: 1px;
    background: #e5e7eb;
    flex-shrink: 0;
}

/* ── Single toolbar ───────────────────────────────────────────────────── */
.toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 0.55rem 0.85rem;
    flex-shrink: 0;
}

.toolbar__search {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex: 1;
    min-width: 180px;
    background: #f9fafb;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.4rem 0.7rem;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.toolbar__search:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: #fff;
}

.toolbar__search-icon { color: #9ca3af; font-size: 0.85rem; flex-shrink: 0; }

.toolbar__search-input {
    flex: 1; border: none; background: transparent;
    outline: none; font-size: 0.83rem; color: #111827; min-width: 0;
}
.toolbar__search-input::placeholder { color: #9ca3af; }

.toolbar__clear {
    display: flex; align-items: center; padding: 0.1rem;
    border: none; background: transparent; color: #9ca3af;
    cursor: pointer; font-size: 0.75rem; flex-shrink: 0;
}
.toolbar__clear:hover { color: #374151; }

.toolbar__sep {
    width: 1px; height: 1.5rem;
    background: #e5e7eb; flex-shrink: 0;
}

.toolbar__stations {
    display: flex; align-items: center;
    flex-wrap: wrap; gap: 0.3rem;
}

.st-pill {
    display: inline-flex; align-items: center; gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    border: 1.5px solid #e5e7eb;
    border-left-width: 3px;
    background: #fff;
    font-size: 0.72rem; font-weight: 600;
    color: #374151; cursor: pointer;
    transition: all 0.15s;
}
.st-pill:hover { background: #f3f4f6; }
.st-pill--all { background: #ede9fe; border-color: #6366f1; color: #4338ca; }
.st-pill--active { color: #fff; }

.st-pill__count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.1rem; height: 1.1rem;
    border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    background: rgba(0,0,0,0.12); color: inherit;
    padding: 0 0.2rem;
}

.toolbar__results {
    font-size: 0.72rem; font-weight: 600;
    color: #6366f1; white-space: nowrap; margin-left: auto;
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

/* Modo Estación button in tab bar */
.tab-spacer { flex: 1; }

.tab-btn--focus {
    color: #7c3aed;
    font-weight: 600;
    margin-left: auto;
    border: 1.5px solid #ede9fe;
    border-radius: 8px;
    margin: 0.35rem 0;
    padding: 0.35rem 1rem;
    background: #f5f3ff;
    transition: background 0.15s, border-color 0.15s;
}
.tab-btn--focus:hover { background: #ede9fe; border-color: #c4b5fd; }

/* ── Station picker overlay ───────────────────────────────────────────── */
.station-picker-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
}

.station-picker-panel {
    background: #fff;
    border-radius: 20px;
    width: 100%; max-width: 680px;
    padding: 2rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    max-height: 85vh; overflow-y: auto;
}

.station-picker-panel__header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 1rem;
    margin-bottom: 1.75rem;
}

.station-picker-panel__title {
    font-size: 1.25rem; font-weight: 800; color: #111827;
    display: flex; align-items: center; gap: 0.5rem; margin: 0;
}
.station-picker-panel__title .pi { color: #7c3aed; }

.station-picker-panel__sub {
    font-size: 0.82rem; color: #6b7280; margin: 0.25rem 0 0;
}

.station-picker-panel__close {
    flex-shrink: 0; width: 2.25rem; height: 2.25rem;
    border: 1px solid #e5e7eb; border-radius: 8px;
    background: #f9fafb; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #6b7280; font-size: 0.85rem;
    transition: background 0.12s, color 0.12s;
}
.station-picker-panel__close:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

.station-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.85rem;
}

.station-picker-card {
    display: flex; flex-direction: column;
    align-items: center; gap: 0.75rem;
    padding: 1.5rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 14px;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
    position: relative; overflow: hidden;
}
.station-picker-card:hover {
    border-color: var(--stc, #6366f1);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--stc, #6366f1) 15%, transparent);
    transform: translateY(-2px);
}

.station-picker-card__dot {
    position: absolute; top: 0; left: 0; right: 0; height: 4px;
}

.station-picker-card__initial {
    width: 3.5rem; height: 3.5rem; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; font-weight: 800; line-height: 1;
}

.station-picker-card__name {
    font-size: 1rem; font-weight: 700; color: #111827; text-align: center;
}

.station-picker-card__count {
    font-size: 0.75rem; font-weight: 500; color: #6b7280;
}

.station-picker-empty {
    text-align: center; color: #9ca3af; font-size: 0.85rem; margin: 1rem 0 0;
}

/* Picker fade transition */
.picker-fade-enter-active, .picker-fade-leave-active { transition: opacity 0.2s; }
.picker-fade-enter-from, .picker-fade-leave-to { opacity: 0; }

/* ── Focus mode layout ────────────────────────────────────────────────── */
.focus-mode {
    display: flex; flex-direction: column;
    flex: 1; min-height: 0; overflow: hidden;
}

.focus-hdr {
    display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;
    padding: 0.85rem 1.25rem;
    background: #fff;
    border-bottom: 3px solid var(--fsc, #6366f1);
    flex-shrink: 0;
}

.focus-hdr__left {
    display: flex; align-items: center; gap: 0.85rem;
}

.focus-hdr__dot {
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--fsc, #6366f1);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--fsc, #6366f1) 25%, transparent);
    flex-shrink: 0;
}

.focus-hdr__name {
    font-size: 1.2rem; font-weight: 800; color: #111827; line-height: 1.1;
}
.focus-hdr__desc {
    font-size: 0.75rem; color: #6b7280; margin-top: 2px;
}

/* Mini stat counters inside focus header */
.focus-stats {
    display: flex; align-items: stretch;
    border: 1px solid #e5e7eb; border-radius: 10px;
    overflow: hidden; flex-shrink: 0;
}

.focus-stat {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 0.15rem;
    padding: 0.5rem 0.85rem;
    border: none; background: transparent; cursor: pointer;
    transition: background 0.12s;
}
.focus-stat:hover { background: #f9fafb; }
.focus-stat--active { background: #f5f3ff; }

.focus-stat__num { font-size: 1.25rem; font-weight: 800; line-height: 1; }
.focus-stat__lbl { font-size: 0.65rem; font-weight: 500; color: #6b7280; white-space: nowrap; }

.focus-stats__sep { width: 1px; background: #e5e7eb; flex-shrink: 0; }

.focus-hdr__right {
    display: flex; align-items: center; gap: 0.75rem;
    margin-left: auto; flex-shrink: 0;
}

.focus-search {
    display: flex; align-items: center; gap: 0.4rem;
    background: #f9fafb; border: 1.5px solid #e5e7eb;
    border-radius: 8px; padding: 0.35rem 0.65rem;
    transition: border-color 0.15s;
}
.focus-search:focus-within { border-color: var(--fsc, #6366f1); background: #fff; }
.focus-search .pi-search { color: #9ca3af; font-size: 0.82rem; }
.focus-search input {
    border: none; background: transparent; outline: none;
    font-size: 0.82rem; color: #111827; width: 160px;
}
.focus-search input::placeholder { color: #9ca3af; }
.focus-search button {
    border: none; background: transparent; color: #9ca3af;
    cursor: pointer; display: flex; align-items: center;
    font-size: 0.72rem; padding: 0.1rem;
}
.focus-search button:hover { color: #374151; }

.focus-exit-btn {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.45rem 1rem;
    border: 1.5px solid #e5e7eb; border-radius: 8px;
    background: #fff; color: #374151;
    font-size: 0.82rem; font-weight: 600; cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
}
.focus-exit-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

/* ── Focus mode kanban ────────────────────────────────────────────────── */
.focus-kanban {
    flex: 1; min-height: 0;
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    overflow: hidden;
    align-items: flex-start;
}

.focus-col {
    flex: 1;
    min-width: 0;
    display: flex; flex-direction: column;
    border-radius: 10px; overflow: hidden;
    border: 1px solid #e5e7eb; background: #f9fafb;
    min-height: 0;
    transition: flex 0.25s ease;
}

.focus-col--empty-col {
    flex: 0 0 120px;
}

.focus-col__header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    flex-shrink: 0;
}

.focus-col__header-collapsed {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 0.35rem;
    padding: 0.15rem 0;
}

.focus-col__header-collapsed__label {
    font-size: 0.65rem;
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.focus-col__count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.75rem; height: 1.75rem;
    border-radius: 999px; color: #fff;
    font-size: 0.85rem; font-weight: 700;
    padding: 0 0.4rem;
}

.focus-col__body {
    flex: 1; overflow-y: auto;
    padding: 0.85rem;
    display: flex; flex-direction: column; gap: 0.85rem;
}

.focus-col__empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 0.5rem; padding: 2rem 0;
}

.focus-ticket {
    background: #fff; border-radius: 12px;
    border: 1px solid #e5e7eb; border-left-width: 6px;
    display: flex; flex-direction: column;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    overflow: hidden;
}

.focus-ticket__body {
    padding: 0.9rem 1rem 0.75rem;
}

.focus-ticket__meta {
    display: flex; align-items: center; gap: 0.5rem;
    margin-bottom: 0.65rem;
}

.focus-ticket__table {
    font-size: 1.1rem; font-weight: 800; color: #111827;
}

.focus-ticket__order {
    font-size: 0.8rem; color: #6b7280;
    background: #f3f4f6; border-radius: 5px;
    padding: 0.15rem 0.4rem;
}

.focus-ticket__items {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 0.45rem;
}

.focus-ticket__item {
    display: flex; align-items: baseline; gap: 0.5rem;
    font-size: 0.92rem;
}

.focus-ticket__qty { font-weight: 800; color: #374151; flex-shrink: 0; font-size: 1rem; }
.focus-ticket__item-name { color: #111827; flex: 1; }
.focus-ticket__note { font-size: 0.75rem; color: #9ca3af; font-style: italic; }

.focus-ticket__progress {
    display: flex; gap: 3px; height: 5px; margin: 0 1rem;
}

.focus-ticket__footer {
    display: flex; align-items: center;
    justify-content: space-between; gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid #f3f4f6;
    margin-top: 0.5rem;
}

.focus-ticket__advance-btn {
    display: flex; align-items: center; gap: 0.4rem;
    border: none; border-radius: 8px;
    padding: 0.5rem 1.1rem;
    color: #fff; font-size: 0.85rem; font-weight: 700;
    cursor: pointer; transition: opacity 0.12s;
}
.focus-ticket__advance-btn:hover { opacity: 0.87; }

/* ── Display tab scrollable ───────────────────────────────────────────── */
.display-tab {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

/* ── Stat cards (legacy) ──────────────────────────────────────────────── */
.stat-card { min-width: 130px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── Kanban board ─────────────────────────────────────────────────────── */
.kanban-board {
    display: flex;
    gap: 1rem;
    min-height: 400px;
    align-items: flex-start;
}

.kanban-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    transition: flex 0.25s ease;
}

.kanban-col--empty-col {
    flex: 0 0 120px;
}

.kanban-col__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 0.9rem;
    flex-shrink: 0;
}

.kanban-col__header-collapsed {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 0.35rem;
    padding: 0.15rem 0;
}

.kanban-col__header-collapsed__label {
    font-size: 0.65rem;
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

/* ── Time semaphore ───────────────────────────────────────────────────── */
.ticket-time {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    flex-shrink: 0;
}
.ticket-time--ok       { background: #d1fae5; color: #065f46; }
.ticket-time--warn     { background: #fef3c7; color: #92400e; }
.ticket-time--critical {
    background: #fee2e2; color: #991b1b;
    animation: pulse-red 1.2s ease-in-out infinite;
}
@keyframes pulse-red {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.65; }
}

/* ── New ticket flash ───────────────────────────────────────────────────── */
.ticket-card--new {
    animation: new-ticket-flash 0.55s ease-in-out 5;
    outline: 2px solid #3b82f6;
    outline-offset: -1px;
}
@keyframes new-ticket-flash {
    0%, 100% { background: #fff; }
    50%       { background: #eff6ff; }
}

/* ── Critical card tint ────────────────────────────────────────────────── */
.ticket-card--critical { background: #fff8f8; }

/* ── Order progress bar ───────────────────────────────────────────────── */
.ticket-card__progress {
    display: flex;
    gap: 3px;
    height: 4px;
    border-radius: 999px;
    overflow: hidden;
}
.ticket-card__progress-seg {
    flex: 1;
    border-radius: 999px;
    transition: background 0.3s;
}

/* ── Order badges ─────────────────────────────────────────────────────── */
.order-complete-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    font-weight: 700;
    background: #d1fae5;
    color: #065f46;
    border-radius: 999px;
    padding: 0.18rem 0.5rem;
}

.order-progress-badge {
    font-size: 0.68rem;
    font-weight: 600;
    color: #9ca3af;
    background: #f3f4f6;
    border-radius: 999px;
    padding: 0.18rem 0.45rem;
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

.ticket-card__archive-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    border: none;
    border-radius: 6px;
    padding: 0.3rem 0.7rem;
    background: #f3f4f6;
    color: #374151;
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
}
.ticket-card__archive-btn:hover { background: #e5e7eb; }

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
.station-action-btn--edit:hover   { background: #eff6ff; color: #2563eb; border-color: #93c5fd; }
.station-action-btn--delete:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }

.station-action-btn--power { transition: background 0.15s, color 0.15s, border-color 0.15s; }
.station-action-btn--power-on  { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
.station-action-btn--power-on:hover  { background: #dcfce7; color: #15803d; border-color: #86efac; }
.station-action-btn--power-off { color: #9ca3af; border-color: #e5e7eb; background: #f9fafb; }
.station-action-btn--power-off:hover { background: #f0fdf4; color: #16a34a; border-color: #86efac; }

.station-card--inactive { opacity: 0.55; filter: grayscale(0.7); transition: opacity 0.2s, filter 0.2s; }
.station-card--inactive:hover { opacity: 0.8; filter: grayscale(0.3); }

/* ── Cancel ticket button (icon-only, on ticket cards) ───────────────── */
.ticket-card__cancel-btn {
    display: flex; align-items: center; justify-content: center;
    width: 1.75rem; height: 1.75rem;
    border: 1.5px solid #fca5a5;
    border-radius: 6px;
    background: #fff5f5;
    color: #dc2626;
    font-size: 0.72rem;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s;
}
.ticket-card__cancel-btn:hover { background: #fee2e2; }

/* When in corner of header: hidden until hover */
.ticket-card__cancel-btn--corner {
    opacity: 0;
    transition: background 0.12s, opacity 0.15s;
}
.ticket-card:hover .ticket-card__cancel-btn--corner,
.focus-ticket:hover .ticket-card__cancel-btn--corner { opacity: 1; }

/* ── Call waiter button ────────────────────────────────────────────────── */
.call-waiter-btn {
    display: flex; align-items: center; justify-content: center;
    width: 1.75rem; height: 1.75rem;
    border: 1.5px solid #fbbf24;
    border-radius: 6px;
    background: #fffbeb;
    color: #d97706;
    font-size: 0.78rem;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s, border-color 0.12s;
}
.call-waiter-btn:hover { background: #fef3c7; }
.call-waiter-btn--called {
    background: #d1fae5;
    border-color: #6ee7b7;
    color: #059669;
    animation: waiter-called-pulse 0.7s ease-in-out 2;
}
@keyframes waiter-called-pulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.2); }
}

/* ── Cancel dialog ───────────────────────────────────────────────────── */
.cancel-dialog {
    background: #fff;
    border-radius: 16px;
    width: 100%; max-width: 460px;
    padding: 1.75rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}

.cancel-dialog__header {
    display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;
}

.cancel-dialog__icon {
    width: 3rem; height: 3rem; border-radius: 10px;
    background: #fee2e2; color: #dc2626;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.25rem; flex-shrink: 0;
}

.cancel-dialog__title {
    font-size: 1.1rem; font-weight: 800; color: #111827; margin: 0;
}
.cancel-dialog__sub {
    font-size: 0.8rem; color: #6b7280; margin: 0.25rem 0 0;
}

.cancel-dialog__body { margin-bottom: 1.5rem; }

.cancel-dialog__label {
    display: block; font-size: 0.82rem; font-weight: 600;
    color: #374151; margin-bottom: 0.5rem;
}

.cancel-dialog__textarea {
    width: 100%; border: 1.5px solid #e5e7eb; border-radius: 8px;
    padding: 0.65rem 0.85rem; font-size: 0.85rem; color: #111827;
    resize: vertical; outline: none; transition: border-color 0.15s;
    font-family: inherit; box-sizing: border-box;
}
.cancel-dialog__textarea:focus { border-color: #f87171; }

.cancel-dialog__footer {
    display: flex; gap: 0.75rem; justify-content: flex-end;
}

.cancel-dialog__btn-secondary {
    padding: 0.5rem 1.1rem; border: 1.5px solid #e5e7eb; border-radius: 8px;
    background: #fff; color: #374151; font-size: 0.85rem; font-weight: 600;
    cursor: pointer; transition: background 0.12s;
}
.cancel-dialog__btn-secondary:hover { background: #f9fafb; }

.cancel-dialog__btn-danger {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 1.25rem; border: none; border-radius: 8px;
    background: #dc2626; color: #fff; font-size: 0.85rem; font-weight: 700;
    cursor: pointer; transition: background 0.12s;
}
.cancel-dialog__btn-danger:hover { background: #b91c1c; }

/* ── Tab badge (history count) ───────────────────────────────────────── */
.tab-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.1rem; height: 1.1rem;
    background: #ef4444; color: #fff;
    border-radius: 999px; font-size: 0.62rem; font-weight: 700;
    padding: 0 0.2rem; margin-left: 0.25rem;
}

/* ── History list ────────────────────────────────────────────────────── */
.history-list {
    display: flex; flex-direction: column; gap: 0.5rem;
}

.history-row {
    display: flex; align-items: center; flex-wrap: wrap;
    gap: 0.65rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-left-width: 4px;
    border-radius: 8px;
    padding: 0.65rem 1rem;
}

.history-row__status {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.72rem; font-weight: 700;
    border-radius: 999px; padding: 0.2rem 0.6rem;
    flex-shrink: 0;
}

.history-row__meta {
    display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
}

.history-row__table { font-size: 0.88rem; font-weight: 700; color: #111827; }

.history-row__order {
    font-size: 0.72rem; color: #6b7280;
    background: #f3f4f6; border-radius: 4px; padding: 0.1rem 0.35rem;
}

.history-row__station {
    font-size: 0.68rem; font-weight: 600;
    border-radius: 999px; padding: 0.15rem 0.5rem;
}

.history-row__items {
    flex: 1; min-width: 0;
    font-size: 0.8rem; color: #374151;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.history-row__item { color: #374151; }

.history-row__times {
    display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap;
}

.history-row__ts {
    display: inline-flex; align-items: center; gap: 0.25rem;
    font-size: 0.72rem; color: #6b7280;
}
.history-row__ts--ready     { color: #059669; }
.history-row__ts--delivered { color: #6366f1; }
.history-row__ts--cancelled { color: #dc2626; }

.history-row__reason {
    font-size: 0.72rem; color: #9ca3af; font-style: italic;
    max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
</style>
