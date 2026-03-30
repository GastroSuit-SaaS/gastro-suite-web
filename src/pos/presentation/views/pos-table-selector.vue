<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePosStore }       from '../../application/pos.store.js'
import { TABLE_STATUS_CONFIG } from '../../../shared/presentation/constants/table-status.constants.js'
import { posOrderRoute }     from '../constants/pos.constants-ui.js'

const route    = useRoute()
const router   = useRouter()
const posStore = usePosStore()

const zoneId = computed(() => Number(route.params.zoneId))

const zone = computed(() =>
    posStore.zones.find(z => z.id === zoneId.value) ?? null
)

const tables = computed(() => posStore.tablesForZone(zoneId.value))

function selectTable(table) {
    posStore.openSaleForTable(table.id, table.zoneId)
    router.push(posOrderRoute(table.id))
}
</script>

<template>
    <div class="p-4 flex flex-column gap-4">

        <!-- Acceso rápido a órdenes activas -->
        <div class="orders-link" @click="router.push('/pos')">
            <i class="pi pi-arrow-left orders-link__icon"></i>
            <span>Órdenes activas</span>
            <span v-if="posStore.activeOrders.length > 0" class="orders-link__badge">
                {{ posStore.activeOrders.length }}
            </span>
        </div>

        <!-- Encabezado de zona -->
        <div v-if="zone" class="flex align-items-center gap-3">
            <div
                class="zone-icon border-round-lg flex align-items-center justify-content-center flex-shrink-0"
                :style="{ backgroundColor: zone.color }"
            >
                <i class="pi pi-map-marker text-white"></i>
            </div>
            <div class="flex flex-column gap-1">
                <span class="text-lg font-bold text-color">{{ zone.name }}</span>
                <span class="text-sm text-color-secondary">{{ zone.description }}</span>
            </div>
        </div>

        <!-- Grilla de mesas -->
        <div v-if="tables.length > 0" class="tables-grid">
            <div
                v-for="table in tables"
                :key="table.id"
                class="table-card cursor-pointer"
                :style="{
                    '--status-color': TABLE_STATUS_CONFIG[table.status]?.color ?? '#6b7280',
                    '--status-bg':    TABLE_STATUS_CONFIG[table.status]?.bg    ?? 'transparent',
                    '--card-border':  TABLE_STATUS_CONFIG[table.status]?.border ?? zone?.color ?? '#6b7280',
                }"
                @click="selectTable(table)"
            >
                <!-- Cabecera -->
                <div class="flex align-items-start justify-content-between gap-2">
                    <div>
                        <div class="table-card__name">Mesa {{ table.number }}</div>
                        <div class="table-card__shape">{{ table.shape }}</div>
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

                <!-- Orden activa: items y total -->
                <template v-if="table.status === 'occupied'">
                    <div class="table-card__divider"></div>
                    <div class="table-card__order-info">
                        <div class="flex justify-content-between align-items-center">
                            <span class="table-card__order-label">Items</span>
                            <span class="table-card__order-value">
                                {{ posStore.saleByTableId(table.id)?.items?.length ?? '—' }}
                            </span>
                        </div>
                        <div class="flex justify-content-between align-items-center">
                            <span class="table-card__order-label">Total</span>
                            <span class="table-card__order-value font-bold" style="color: var(--status-color)">
                                S/ {{ (posStore.saleByTableId(table.id)?.total ?? table.orderAmount).toFixed(2) }}
                            </span>
                        </div>
                    </div>
                </template>

                <!-- Separador (solo para no-ocupadas) -->
                <div v-else class="table-card__divider"></div>

                <!-- Estado -->
                <span class="table-card__status-label">
                    {{ TABLE_STATUS_CONFIG[table.status]?.label ?? table.status }}
                </span>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-column align-items-center justify-content-center gap-2 py-6">
            <i class="pi pi-table text-4xl text-color-secondary"></i>
            <span class="text-color-secondary">No hay mesas en esta zona</span>
        </div>

    </div>
</template>

<style scoped>
.zone-icon {
    width: 2.75rem;
    height: 2.75rem;
    flex-shrink: 0;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
}

.table-card {
    background: var(--status-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: box-shadow 0.15s, transform 0.15s;
}

.table-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.table-card__name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
}

.table-card__shape {
    font-size: 0.72rem;
    color: #9ca3af;
    text-transform: capitalize;
    margin-top: 1px;
}

.table-card__status-icon {
    font-size: 1.1rem;
    color: var(--status-color);
    flex-shrink: 0;
}

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

.table-card__divider {
    height: 1px;
    background: var(--card-border);
    opacity: 0.4;
}

.table-card__status-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--status-color);
}

.table-card__order-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.table-card__order-label {
    font-size: 0.72rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.table-card__order-value {
    font-size: 0.82rem;
    color: #374151;
}
</style>
