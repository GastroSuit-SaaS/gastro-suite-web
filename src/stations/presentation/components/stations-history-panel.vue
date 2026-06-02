<script setup>
import { ref, computed, watch } from 'vue'
import { useStationsStore } from '../../application/stations.store.js'
import { TICKET_STATUS } from '../../domain/models/station-ticket.entity.js'
import {
    filterHistoryTickets,
    historySummaryStats,
} from '../utils/stations-history.utils.js'
import DataManager from '../../../shared/presentation/components/data-manager.vue'
import TicketHistoryDetailDialog from './ticket-history-detail-dialog.vue'

const store = useStationsStore()

const statusFilter = ref('')
const stationFilter = ref('')
const dateRange = ref('today')
const specificDate = ref(new Date())
const searchQuery = ref('')

watch(dateRange, (mode) => {
    if (mode === 'day' && !specificDate.value) {
        specificDate.value = new Date()
    }
})

const detailVisible = ref(false)
const selectedTicket = ref(null)

const stationOptions = computed(() => [
    { label: 'Todas las estaciones', value: '' },
    ...store.activeStations.map(s => ({ label: s.name, value: String(s.id) })),
])

const statusOptions = [
    { label: 'Todos los estados', value: '' },
    { label: 'Entregado', value: TICKET_STATUS.DELIVERED },
    { label: 'Cancelado', value: TICKET_STATUS.CANCELLED },
]

const dateRangeOptions = [
    { label: 'Hoy', value: 'today' },
    { label: 'Fecha específica', value: 'day' },
    { label: 'Últimos 7 días', value: '7d' },
    { label: 'Últimos 30 días', value: '30d' },
    { label: 'Todo el historial', value: 'all' },
]

const historyFilterParams = computed(() => ({
    status: statusFilter.value || null,
    stationId: stationFilter.value || null,
    dateRange: dateRange.value,
    specificDate: dateRange.value === 'day' ? specificDate.value : null,
    search: searchQuery.value,
}))

const historyRows = computed(() =>
    filterHistoryTickets(store.ticketHistory, {
        ...historyFilterParams.value,
    }),
)

const stats = computed(() => {
    const rows = filterHistoryTickets(store.ticketHistory, {
        status: historyFilterParams.value.status,
        stationId: historyFilterParams.value.stationId,
        dateRange: historyFilterParams.value.dateRange,
        specificDate: historyFilterParams.value.specificDate,
        search: '',
    })
    return historySummaryStats(rows.map(r => r.ticket))
})

const tableColumns = [
    { field: 'displayRef', header: 'Comanda', sortable: true, style: 'min-width: 90px' },
    { field: 'orderRef', header: 'Orden', sortable: true, style: 'min-width: 72px' },
    { field: 'tableLabel', header: 'Mesa', sortable: true, style: 'min-width: 100px' },
    { field: 'stationName', header: 'Estación', sortable: true, style: 'min-width: 120px' },
    { field: 'itemsSummary', header: 'Resumen ítems', sortable: false, style: 'min-width: 200px', bodyStyle: 'text-align: left' },
    { field: 'itemCount', header: 'Cant.', sortable: true, style: 'min-width: 64px' },
    { field: 'statusLabel', header: 'Estado', sortable: true, template: 'history-status' },
    { field: 'createdAtLabel', header: 'Recibido', sortable: true, style: 'min-width: 110px' },
    { field: 'closedAtLabel', header: 'Cierre', sortable: true, style: 'min-width: 110px' },
]

function openDetail(row) {
    selectedTicket.value = row?.ticket ?? null
    detailVisible.value = true
}

function clearFilters() {
    statusFilter.value = ''
    stationFilter.value = ''
    dateRange.value = 'today'
    specificDate.value = new Date()
    searchQuery.value = ''
}
</script>

<template>
    <div class="stations-history">
        <div class="stations-history__stats">
            <div class="history-stat">
                <span class="history-stat__value">{{ stats.total }}</span>
                <span class="history-stat__label">En historial</span>
            </div>
            <div class="history-stat history-stat--delivered">
                <span class="history-stat__value">{{ stats.delivered }}</span>
                <span class="history-stat__label">Entregadas</span>
            </div>
            <div class="history-stat history-stat--cancelled">
                <span class="history-stat__value">{{ stats.cancelled }}</span>
                <span class="history-stat__label">Canceladas</span>
            </div>
            <div class="history-stat">
                <span class="history-stat__value">{{ stats.items }}</span>
                <span class="history-stat__label">Ítems servidos</span>
            </div>
        </div>

        <data-manager
            class="stations-history__table"
            :items="historyRows"
            :columns="tableColumns"
            :title="{ singular: 'comanda', plural: 'comandas' }"
            :loading="store.isLoading"
            :dynamic="true"
            :filtered-items="historyRows"
            :global-filter-value="searchQuery"
            search-placeholder="Buscar por comanda, orden, mesa, estación o ítem…"
            :show-new="false"
            :show-delete="false"
            :show-selection="false"
            :show-export="true"
            :show-edit-action="false"
            :show-delete-action="false"
            :view-action-icon-only="true"
            view-button-label="Ver detalle"
            export-button-label="Exportar CSV"
            :rows="15"
            @view-item-requested-manager="openDetail"
            @global-filter-change="searchQuery = $event"
            @clear-filters="clearFilters"
        >
            <template #filters>
                <pv-select
                    v-model="statusFilter"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Estado"
                    class="history-filter"
                />
                <pv-select
                    v-model="stationFilter"
                    :options="stationOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Estación"
                    class="history-filter history-filter--wide"
                />
                <pv-select
                    v-model="dateRange"
                    :options="dateRangeOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Periodo"
                    class="history-filter"
                />
                <pv-calendar
                    v-if="dateRange === 'day'"
                    v-model="specificDate"
                    date-format="dd/mm/yy"
                    show-icon
                    icon-display="input"
                    append-to="body"
                    placeholder="Elegir día"
                    class="history-filter history-filter--date"
                />
                <pv-button
                    icon="pi pi-filter-slash"
                    label="Limpiar"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="clearFilters"
                />
            </template>

            <template #history-status="{ data }">
                <span
                    class="history-status-chip"
                    :style="{ color: data.statusColor, background: data.statusBg, borderColor: data.statusColor }"
                >
                    {{ data.statusLabel }}
                </span>
            </template>
        </data-manager>

        <ticket-history-detail-dialog
            v-model:visible="detailVisible"
            :ticket="selectedTicket"
        />
    </div>
</template>

<style scoped>
.stations-history {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem 1rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.stations-history__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.65rem;
    flex-shrink: 0;
}

.history-stat {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.65rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.history-stat__value {
    font-size: 1.35rem;
    font-weight: 800;
    color: #111827;
    line-height: 1.1;
}

.history-stat__label {
    font-size: 0.72rem;
    color: #6b7280;
    font-weight: 500;
}

.history-stat--delivered .history-stat__value { color: #4f46e5; }
.history-stat--cancelled .history-stat__value { color: #dc2626; }

.stations-history__table {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.history-filter {
    width: 160px;
    min-width: 140px;
}

.history-filter--wide {
    width: 200px;
}

.history-filter--date {
    width: 11rem;
    min-width: 10rem;
}

.history-status-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    border: 1px solid;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}
</style>
