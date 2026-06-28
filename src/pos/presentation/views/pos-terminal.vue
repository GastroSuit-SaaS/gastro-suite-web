<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usePosStore } from '../../application/pos.store.js'
import { isPersistedSaleId } from '../../infrastructure/assemblers/sale.assembler.js'
import { posOrderRoute, posTablesRoute, formatTableLabel } from '../constants/pos.constants-ui.js'
import {
    ALL_ZONES,
    buildZoneFilterOptions,
    filterActiveOrders,
    resolveNewOrderZoneId,
    deliveryStatusLabel,
} from '../helpers/pos-hub-orders-filter.helpers.js'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import PosHubAlertsPanel from '../components/pos-hub-alerts-panel.vue'
import { readDefaultTablePageSize, persistTablePageSize } from '../../../shared/composables/use-table-pagination.js'

const router = useRouter()
const toast = useToast()
const posStore = usePosStore()

const zoneFilter = ref(ALL_ZONES)
const showTakeawayDialog = ref(false)
const takeawayName = ref('')
const showDeliveryDialog = ref(false)
const deliveryForm = ref({ customerName: '', customerPhone: '', deliveryAddress: '' })
const ordersFirst = ref(0)
const ORDERS_PAGE_SIZE_OPTIONS = [8, 10, 20, 50]

function resolveOrdersPageSize() {
    const saved = readDefaultTablePageSize(10)
    return ORDERS_PAGE_SIZE_OPTIONS.includes(saved) ? saved : 8
}

const ordersPageSize = ref(resolveOrdersPageSize())

const zoneFilterOptions = computed(() =>
    buildZoneFilterOptions(posStore.zones, posStore.activeOrders),
)

const showOrdersZoneFilter = computed(() => zoneFilterOptions.value.length > 1)

const filteredOrders = computed(() =>
    filterActiveOrders(posStore.activeOrders, zoneFilter.value, posStore.tableById),
)

const paginatedOrders = computed(() =>
    filteredOrders.value.slice(ordersFirst.value, ordersFirst.value + ordersPageSize.value),
)

watch(ordersPageSize, (size) => {
    ordersFirst.value = 0
    persistTablePageSize(size)
})

watch(zoneFilter, () => {
    ordersFirst.value = 0
})

watch(
    () => filteredOrders.value.length,
    (total) => {
        if (ordersFirst.value > 0 && ordersFirst.value >= total) {
            ordersFirst.value = 0
        }
    },
)

function onOrdersPage(event) {
    ordersFirst.value = event.first
    if (event.rows != null) ordersPageSize.value = event.rows
}

function startNewOrder() {
    const zoneId = resolveNewOrderZoneId(zoneFilter.value, posStore.zones)
    if (!posStore.zones.length) {
        toast.add({
            severity: 'warn',
            summary: 'Sin zonas',
            detail: 'Configura zonas y mesas antes de crear una orden.',
            life: 4000,
        })
        return
    }
    router.push(posTablesRoute({ zoneId }))
}

async function openOrder(order) {
    try {
        if (order.isOffPremise) {
            posStore.currentSale = order
            posStore.currentSaleIsRecovered = true
        } else {
            await posStore.openSaleForTable(order.tableId, order.zoneId)
        }
        const saleId = posStore.currentSale?.id ?? order.id
        if (!isPersistedSaleId(saleId)) {
            toast.add({
                severity: 'warn',
                summary: 'Orden no sincronizada',
                detail: 'Abre la mesa de nuevo desde el mapa o el terminal.',
                life: 5000,
            })
            return
        }
        router.push(posOrderRoute(saleId))
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'No se pudo abrir la orden',
            detail: e?.message ?? 'Intenta de nuevo.',
            life: 5000,
        })
    }
}

function openTakeawayDialog() {
    takeawayName.value = ''
    showTakeawayDialog.value = true
}

async function confirmTakeaway() {
    showTakeawayDialog.value = false
    try {
        const sale = await posStore.openTakeawaySale(takeawayName.value.trim())
        router.push(posOrderRoute(sale.id))
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: e?.message ?? 'No se pudo crear la orden.',
            life: 5000,
        })
    }
}

function openDeliveryDialog() {
    deliveryForm.value = { customerName: '', customerPhone: '', deliveryAddress: '' }
    showDeliveryDialog.value = true
}

async function confirmDelivery() {
    showDeliveryDialog.value = false
    try {
        const sale = await posStore.openDeliverySale({ ...deliveryForm.value })
        router.push(posOrderRoute(sale.id))
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: e?.message ?? 'No se pudo crear la orden delivery.',
            life: 5000,
        })
    }
}

onMounted(() => {
    posStore.fetchAll()
})
</script>

<template>
    <div class="p-4 flex flex-column gap-4">
        <module-state-feedback
            :loading="posStore.isLoading"
            :error="posStore.error"
            loading-label="Cargando terminal..."
            @retry="posStore.fetchAll()"
        >
            <div class="stat-row">
                <div class="stat-chip">
                    <span class="stat-chip__label">Órdenes activas</span>
                    <span class="stat-chip__value">{{ posStore.activeOrders.length }}</span>
                </div>
                <div class="stat-chip">
                    <span class="stat-chip__label">Total en proceso</span>
                    <span class="stat-chip__value stat-chip__value--money">
                        S/ {{ posStore.totalInProcess.toFixed(2) }}
                    </span>
                </div>
                <div class="stat-chip">
                    <span class="stat-chip__label">Mesas ocupadas</span>
                    <span class="stat-chip__value">{{ posStore.occupiedTables.length }}</span>
                </div>
            </div>

            <div class="pos-actions">
                <div class="pos-actions__buttons">
                    <pv-button
                        label="Nueva orden"
                        icon="pi pi-plus"
                        @click="startNewOrder"
                    />
                    <pv-button
                        label="Para Llevar"
                        icon="pi pi-shopping-bag"
                        severity="warn"
                        @click="openTakeawayDialog"
                    />
                    <pv-button
                        label="Delivery"
                        icon="pi pi-truck"
                        severity="help"
                        @click="openDeliveryDialog"
                    />
                </div>
                <pv-select
                    v-if="showOrdersZoneFilter"
                    v-model="zoneFilter"
                    :options="zoneFilterOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Filtrar por zona"
                    size="small"
                    class="pos-actions__filter"
                />
            </div>

            <div class="pos-main">
                <section class="pos-main__orders">
                    <span class="orders-label">Órdenes en curso</span>

                    <div
                        v-if="posStore.activeOrders.length === 0"
                        class="empty-state surface-card border-1 surface-border border-round-lg flex flex-column align-items-center justify-content-center gap-3 py-6"
                    >
                        <i class="pi pi-shopping-cart empty-state__icon text-color-secondary"></i>
                        <div class="flex flex-column align-items-center gap-1">
                            <span class="font-bold text-color">No hay ordenes activas</span>
                            <span class="text-sm text-color-secondary">
                                Las ordenes apareceran aqui una vez que se creen
                            </span>
                        </div>
                    </div>

                    <template v-else>
                        <div
                            v-if="!filteredOrders.length"
                            class="empty-state surface-card border-1 surface-border border-round-lg flex flex-column align-items-center justify-content-center gap-2 py-5"
                        >
                            <i class="pi pi-filter-slash empty-state__icon text-color-secondary"></i>
                            <span class="text-sm text-color-secondary">Sin órdenes en esta zona</span>
                        </div>

                        <div v-else class="orders-list-panel surface-card border-1 surface-border border-round-lg">
                            <div class="orders-list">
                                <div
                                    v-for="order in paginatedOrders"
                                    :key="order.id"
                                    class="order-row p-3 cursor-pointer"
                                    @click="openOrder(order)"
                                >
                                <div class="flex align-items-center justify-content-between gap-3">
                                    <div class="flex align-items-center gap-3">
                                        <div
                                            class="order-zone-dot border-round-lg flex align-items-center justify-content-center flex-shrink-0"
                                            :style="{
                                                backgroundColor: order.isDelivery
                                                    ? '#6366f1'
                                                    : order.isTakeaway
                                                    ? '#f59e0b'
                                                    : (posStore.zoneById(posStore.tableById(order.tableId)?.zoneId)?.color ?? 'var(--primary-color)'),
                                            }"
                                        >
                                            <i :class="['pi text-white', order.isDelivery ? 'pi-truck' : order.isTakeaway ? 'pi-shopping-bag' : 'pi-receipt']"></i>
                                        </div>

                                        <div class="flex flex-column gap-0">
                                            <template v-if="order.status === 'partially_paid'">
                                                <span class="order-row__zone" style="color:#b45309">
                                                    Cuenta abierta #{{ order.saleDisplayNumber ?? order.ticketNumber }}
                                                </span>
                                                <span class="order-row__table">
                                                    Saldo S/ {{ (order.balanceDue ?? order.total).toFixed(2) }}
                                                </span>
                                            </template>
                                            <template v-else-if="order.isDelivery">
                                                <span class="order-row__zone" style="color:#6366f1">
                                                    Delivery #{{ order.saleDisplayNumber ?? order.ticketNumber }}
                                                </span>
                                                <span class="order-row__table">{{ order.customerName || order.deliveryAddress || 'Sin datos' }}</span>
                                            </template>
                                            <template v-else-if="order.isTakeaway">
                                                <span class="order-row__zone" style="color:#f59e0b">
                                                    Para Llevar #{{ order.saleDisplayNumber ?? order.ticketNumber }}
                                                </span>
                                                <span class="order-row__table">{{ order.customerName || 'Sin nombre' }}</span>
                                            </template>
                                            <template v-else>
                                                <span class="order-row__zone">
                                                    {{ posStore.zoneById(posStore.tableById(order.tableId)?.zoneId)?.name ?? '—' }}
                                                </span>
                                                <span class="order-row__table">
                                                    <template v-if="order.saleDisplayNumber">Orden #{{ order.saleDisplayNumber }} · </template>
                                                    {{ formatTableLabel(posStore.tableById(order.tableId)?.number ?? order.tableId) }}
                                                </span>
                                            </template>
                                        </div>
                                    </div>

                                    <span class="order-row__total">S/ {{ order.total.toFixed(2) }}</span>
                                </div>

                                <div class="order-row__meta flex align-items-center gap-3 mt-2">
                                    <template v-if="!order.isOffPremise">
                                        <span class="flex align-items-center gap-1">
                                            <i class="pi pi-users"></i>
                                            {{ posStore.tableById(order.tableId)?.seatedGuests ?? 0 }}/{{ posStore.tableById(order.tableId)?.capacity ?? '?' }} personas
                                        </span>
                                        <span class="order-row__meta-sep">·</span>
                                    </template>
                                    <span class="flex align-items-center gap-1">
                                        <i class="pi pi-list"></i>
                                        {{ order.items.length }} ítem{{ order.items.length !== 1 ? 's' : '' }}
                                    </span>
                                </div>
                                </div>
                            </div>

                            <pv-paginator
                                v-if="filteredOrders.length > 0"
                                v-model:first="ordersFirst"
                                v-model:rows="ordersPageSize"
                                :total-records="filteredOrders.length"
                                :rows-per-page-options="ORDERS_PAGE_SIZE_OPTIONS"
                                template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                                class="orders-list-panel__paginator"
                                @page="onOrdersPage"
                            />
                        </div>
                    </template>
                </section>

                <pos-hub-alerts-panel class="pos-main__alerts" />
            </div>
        </module-state-feedback>
    </div>

    <CreateAndEdit
        :visible="showTakeawayDialog"
        entity-name="Orden Para Llevar"
        custom-button-label="Crear Orden"
        @canceled-shared="showTakeawayDialog = false"
        @saved-shared="confirmTakeaway"
    >
        <template #content>
            <div class="flex flex-column gap-3 pt-2">
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium">
                        Nombre del cliente <span class="text-color-secondary">(opcional)</span>
                    </label>
                    <pv-input-text
                        v-model="takeawayName"
                        placeholder="Ej: Juan Pérez"
                        @keydown.enter="confirmTakeaway"
                    />
                </div>
            </div>
        </template>
    </CreateAndEdit>

    <CreateAndEdit
        :visible="showDeliveryDialog"
        entity-name="Orden Delivery"
        custom-button-label="Crear Delivery"
        @canceled-shared="showDeliveryDialog = false"
        @saved-shared="confirmDelivery"
    >
        <template #content>
            <div class="flex flex-column gap-3 pt-2">
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium">Nombre del cliente</label>
                    <pv-input-text v-model="deliveryForm.customerName" placeholder="Ej: Juan Pérez" />
                </div>
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium">Teléfono</label>
                    <pv-input-text v-model="deliveryForm.customerPhone" placeholder="Ej: 999 888 777" />
                </div>
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium">Dirección de entrega *</label>
                    <pv-textarea
                        v-model="deliveryForm.deliveryAddress"
                        rows="3"
                        auto-resize
                        placeholder="Calle, número, referencia..."
                        @keydown.enter.prevent="confirmDelivery"
                    />
                </div>
            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.empty-state { min-height: 180px; }
.empty-state__icon { font-size: 3rem; opacity: 0.4; }

.pos-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
    gap: 1rem;
    align-items: start;
}

.pos-main__orders { min-width: 0; }

.pos-main__alerts {
    position: sticky;
    top: 0.5rem;
}

.pos-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.pos-actions__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.pos-actions__filter {
    min-width: 200px;
    max-width: 280px;
    margin-left: auto;
}

.pos-actions__filter :deep(.p-select) {
    width: 100%;
}

.orders-label {
    display: block;
    margin-bottom: 0.65rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #374151;
}

.orders-list-panel {
    overflow: hidden;
}

.orders-list {
    display: flex;
    flex-direction: column;
}

.order-row {
    border-bottom: 1px solid var(--surface-border);
    transition: background 0.15s;
}

.order-row:last-child {
    border-bottom: none;
}

.order-row:hover {
    background: var(--surface-ground);
}

.orders-list-panel__paginator {
    border-top: 1px solid var(--surface-border);
}

.order-zone-dot {
    width: 2.25rem;
    height: 2.25rem;
    flex-shrink: 0;
}

.order-row__zone {
    font-size: 0.72rem;
    color: #6b7280;
    font-weight: 500;
}

.order-row__table {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
}

.order-row__total {
    font-size: 1rem;
    font-weight: 700;
    color: #059669;
    white-space: nowrap;
}

.order-row__meta {
    font-size: 0.75rem;
    color: #6b7280;
    padding-left: 3.25rem;
}

.order-row__meta .pi { font-size: 0.72rem; }
.order-row__meta-sep { opacity: 0.4; }

@media (max-width: 1024px) {
    .pos-main { grid-template-columns: 1fr; }
    .pos-main__alerts { position: static; }
}

@media (max-width: 640px) {
    .pos-actions__filter {
        max-width: none;
        width: 100%;
        margin-left: 0;
    }
}
</style>
