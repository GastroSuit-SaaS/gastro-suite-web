<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTablesStore } from '../../application/tables.store.js'
import DataManager from '../../../shared/presentation/components/data-manager.vue'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'
import CreateReservationDialog from '../components/create-reservation-dialog.vue'
import { useNotification } from '../../../shared/presentation/composables/use-notification.js'
import {
    RESERVATION_STATUS_LABELS,
    RESERVATIONS_MESSAGES,
    RESERVATION_STATUS_FILTER_OPTIONS,
    RESERVATION_TABLE_FILTER_OPTIONS,
} from '../constants/reservations.constants-ui.js'

const tablesStore = useTablesStore()
const router = useRouter()
const { showSuccess, showError } = useNotification()

const dialogOpen = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const tableFilter = ref('')

onMounted(async () => {
    await tablesStore.fetchAll()
    await tablesStore.fetchByDate()
})

const tableRows = computed(() =>
    tablesStore.reservations.map(r => ({
        id: r.id,
        timeLabel: formatTime(r.reservedAt),
        guestName: r.guestName,
        guestPhone: r.guestPhone || '—',
        partySize: r.partySize,
        tableLabel: r.tableNumber ? `Mesa ${r.tableNumber}` : '—',
        statusLabel: RESERVATION_STATUS_LABELS[r.status] ?? r.status,
        isActive: r.isActive,
        hasTable: Boolean(r.tableId),
        reservation: r,
    })),
)

const filteredRows = computed(() => {
    let rows = tableRows.value

    if (statusFilter.value) {
        rows = rows.filter(row => row.reservation.status === statusFilter.value)
    }
    if (tableFilter.value === 'with') {
        rows = rows.filter(row => row.hasTable)
    } else if (tableFilter.value === 'without') {
        rows = rows.filter(row => !row.hasTable)
    }

    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
        rows = rows.filter(row =>
            row.guestName?.toLowerCase().includes(q)
            || row.guestPhone?.toLowerCase().includes(q)
            || row.tableLabel?.toLowerCase().includes(q)
            || row.statusLabel?.toLowerCase().includes(q),
        )
    }
    return rows
})

const hasActiveFilters = computed(() =>
    Boolean(statusFilter.value || tableFilter.value || searchQuery.value.trim()),
)

const tableColumns = [
    { field: 'timeLabel', header: 'Hora', sortable: true, style: 'min-width: 120px' },
    { field: 'guestName', header: 'Comensal', sortable: true, style: 'min-width: 140px', bodyStyle: 'text-align: left' },
    { field: 'guestPhone', header: 'Tel.', sortable: true, style: 'min-width: 100px' },
    { field: 'partySize', header: 'Pax', sortable: true, style: 'min-width: 56px' },
    { field: 'tableLabel', header: 'Mesa', sortable: true, style: 'min-width: 90px' },
    { field: 'statusLabel', header: 'Estado', sortable: true, style: 'min-width: 100px' },
    { field: 'actions', header: 'Acciones', sortable: false, template: 'res-actions', style: 'min-width: 200px' },
]

function openCreate() {
    dialogOpen.value = true
}

function clearFilters() {
    statusFilter.value = ''
    tableFilter.value = ''
    searchQuery.value = ''
}

function onDateChange(event) {
    const value = event.target?.value
    if (value) tablesStore.fetchByDate(value)
}

async function onReservationSaved(payload) {
    const name = String(payload.guestName ?? '').trim()
    if (!name) {
        showError('El nombre del comensal es obligatorio')
        return
    }
    if (!payload.partySize || payload.partySize < 1) {
        showError('Indica al menos 1 comensal')
        return
    }
    if (!payload.reservedAt) {
        showError('La fecha y hora de reserva son obligatorias')
        return
    }

    const saved = await tablesStore.createReservation({ ...payload, guestName: name })
    if (saved) {
        showSuccess(RESERVATIONS_MESSAGES.CREATE_SUCCESS)
        dialogOpen.value = false
    } else if (tablesStore.reservationsError) {
        showError(tablesStore.reservationsError)
    }
}

async function cancelReservation(row) {
    const ok = await tablesStore.cancelReservation(row.reservation.id)
    if (ok) showSuccess(RESERVATIONS_MESSAGES.CANCEL_SUCCESS)
    else if (tablesStore.reservationsError) showError(tablesStore.reservationsError)
}

async function checkIn(row) {
    const r = row.reservation
    const tableId = await tablesStore.checkInReservation(r.id, r.partySize)
    if (!tableId) {
        if (tablesStore.reservationsError) showError(tablesStore.reservationsError)
        return
    }
    showSuccess(RESERVATIONS_MESSAGES.CHECKIN_SUCCESS)
    const table = tablesStore.tables.find(t => String(t.id) === String(tableId))
    if (table?.zoneId) {
        try {
            const sale = await tablesStore.openPosOrderAfterCheckIn(tableId, table.zoneId, r.partySize)
            if (sale?.id) {
                router.push({ name: 'pos-order', params: { saleId: String(sale.id) } })
                return
            }
        } catch (e) {
            showError(e?.message ?? 'No se pudo abrir la orden en POS')
            return
        }
    }
    router.push({ name: 'pos-terminal' })
}

function formatTime(d) {
    if (!d) return '—'
    return new Date(d).toLocaleString('es-PE', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
}
</script>

<template>
    <module-state-feedback
        :loading="tablesStore.reservationsLoading"
        :error="tablesStore.reservationsError"
        loading-label="Cargando reservas..."
        @retry="tablesStore.fetchByDate()"
    >
        <div class="reservations-panel">
            <data-manager
                class="reservations-panel__table"
                :items="filteredRows"
                :columns="tableColumns"
                :title="{ singular: 'reserva', plural: 'reservas' }"
                :loading="tablesStore.reservationsLoading"
                :dynamic="true"
                :filtered-items="filteredRows"
                :global-filter-value="searchQuery"
                :inline-toolbar="true"
                search-placeholder="Buscar comensal, teléfono o mesa…"
                new-button-label="Nueva reserva"
                :show-new="true"
                :show-delete="false"
                :show-selection="false"
                :show-export="false"
                :show-actions="false"
                :rows="12"
                @new-item-requested-manager="openCreate"
                @global-filter-change="searchQuery = $event"
                @clear-filters="clearFilters"
            >
                <template #filters="{ clearFilters: clearDmFilters }">
                    <input
                        :value="tablesStore.selectedDate"
                        type="date"
                        class="res-filter res-filter--date"
                        title="Fecha del listado"
                        @change="onDateChange"
                    />
                    <pv-select
                        v-model="statusFilter"
                        :options="RESERVATION_STATUS_FILTER_OPTIONS"
                        option-label="label"
                        option-value="value"
                        placeholder="Estado"
                        class="res-filter"
                    />
                    <pv-select
                        v-model="tableFilter"
                        :options="RESERVATION_TABLE_FILTER_OPTIONS"
                        option-label="label"
                        option-value="value"
                        placeholder="Mesa"
                        class="res-filter"
                    />
                    <pv-button
                        v-if="hasActiveFilters"
                        icon="pi pi-filter-slash"
                        label="Limpiar"
                        severity="secondary"
                        outlined
                        size="small"
                        class="res-filter-clear"
                        @click="clearFilters(); clearDmFilters()"
                    />
                </template>

                <template #res-actions="{ data }">
                    <div class="res-row-actions">
                        <pv-button
                            v-if="data.isActive && data.hasTable"
                            label="Check-in"
                            icon="pi pi-sign-in"
                            size="small"
                            @click="checkIn(data)"
                        />
                        <pv-button
                            v-if="data.isActive"
                            label="Cancelar"
                            icon="pi pi-times"
                            size="small"
                            severity="danger"
                            outlined
                            @click="cancelReservation(data)"
                        />
                    </div>
                </template>
            </data-manager>
        </div>

        <create-reservation-dialog
            :visible="dialogOpen"
            :tables="tablesStore.tables"
            @update:visible="dialogOpen = $event"
            @saved="onReservationSaved"
        />
    </module-state-feedback>
</template>

<style scoped>
.reservations-panel {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 1rem 1rem;
    min-height: 0;
    flex: 1;
}

.reservations-panel__table {
    flex: 1;
    min-height: 320px;
}

.res-filter {
    width: 11rem;
    min-width: 9rem;
    flex-shrink: 0;
}

.res-filter--date {
    height: 2.5rem;
    padding: 0 0.65rem;
    border: 1px solid #d1d5db;
    border-radius: var(--p-inputtext-border-radius, 6px);
    font-size: 0.875rem;
    color: #111827;
    background: #fff;
    font-family: inherit;
}

.res-filter-clear {
    flex-shrink: 0;
}

.res-row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    justify-content: center;
}
</style>
