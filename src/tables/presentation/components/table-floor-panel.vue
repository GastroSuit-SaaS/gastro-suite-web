<script setup>
import { TABLE_STATUS_CONFIG, formatTableLabel } from '../constants/tables.constants-ui.js'
import { useTableFloor } from '../composables/use-table-floor.js'

defineProps({
    showAdminActions: { type: Boolean, default: false },
})

const emit = defineEmits(['assign', 'open-order', 'mark-available', 'clear-reservation', 'create-table'])

const {
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
} = useTableFloor()
</script>

<template>
    <div class="table-floor">
        <div class="stat-row">
            <div class="stat-chip">
                <span class="stat-chip__label">Total Mesas</span>
                <span class="stat-chip__value">{{ store.totalTables }}</span>
            </div>
            <button
                :class="['stat-chip', 'stat-chip--btn', selectedStatus === 'available' && 'stat-chip--active-green']"
                type="button"
                @click="toggleStatus('available')"
            >
                <span class="stat-chip__dot" style="background:#22c55e"></span>
                <span class="stat-chip__label">Disponibles</span>
                <span class="stat-chip__value stat-chip__value--success">{{ store.availableTables.length }}</span>
            </button>
            <button
                :class="['stat-chip', 'stat-chip--btn', selectedStatus === 'reserved' && 'stat-chip--active-purple']"
                type="button"
                @click="toggleStatus('reserved')"
            >
                <span class="stat-chip__dot" style="background:#7c3aed"></span>
                <span class="stat-chip__label">Reservadas</span>
                <span class="stat-chip__value stat-chip__value--purple">{{ store.reservedTables.length }}</span>
            </button>
            <button
                :class="['stat-chip', 'stat-chip--btn', 'stat-chip--bar', selectedStatus === 'occupied' && 'stat-chip--active-red']"
                type="button"
                @click="toggleStatus('occupied')"
            >
                <span class="stat-chip__dot" style="background:#ef4444"></span>
                <span class="stat-chip__label">Ocupadas</span>
                <span class="stat-chip__value stat-chip__value--danger">
                    {{ store.occupiedTables.length }}<span class="stat-chip__sub">/{{ store.totalTables }}</span>
                </span>
                <div class="occupancy-bar">
                    <div class="occupancy-bar__fill" :style="{ width: occupancyRate + '%' }"></div>
                </div>
                <span class="stat-chip__pct">{{ occupancyRate }}%</span>
            </button>
            <button
                :class="['stat-chip', 'stat-chip--btn', selectedStatus === 'cleaning' && 'stat-chip--active-blue']"
                type="button"
                @click="toggleStatus('cleaning')"
            >
                <span class="stat-chip__dot" style="background:#3b82f6"></span>
                <span class="stat-chip__label">En Limpieza</span>
                <span class="stat-chip__value stat-chip__value--info">{{ store.cleaningTables.length }}</span>
            </button>
            <div class="stat-chip">
                <span class="stat-chip__dot" style="background:#059669"></span>
                <span class="stat-chip__label">Consumo activo</span>
                <span class="stat-chip__value stat-chip__value--money">S/ {{ activeConsumption.toFixed(2) }}</span>
            </div>
        </div>

        <div class="table-floor__toolbar flex align-items-center gap-2">
            <div class="search-wrapper flex-1">
                <i class="pi pi-search search-wrapper__icon"></i>
                <pv-input-text
                    v-model="tableSearch"
                    placeholder="Buscar mesa por número..."
                    class="w-full search-wrapper__input"
                />
            </div>
            <pv-select
                v-model="selectedZoneFilter"
                :options="zoneFilterOptions"
                option-label="label"
                option-value="value"
                placeholder="Selecciona una zona"
                filter
                filter-placeholder="Buscar zona..."
                class="zone-filter-select"
            >
                <template #value="slotProps">
                    <div class="flex align-items-center gap-2">
                        <span
                            v-if="zoneFilterOptions.find(o => o.value === slotProps.value)?.color"
                            class="zone-filter-dot"
                            :style="{ background: zoneFilterOptions.find(o => o.value === slotProps.value)?.color }"
                        ></span>
                        <i v-else class="pi pi-th-large" style="font-size:0.7rem;color:#6b7280"></i>
                        {{ zoneFilterOptions.find(o => o.value === slotProps.value)?.label ?? 'Todas las Zonas' }}
                    </div>
                </template>
                <template #option="slotProps">
                    <div class="flex align-items-center gap-2">
                        <span
                            v-if="slotProps.option.color"
                            class="zone-filter-dot"
                            :style="{ background: slotProps.option.color }"
                        ></span>
                        <i v-else class="pi pi-th-large" style="font-size:0.7rem;color:#6b7280"></i>
                        {{ slotProps.option.label }}
                    </div>
                </template>
            </pv-select>
            <pv-button
                v-if="showAdminActions"
                label="Nueva Mesa"
                icon="pi pi-plus"
                size="small"
                severity="success"
                @click="emit('create-table')"
            />
        </div>

        <div v-if="filteredAndSearched.length > 0" class="tables-grid">
            <div
                v-for="table in filteredAndSearched"
                :key="table.id"
                :class="['table-card', urgencyClass(table)]"
                :style="{
                    '--zone-color': zoneColorMap[table.zoneId]?.color ?? '#6b7280',
                    '--status-color': TABLE_STATUS_CONFIG[table.status]?.color ?? '#6b7280',
                    '--status-bg': TABLE_STATUS_CONFIG[table.status]?.bg ?? 'transparent',
                    '--card-border': TABLE_STATUS_CONFIG[table.status]?.border ?? zoneColorMap[table.zoneId]?.color ?? '#6b7280',
                }"
            >
                <div class="table-card__header">
                    <div>
                        <div class="table-card__name">{{ formatTableLabel(table.number) }}</div>
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
                    <template v-if="table.status === 'occupied' && posStore.saleByTableId(table.id)">
                        <div class="table-card__order-info">
                            <div class="table-card__order-row">
                                <span class="table-card__order-time">{{ elapsedTime(table.occupiedSince) }}</span>
                                <span class="table-card__order-amount">
                                    S/ {{ (posStore.saleByTableId(table.id)?.total ?? 0).toFixed(2) }}
                                </span>
                            </div>
                        </div>
                    </template>
                </div>
                <button
                    v-if="table.status === 'occupied'"
                    type="button"
                    class="table-card__cta table-card__cta--cobrar"
                    @click.stop="emit('open-order', table)"
                >
                    <i class="pi pi-eye"></i> Ver Orden
                </button>
                <button
                    v-else-if="table.status === 'available'"
                    type="button"
                    class="table-card__cta table-card__cta--asignar"
                    @click.stop="emit('assign', table)"
                >
                    <i class="pi pi-user-plus"></i> Asignar Mesa
                </button>
                <button
                    v-else-if="showAdminActions && table.status === 'cleaning'"
                    type="button"
                    class="table-card__cta table-card__cta--limpiar"
                    @click.stop="emit('mark-available', table.id)"
                >
                    <i class="pi pi-check"></i> Lista
                </button>
                <button
                    v-else-if="showAdminActions && table.status === 'reserved'"
                    type="button"
                    class="table-card__cta table-card__cta--reservada"
                    @click.stop="emit('clear-reservation', table.id)"
                >
                    <i class="pi pi-calendar-times"></i> Cancelar Reserva
                </button>
            </div>
        </div>
        <div v-else class="table-floor__empty flex flex-column align-items-center justify-content-center gap-2 py-6">
            <i class="pi pi-table text-4xl text-color-secondary"></i>
            <span class="text-color-secondary">No hay mesas en esta zona</span>
        </div>
    </div>
</template>

<style scoped>
.table-floor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.zone-filter-select { width: 280px; max-width: 100%; }
.zone-filter-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.stat-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
}

.stat-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.85rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    white-space: nowrap;
    flex: 1;
    justify-content: center;
}

.stat-chip--bar {
    border-radius: 10px;
    gap: 0.45rem;
}

.stat-chip__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
}

.stat-chip--btn {
    cursor: pointer;
    border: none;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.stat-chip--btn:hover { background: #f3f4f6; }

.stat-chip--active-green {
    background: #dcfce7 !important;
    border-color: #22c55e !important;
    box-shadow: 0 0 0 2px #bbf7d0;
}

.stat-chip--active-purple {
    background: #ede9fe !important;
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 2px #ddd6fe;
}

.stat-chip--active-red {
    background: #fee2e2 !important;
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px #fecaca;
}

.stat-chip--active-blue {
    background: #dbeafe !important;
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px #bfdbfe;
}

.stat-chip__label {
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 500;
}

.stat-chip__value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
}

.stat-chip__sub {
    font-size: 0.72rem;
    font-weight: 400;
    color: #9ca3af;
}

.stat-chip__pct {
    font-size: 0.7rem;
    color: #9ca3af;
}

.occupancy-bar {
    height: 6px;
    background: #fee2e2;
    border-radius: 999px;
    overflow: hidden;
    margin-top: 0.1rem;
}

.occupancy-bar__fill {
    height: 100%;
    background: #ef4444;
    border-radius: 999px;
    transition: width 0.4s ease;
}

.search-wrapper { position: relative; }

.search-wrapper__icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #9ca3af);
    font-size: 0.9rem;
    z-index: 1;
    pointer-events: none;
}

.search-wrapper__input { padding-left: 2.25rem !important; }

.table-card--warning { border-color: #f59e0b !important; }

.table-card--critical {
    border-color: #ef4444 !important;
    animation: pulse-urgent 2s infinite;
}

@keyframes pulse-urgent {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.25); }
    50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}

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
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
.table-card__cta--cobrar { background: #059669; color: #fff; }
.table-card__cta--cobrar:hover { filter: brightness(1.1); }
.table-card__cta--asignar { background: #2563eb; color: #fff; }
.table-card__cta--asignar:hover { filter: brightness(1.1); }
.table-card__cta--limpiar { background: #d97706; color: #fff; }
.table-card__cta--limpiar:hover { filter: brightness(1.1); }
.table-card__cta--reservada { background: #7c3aed; color: #fff; }
.table-card__cta--reservada:hover { filter: brightness(1.1); }

@media (max-width: 640px) {
    .zone-filter-select { width: 100%; }
    .table-floor__toolbar { flex-wrap: wrap; }
}
</style>
