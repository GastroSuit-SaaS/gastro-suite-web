<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast }            from 'primevue/usetoast'
import { usePosStore }         from '../../application/pos.store.js'
import { POS_ROUTES, posPaymentRoute } from '../constants/pos.constants-ui.js'
import { SALE_STATUS } from '../../domain/models/sale.entity.js'
import { setToolbarContext, clearToolbarContext } from '../../../shared/presentation/composables/use-toolbar-context.js'
import TransferTableDialog from '../components/transfer-table-dialog.vue'
import { TICKET_STATUS_CONFIG } from '../../../stations/presentation/constants/stations.constants-ui.js'
import { DELIVERY_STATUS } from '../../domain/models/sale.entity.js'
import { useSubscriptionEntitlements } from '../../../shared/presentation/composables/use-subscription-entitlements.js'

const route         = useRoute()
const router        = useRouter()
const toast         = useToast()
const posStore      = usePosStore()
const { entitlements } = useSubscriptionEntitlements()

const saleId  = computed(() => {
    const raw = route.params.saleId
    const num = Number(raw)
    return isNaN(num) ? raw : num
})
const sale    = computed(() => posStore.currentSale)
const table   = computed(() => sale.value?.tableId ? posStore.tableById(sale.value.tableId) : null)
const zone    = computed(() => table.value?.zoneId ? posStore.zoneById(table.value.zoneId) : null)
const isTakeaway = computed(() => sale.value?.isTakeaway ?? false)
const isDelivery = computed(() => sale.value?.isDelivery ?? false)
const isOffPremise = computed(() => sale.value?.isOffPremise ?? false)
const isPartiallyPaid = computed(() => sale.value?.status === SALE_STATUS.PARTIALLY_PAID)
const isOrderReadOnly = computed(() =>
    isPartiallyPaid.value || (sale.value?.amountPaid ?? 0) > 0.009,
)
const deliveryBusy = ref(false)

// Ítems pendientes de enviar a cocina / confirmar para cobro
const pendingItems = computed(() => sale.value?.items.filter(i => !i.isSent) ?? [])
const dispatchActionLabel = computed(() =>
    entitlements.value.hasKitchen ? 'Enviar a Estaciones' : 'Confirmar para cobro',
)

// ── Nota editable por ítem ───────────────────────────────────────────────────────────────
const editingNoteId     = ref(null)
const noteInput         = ref('')

// ── Transferir mesa
const showTransferDialog = ref(false)

// ── Descuento editable por ítem
const editingDiscountId   = ref(null)
const discountInput       = ref(0)
const discountType        = ref('pct')  // 'pct' | 'fixed'

// ── Descuento a nivel de orden
const editingOrderDiscount = ref(false)
const totalsBreakdownOpen = ref(false)
const orderDiscountInput   = ref(0)
const orderDiscountType    = ref('fixed')

function openOrderDiscount() {
    const s = sale.value
    orderDiscountType.value  = s?.orderDiscountType && s.orderDiscountType !== 'none'
        ? s.orderDiscountType
        : 'fixed'
    orderDiscountInput.value = orderDiscountType.value === 'pct'
        ? (s?.orderDiscountValue ?? 0)
        : (s?.discount ?? s?.orderDiscountValue ?? 0)
    editingOrderDiscount.value = true
    totalsBreakdownOpen.value = true
}

function toggleTotalsBreakdown() {
    totalsBreakdownOpen.value = !totalsBreakdownOpen.value
}
function commitOrderDiscount() {
    posStore.updateOrderDiscount(orderDiscountType.value, orderDiscountInput.value)
    editingOrderDiscount.value = false
}
function cancelOrderDiscount() {
    editingOrderDiscount.value = false
}
function clearOrderDiscount() {
    posStore.clearOrderDiscount()
    editingOrderDiscount.value = false
}

async function ensureOrderContext() {
    const loaded = await posStore.loadSaleContext(route.params.saleId)
    if (!loaded) {
        toast.add({
            severity: 'warn',
            summary:  'Orden no disponible',
            detail:   posStore.error ?? 'No se pudo cargar la orden. Vuelve al terminal e inténtalo de nuevo.',
            life:     5000,
        })
        router.replace(POS_ROUTES.TERMINAL)
    }
    return loaded
}

let _kitchenPoll = null

function stopKitchenSync() {
    if (_kitchenPoll) {
        clearInterval(_kitchenPoll)
        _kitchenPoll = null
    }
}

async function startKitchenSync() {
    if (!entitlements.value.hasKitchen) return;
    stopKitchenSync()
    await posStore.refreshKitchenTickets()
    _kitchenPoll = setInterval(() => posStore.refreshKitchenTickets(), 60_000)
}

onMounted(async () => {
    if (await ensureOrderContext()) await startKitchenSync()
})

onUnmounted(() => {
    stopKitchenSync()
    clearToolbarContext()
})

watch(() => route.params.saleId, async (id) => {
    if (id) {
        if (await ensureOrderContext()) await startKitchenSync()
    }
})

const KITCHEN_SENT_FALLBACK = { label: 'Enviado', color: '#3b82f6', bg: '#dbeafe', icon: 'pi-send' };

function itemKitchenBadge(item) {
    if (!entitlements.value.hasKitchen) return null;
    const key = posStore.getItemKitchenStatusKey(item);
    if (key === 'pending') return null;
    if (key === 'sent') return KITCHEN_SENT_FALLBACK;
    const base = TICKET_STATUS_CONFIG[key] ?? KITCHEN_SENT_FALLBACK;
    if (key !== 'cancelled') return base;
    const reason = posStore.getItemKitchenCancelReason(item);
    return {
        ...base,
        label: reason ? `Cancelado: ${reason}` : base.label,
    };
}

const orderTotals = computed(() => posStore.currentOrderTotals);

function isItemCancelledInKitchen(item) {
    return posStore.getItemKitchenStatusKey(item) === 'cancelled';
}

const kitchenOrderBadge = computed(() => {
    if (!entitlements.value.hasKitchen) return null;
    const key = posStore.kitchenOrderStatus;
    if (!key || !sale.value?.items?.some(i => i.isSent)) return null;
    return TICKET_STATUS_CONFIG[key] ?? null;
})

// ── Catálogo ───────────────────────────────────────────────────────────────
const categoryFilterOptions = computed(() => [
    { label: `Todos (${posStore.filteredCatalog.length})`, value: '__all__', color: null },
    ...posStore.menuCategories.map(c => ({ label: `${c.name} (${c.count})`, value: c.id, color: c.color })),
])
const selectedCategoryFilter = computed({
    get: () => posStore.catalogCategory ?? '__all__',
    set: (val) => posStore.setCatalogCategory(val === '__all__' ? null : val),
})

function addItem(menuItem) {
    if (isOrderReadOnly.value) return
    posStore.addItemToCurrentSale(menuItem)
}

// Funciones para modificar ítems en la orden
function lineLocked(item) {
    return !posStore.canModifySaleLine(item)
}

function notifyLineBlocked(item) {
    const detail = posStore.getSaleLineBlockMessage(item)
    if (!detail) return
    toast.add({ severity: 'warn', summary: 'No se puede modificar', detail, life: 4500 })
}

function increment(item) {
    if (lineLocked(item)) return notifyLineBlocked(item)
    const r = posStore.updateItemQuantity(item.id, item.quantity + 1)
    if (r?.ok === false) notifyLineBlocked(item)
}
function decrement(item) {
    if (lineLocked(item)) return notifyLineBlocked(item)
    const r = posStore.updateItemQuantity(item.id, item.quantity - 1)
    if (r?.ok === false) notifyLineBlocked(item)
}
function removeItem(item) {
    if (lineLocked(item)) return notifyLineBlocked(item)
    const r = posStore.removeItemFromCurrentSale(item.id)
    if (r?.ok === false) notifyLineBlocked(item)
}

function toggleNoteEdit(item) {
    if (lineLocked(item)) return notifyLineBlocked(item)
    editingDiscountId.value = null   // cierra descuento si estaba abierto
    if (editingNoteId.value === item.id) {
        commitNote(item)
    } else {
        editingNoteId.value = item.id
        noteInput.value     = item.note
    }
}
function commitNote(item) {
    if (lineLocked(item)) {
        notifyLineBlocked(item)
        editingNoteId.value = null
        return
    }
    posStore.updateItemNote(item.id, noteInput.value)
    editingNoteId.value = null
}

function toggleDiscountEdit(item) {
    if (lineLocked(item)) return notifyLineBlocked(item)
    editingNoteId.value = null   // cierra nota si estaba abierta
    if (editingDiscountId.value === item.id) {
        commitDiscount(item)
    } else {
        editingDiscountId.value = item.id
        discountType.value      = item.discountType  ?? 'pct'
        discountInput.value     = item.discountValue ?? 0
    }
}
function commitDiscount(item) {
    if (lineLocked(item)) {
        notifyLineBlocked(item)
        editingDiscountId.value = null
        return
    }
    posStore.updateItemDiscount(item.id, discountType.value, discountInput.value)
    editingDiscountId.value = null
}
function cancelDiscount() {
    editingDiscountId.value = null
}


async function enviarEstaciones() {
    if (entitlements.value.hasKitchen) {
        const missingStation = pendingItems.value.filter((item) => !item.stationId)
        if (missingStation.length > 0) {
            const names = missingStation
                .map((item) => item.name || item.menuItemName || 'Ítem')
                .join(', ')
            toast.add({
                severity: 'error',
                summary:  'Estación de cocina requerida',
                detail:   `${missingStation.length} ítem(s) sin estación asignada: ${names}. Edita el menú antes de enviar.`,
                life:     6000,
            })
            return
        }
    }
    try {
        const result = await posStore.sendCurrentSaleToStations()
        await posStore.refreshKitchenTickets()
        if (result?.queued) {
            toast.add({
                severity: 'warn',
                summary:  'Comanda en cola',
                detail:   `${result.items} producto(s) se enviarán a cocina cuando vuelva la conexión.`,
                life:     4000,
            })
        } else if (result?.items > 0) {
            toast.add({
                severity: 'success',
                summary:  entitlements.value.hasKitchen ? 'Comanda actualizada' : 'Ítems confirmados',
                detail:   entitlements.value.hasKitchen
                    ? `${result.items} producto${result.items !== 1 ? 's' : ''} listo${result.items !== 1 ? 's' : ''} (cocina y/o entrega directa).`
                    : `${result.items} producto${result.items !== 1 ? 's' : ''} listo${result.items !== 1 ? 's' : ''} para cobro.`,
                life:     3000,
            })
        } else {
            toast.add({
                severity: 'info',
                summary:  'Sin cambios pendientes',
                detail:   entitlements.value.hasKitchen
                    ? 'Todos los ítems ya fueron enviados a cocina.'
                    : 'Todos los ítems ya están confirmados para cobro.',
                life:     3000,
            })
        }
    } catch (e) {
        toast.add({
            severity: 'error',
            summary:  entitlements.value.hasKitchen ? 'No se pudo enviar a cocina' : 'No se pudo confirmar',
            detail:   e?.message ?? posStore.error ?? 'Revisa la orden e intenta de nuevo.',
            life:     5000,
        })
    }
}

async function advanceDelivery(nextStatus) {
    if (!sale.value?.isDelivery) return
    deliveryBusy.value = true
    try {
        await posStore.advanceDeliveryStatus(nextStatus, sale.value.id)
        toast.add({
            severity: 'success',
            summary: 'Estado actualizado',
            detail: posStore.deliveryStatusLabel(nextStatus),
            life: 3000,
        })
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'No se pudo actualizar',
            detail: e?.message ?? 'Intenta de nuevo.',
            life: 5000,
        })
    } finally {
        deliveryBusy.value = false
    }
}

function procederPago()     { router.push(posPaymentRoute(sale.value.id)) }

function onTransferred(newTableId) {
    toast.add({
        severity: 'success',
        summary:  'Mesa transferida',
        detail:   `Orden transferida a Mesa ${posStore.tableById(newTableId)?.number ?? newTableId}.`,
        life:     3000,
    })
    // Sale ID stays the same after transfer — no route change needed
}

// ── Mobile tab switcher ───────────────────────────────────────────────────
const mobileView = ref('catalog') // 'catalog' | 'cart'
const itemCount  = computed(() => sale.value?.items?.length ?? 0)

const orderDisplayNumber = computed(() =>
    sale.value?.saleDisplayNumber ?? sale.value?.ticketNumber ?? null,
)

const deliveryCustomerLine = computed(() => {
    const parts = [sale.value?.customerName, sale.value?.customerPhone].filter(Boolean)
    return parts.join(' · ')
})

const orderPanelMeta = computed(() => {
    const parts = []
    if (orderDisplayNumber.value) parts.push(`Orden #${orderDisplayNumber.value}`)
    const count = sale.value?.totalItems ?? 0
    if (count > 0) parts.push(`${count} producto${count !== 1 ? 's' : ''}`)
    return parts.length ? parts.join(' · ') : 'Sin productos'
})

function goBackFromOrder() {
    router.push({ name: 'pos-terminal' })
}

function syncOrderToolbar() {
    setToolbarContext({
        showBackButton: true,
        backLabel: 'Volver al terminal',
        onBack: goBackFromOrder,
        backRoute: { name: 'pos-terminal' },
        chips: [],
    })
}

watch(() => route.params.saleId, syncOrderToolbar, { immediate: true })
</script>

<template>
    <div class="pos-order-layout">

        <div v-if="isOrderReadOnly" class="partial-pay-banner flex align-items-center justify-content-between gap-3 p-3 mb-2 border-round-lg">
            <div class="flex align-items-center gap-2">
                <i class="pi pi-info-circle" style="color:#b45309"></i>
                <span>Orden con pago parcial — solo puedes cobrar el saldo pendiente.</span>
            </div>
            <pv-button
                label="Cobrar saldo"
                size="small"
                severity="warn"
                @click="router.push(posPaymentRoute(saleId))"
            />
        </div>

        <!-- ── LEFT: Catálogo ─────────────────────────────────────────────────────────────── -->
        <div class="pos-catalog" :class="{ 'pos-catalog--mobile-hidden': mobileView !== 'catalog', 'pos-catalog--readonly': isOrderReadOnly }">

            <!-- Header: contexto + búsqueda -->
            <div class="pos-catalog__header">

                <!-- Badges de contexto (izquierda) -->
                <div class="context-badges">
                    <template v-if="isDelivery">
                        <div class="context-badge context-badge--delivery">
                            <span class="context-badge__label">Delivery</span>
                            <div class="context-badge__row">
                                <strong class="context-badge__value context-badge__order-num">
                                    <i class="pi pi-truck" style="font-size:0.7rem"></i>
                                    #{{ orderDisplayNumber ?? '—' }}
                                </strong>
                                <template v-if="deliveryCustomerLine">
                                    <span class="context-badge__sep">·</span>
                                    <span class="context-badge__value context-badge__value--muted">{{ deliveryCustomerLine }}</span>
                                </template>
                                <span class="delivery-status-pill">{{ posStore.deliveryStatusLabel(sale?.deliveryStatus) }}</span>
                            </div>
                        </div>
                    </template>
                    <template v-else-if="isTakeaway">
                        <div class="context-badge context-badge--takeaway">
                            <span class="context-badge__label">Para llevar</span>
                            <div class="context-badge__row">
                                <strong class="context-badge__value">
                                    <i class="pi pi-shopping-bag" style="font-size:0.7rem"></i>
                                    #{{ orderDisplayNumber ?? '—' }}
                                </strong>
                                <template v-if="sale?.customerName">
                                    <span class="context-badge__sep">·</span>
                                    <span class="context-badge__value context-badge__value--muted">{{ sale.customerName }}</span>
                                </template>
                                <span v-if="posStore.currentSaleIsRecovered" class="pending-chip">PENDIENTE</span>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div v-if="orderDisplayNumber || posStore.currentSaleIsRecovered" class="context-badge context-badge--indigo">
                            <span class="context-badge__label">Orden</span>
                            <div style="display:flex;align-items:center;gap:0.35rem">
                                <strong class="context-badge__value">#{{ orderDisplayNumber ?? '—' }}</strong>
                                <span v-if="posStore.currentSaleIsRecovered" class="pending-chip">PENDIENTE</span>
                            </div>
                        </div>
                        <div class="context-badge context-badge--blue">
                            <span class="context-badge__label">Mesa</span>
                            <strong class="context-badge__value">Mesa {{ table?.number ?? '—' }}</strong>
                        </div>
                        <div
                            v-if="zone"
                            class="context-badge"
                            :style="{ background: zone.color + '22', borderColor: zone.color }"
                        >
                            <span class="context-badge__label" :style="{ color: zone.color }">Zona</span>
                            <strong class="context-badge__value" :style="{ color: zone.color }">{{ zone.name }}</strong>
                        </div>
                    </template>
                </div>

                <!-- Búsqueda -->
                <div class="search-wrapper">
                    <i class="pi pi-search search-wrapper__icon"></i>
                    <pv-input-text
                        class="search-wrapper__input"
                        placeholder="Buscar productos..."
                        :model-value="posStore.catalogSearch"
                        @update:model-value="posStore.setCatalogSearch"
                    />
                </div>

                <!-- Filtro de categorías -->
                <pv-select
                    v-model="selectedCategoryFilter"
                    :options="categoryFilterOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Categoría"
                    filter
                    filter-placeholder="Buscar categoría..."
                    class="pos-cat-filter-select"
                >
                    <template #value="slotProps">
                        <div class="flex align-items-center gap-2">
                            <span
                                v-if="categoryFilterOptions.find(o => o.value === slotProps.value)?.color"
                                class="pos-cat-filter-dot"
                                :style="{ background: categoryFilterOptions.find(o => o.value === slotProps.value)?.color }"
                            ></span>
                            <i v-else class="pi pi-th-large" style="font-size:0.7rem;color:#6b7280"></i>
                            {{ categoryFilterOptions.find(o => o.value === slotProps.value)?.label ?? 'Todos' }}
                        </div>
                    </template>
                    <template #option="slotProps">
                        <div class="flex align-items-center gap-2">
                            <span
                                v-if="slotProps.option.color"
                                class="pos-cat-filter-dot"
                                :style="{ background: slotProps.option.color }"
                            ></span>
                            <i v-else class="pi pi-th-large" style="font-size:0.7rem;color:#6b7280"></i>
                            {{ slotProps.option.label }}
                        </div>
                    </template>
                </pv-select>

            </div>

            <!-- Grilla de productos (estilo menÃº) -->
            <div class="product-grid">
                <div
                    v-for="item in posStore.filteredCatalog"
                    :key="item.id"
                    class="product-card"
                    @click="addItem(item)"
                >
                    <!-- Imagen / placeholder -->
                    <div class="product-card__image">
                        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="product-card__img" />
                        <i v-else class="pi pi-prime product-card__icon"></i>
                        <!-- Badge disponibilidad -->
                        <div :class="['product-card__avail', item.isAvailable ? 'product-card__avail--ok' : 'product-card__avail--no']">
                            <i :class="['pi', item.isAvailable ? 'pi-check-circle' : 'pi-times-circle']"></i>
                            {{ item.isAvailable ? 'Disponible' : 'No disponible' }}
                        </div>
                        <!-- Overlay con botÃ³n agregar -->
                        <div class="product-card__overlay">
                            <button class="product-card__add-btn" @click.stop="addItem(item)">
                                <i class="pi pi-plus"></i> Agregar
                            </button>
                        </div>
                    </div>

                    <!-- Contenido -->
                    <div class="product-card__body">
                        <span class="product-card__category">{{ item.category }}</span>
                        <h3 class="product-card__name">{{ item.name }}</h3>
                        <p class="product-card__desc">{{ item.description }}</p>
                        <div class="product-card__footer">
                            <span class="product-card__price">S/ {{ item.price.toFixed(2) }}</span>
                            <span class="product-card__sku">SKU: {{ item.sku }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="posStore.filteredCatalog.length === 0" class="product-grid__empty">
                    <i class="pi pi-inbox text-4xl text-color-secondary"></i>
                    <span class="text-color-secondary">No se encontraron productos</span>
                </div>
            </div>

        </div>

        <!-- ── RIGHT: Orden ─────────────────────────────────────────────────────────────── -->    
        <div class="pos-panel" :class="{ 'pos-panel--mobile-hidden': mobileView !== 'cart' }">

            <!-- Encabezado del panel (fijo) -->
            <header class="pos-panel__header">
                <div class="pos-panel__title-row">
                    <i class="pi pi-shopping-cart pos-panel__title-icon" aria-hidden="true"></i>
                    <div class="pos-panel__title-block">
                        <h2 class="pos-panel__title">Orden actual</h2>
                        <p class="pos-panel__meta">{{ orderPanelMeta }}</p>
                    </div>
                </div>
                <span
                    v-if="kitchenOrderBadge"
                    class="kitchen-order-badge"
                    :style="{ color: kitchenOrderBadge.color, background: kitchenOrderBadge.bg, borderColor: kitchenOrderBadge.color }"
                >
                    <i :class="['pi', kitchenOrderBadge.icon]"></i>
                    Cocina: {{ kitchenOrderBadge.label }}
                </span>
                <div v-if="isDelivery && sale?.deliveryAddress" class="delivery-details">
                    <div class="delivery-details__row">
                        <i class="pi pi-map-marker" aria-hidden="true"></i>
                        <span>{{ sale.deliveryAddress }}</span>
                    </div>
                </div>
            </header>

            <!-- Lista de ítems (scroll independiente) -->
            <div
                class="pos-panel__items"
                role="region"
                aria-label="Productos en la orden"
                tabindex="0"
            >
                <!-- Empty state -->
                <div v-if="!sale || sale.items.length === 0" class="panel-empty">
                    <i class="pi pi-shopping-cart text-4xl text-color-secondary"></i>
                    <span class="text-sm text-color-secondary">Selecciona productos del menú</span>
                </div>

                <!-- Ítems -->
                <div v-else class="order-items-list">
                    <div
                        v-for="item in sale.items"
                        :key="item.id"
                        class="order-item"
                        :class="{ 'order-item--kitchen-cancelled': isItemCancelledInKitchen(item) }"
                    >
                        <!-- Nombre + acciones -->
                        <div class="flex align-items-start justify-content-between gap-1">
                            <div class="flex align-items-center gap-2">
                                <span class="order-item__name">{{ item.menuItemName }}</span>
                                <template v-for="badge in [itemKitchenBadge(item)]" :key="badge?.label">
                                    <span
                                        v-if="badge"
                                        class="sent-badge"
                                        :style="{ color: badge.color, background: badge.bg, borderColor: badge.color }"
                                    >
                                        <i :class="['pi', badge.icon ?? 'pi-check']"></i>
                                        {{ badge.label }}
                                    </span>
                                </template>
                            </div>
                            <div class="flex gap-1 flex-shrink-0">
                                <!-- Descuento (etiqueta) -->
                                <button
                                    :class="['icon-btn', editingDiscountId === item.id ? 'icon-btn--active-green' : (item.discountValue > 0 ? 'icon-btn--has-discount' : '')]"
                                    :disabled="lineLocked(item)"
                                    :title="lineLocked(item) ? posStore.getSaleLineBlockMessage(item) : 'Descuento'"
                                    @click="toggleDiscountEdit(item)"
                                >
                                    <i class="pi pi-tag"></i>
                                </button>
                                <!-- Nota (copiar) -->
                                <button
                                    :class="['icon-btn', editingNoteId === item.id ? 'icon-btn--active-yellow' : (item.note ? 'icon-btn--has-note' : '')]"
                                    :disabled="lineLocked(item)"
                                    :title="lineLocked(item) ? posStore.getSaleLineBlockMessage(item) : 'Nota'"
                                    @click="toggleNoteEdit(item)"
                                >
                                    <i class="pi pi-copy"></i>
                                </button>
                                <!-- Eliminar -->
                                <button
                                    class="icon-btn icon-btn--danger"
                                    :disabled="lineLocked(item)"
                                    :title="lineLocked(item) ? posStore.getSaleLineBlockMessage(item) : 'Eliminar'"
                                    @click="removeItem(item)"
                                >
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Editor de descuento -->
                        <div v-if="editingDiscountId === item.id" class="discount-editor">
                            <!-- Toggle tipo -->
                            <div class="discount-type-toggle">
                                <button
                                    :class="['disc-type-btn', discountType === 'pct' ? 'disc-type-btn--active' : '']"
                                    @click="discountType = 'pct'"
                                >% Porcentaje</button>
                                <button
                                    :class="['disc-type-btn', discountType === 'fixed' ? 'disc-type-btn--active' : '']"
                                    @click="discountType = 'fixed'"
                                >S/ Monto fijo</button>
                            </div>
                            <div class="discount-editor__row">
                                <span class="discount-editor__pct">{{ discountType === 'pct' ? '%' : 'S/' }}</span>
                                <input
                                    v-model.number="discountInput"
                                    class="discount-editor__input"
                                    type="number"
                                    min="0"
                                    :max="discountType === 'pct' ? 100 : item.unitPrice * item.quantity"
                                    :step="discountType === 'pct' ? 1 : 0.5"
                                    placeholder="0"
                                    autofocus
                                    @keyup.enter="commitDiscount(item)"
                                    @keyup.esc="cancelDiscount"
                                />
                                <button class="discount-editor__save" @click="commitDiscount(item)">Aplicar</button>
                                <button class="discount-editor__cancel" @click="cancelDiscount">Cancelar</button>
                            </div>
                        </div>

                        <!-- Descuento guardado -->
                        <div v-else-if="item.discountValue > 0" class="discount-display">
                            <i class="pi pi-tag" style="font-size:0.7rem"></i>
                            <span v-if="item.discountType === 'pct'">Descuento {{ item.discountValue }}%</span>
                            <span v-else>Descuento S/ {{ item.discountValue.toFixed(2) }}</span>
                            &mdash;
                            <span class="discount-display__original">S/ {{ (item.quantity * item.unitPrice).toFixed(2) }}</span>
                        </div>

                        <!-- Editor de nota -->
                        <div v-if="editingNoteId === item.id" class="note-editor">
                            <input
                                v-model="noteInput"
                                class="note-editor__input"
                                type="text"
                                placeholder="Ej: Sin ají, extra limón..."
                                @keyup.enter="commitNote(item)"
                                @keyup.esc="editingNoteId = null"
                                autofocus
                            />
                            <button class="note-editor__save" @click="commitNote(item)">OK</button>
                        </div>

                        <!-- Nota guardada -->
                        <div v-else-if="item.note" class="note-display">
                            <i class="pi pi-align-left" style="font-size:0.7rem"></i>
                            {{ item.note }}
                        </div>

                        <!-- Stepper + precio de lÃ­nea -->
                        <div class="flex align-items-center justify-content-between mt-2">
                            <div class="qty-stepper" :class="{ 'qty-stepper--locked': lineLocked(item) }">
                                <button class="qty-btn" :disabled="lineLocked(item)" @click="decrement(item)">
                                    <i class="pi pi-minus"></i>
                                </button>
                                <span class="qty-value">{{ item.quantity }}</span>
                                <button class="qty-btn" :disabled="lineLocked(item)" @click="increment(item)">
                                    <i class="pi pi-plus"></i>
                                </button>
                            </div>
                            <span
                                v-if="isItemCancelledInKitchen(item)"
                                class="order-item__subtotal order-item__subtotal--excluded"
                                title="Excluido del total — ticket cancelado en cocina"
                            >
                                No cobrado
                            </span>
                            <span v-else class="order-item__subtotal">S/ {{ item.subtotal.toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer: totales + botones de acción -->
            <div class="pos-panel__footer">
                <!-- Totales -->
                <div class="totals">
                    <button
                        type="button"
                        class="totals__ribbon"
                        :aria-expanded="totalsBreakdownOpen"
                        @click="toggleTotalsBreakdown"
                    >
                        <span>{{ totalsBreakdownOpen ? 'Ocultar desglose' : 'Ver desglose' }}</span>
                        <i :class="['pi', totalsBreakdownOpen ? 'pi-chevron-up' : 'pi-chevron-down']" aria-hidden="true"></i>
                    </button>

                    <div v-show="totalsBreakdownOpen" class="totals__breakdown">
                        <div class="totals__row">
                            <span>Subtotal</span>
                            <span>S/ {{ orderTotals.subtotal.toFixed(2) }}</span>
                        </div>
                        <div class="totals__row">
                            <span>IGV (18%)</span>
                            <span>S/ {{ orderTotals.tax.toFixed(2) }}</span>
                        </div>

                        <div v-if="orderTotals.discount > 0" class="totals__row totals__row--discount">
                            <span>Descuento</span>
                            <span class="totals__discount-value">− S/ {{ orderTotals.discount.toFixed(2) }}</span>
                        </div>

                        <div v-if="editingOrderDiscount" class="order-discount-editor">
                            <select v-model="orderDiscountType" class="order-discount-editor__type">
                                <option value="pct">%</option>
                                <option value="fixed">S/</option>
                            </select>
                            <input
                                v-model.number="orderDiscountInput"
                                type="number"
                                min="0"
                                :max="orderDiscountType === 'pct' ? 100 : undefined"
                                class="order-discount-editor__input"
                                @keydown.enter="commitOrderDiscount"
                                @keydown.esc="cancelOrderDiscount"
                            />
                            <button class="order-discount-editor__btn order-discount-editor__btn--ok" @click="commitOrderDiscount">
                                <i class="pi pi-check"></i>
                            </button>
                            <button v-if="(sale?.discount ?? 0) > 0" class="order-discount-editor__btn order-discount-editor__btn--clear" @click="clearOrderDiscount">
                                <i class="pi pi-times"></i>
                            </button>
                            <button class="order-discount-editor__btn order-discount-editor__btn--cancel" @click="cancelOrderDiscount">
                                <i class="pi pi-ban"></i>
                            </button>
                        </div>
                        <button
                            v-else-if="sale"
                            class="totals__discount-toggle"
                            @click="openOrderDiscount"
                        >
                            <i class="pi pi-tag"></i>
                            {{ (sale?.discount ?? 0) > 0 ? 'Editar descuento' : 'Agregar descuento' }}
                        </button>
                    </div>

                    <div class="totals__row totals__row--total">
                        <span>Total</span>
                        <span>S/ {{ orderTotals.total.toFixed(2) }}</span>
                    </div>
                </div>

                <!-- Botones -->
                <div class="action-btns">
                    <button
                        v-if="entitlements.hasKitchen"
                        class="action-btn action-btn--stations"
                        :disabled="pendingItems.length === 0"
                        @click="enviarEstaciones"
                    >
                        <i class="pi pi-send"></i>
                        {{ dispatchActionLabel }}
                        <span v-if="pendingItems.length > 0" class="pending-count">{{ pendingItems.length }}</span>
                    </button>
                    <button v-if="!isOffPremise" class="action-btn action-btn--transfer" @click="showTransferDialog = true">
                        <i class="pi pi-arrow-right-arrow-left"></i> Cambiar Mesa
                    </button>
                    <button
                        v-if="isDelivery && sale?.deliveryStatus === DELIVERY_STATUS.PENDING"
                        class="action-btn action-btn--stations"
                        :disabled="deliveryBusy"
                        @click="advanceDelivery(DELIVERY_STATUS.DISPATCHED)"
                    >
                        <i class="pi pi-truck"></i> Despachar reparto
                    </button>
                    <button
                        v-if="isDelivery && sale?.deliveryStatus === DELIVERY_STATUS.DISPATCHED"
                        class="action-btn action-btn--stations"
                        :disabled="deliveryBusy"
                        @click="advanceDelivery(DELIVERY_STATUS.DELIVERED)"
                    >
                        <i class="pi pi-check"></i> Marcar entregado
                    </button>
                    <button class="action-btn action-btn--pay" @click="procederPago">
                        Proceder al Pago
                    </button>
                </div>
            </div>

        </div>

        <!-- Mobile tab bar (only visible on <=768px screens) -->
        <div class="mobile-tab-bar">

            <button
                class="mobile-tab-bar__tab"
                :class="{ 'mobile-tab-bar__tab--active': mobileView === 'catalog' }"
                @click="mobileView = 'catalog'"
            >
                <i class="pi pi-th-large"></i>
                <span>Catálogo</span>
            </button>
            <button
                class="mobile-tab-bar__tab"
                :class="{ 'mobile-tab-bar__tab--active': mobileView === 'cart' }"
                @click="mobileView = 'cart'"
            >
                <span class="mobile-tab-bar__icon-wrap">
                    <i class="pi pi-shopping-cart"></i>
                    <span v-if="itemCount > 0" class="mobile-tab-bar__badge">{{ itemCount }}</span>
                </span>
                <span>Orden</span>
            </button>
        </div>
    </div>

    <!-- Diálogo de transferencia de mesa -->
    <transfer-table-dialog
        v-model:visible="showTransferDialog"
        @transferred="onTransferred"
    />
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.pos-order-layout {
    display: flex;
    flex: 1;
    height: 100%;
    min-height: 0;
    background: #f3f4f6;
}

/* ── Columna izquierda ─────────────────────────────────────────────────────────────── */
.pos-catalog {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.pos-catalog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    background: #fff;
    border-bottom: 1px solid var(--surface-border);
}

/* ── Context badges ─────────────────────────────────────────────────────────────── */
.context-badges {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 1;
    min-width: 0;
}
.context-badge {
    display: flex;
    flex-direction: column;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 0.28rem 0.7rem;
    line-height: 1.25;
    min-width: 0;
}
.context-badge--blue { background: #dbeafe; border-color: #93c5fd; }
.context-badge--delivery {
    background: #6366f122;
    border-color: #6366f1;
    max-width: 360px;
}
.context-badge--delivery .context-badge__label { color: #6366f1; }
.context-badge--delivery .context-badge__value { color: #4338ca; }
.context-badge--takeaway {
    background: #fef3c722;
    border-color: #f59e0b;
    max-width: 320px;
}
.context-badge--takeaway .context-badge__label { color: #b45309; }
.context-badge--takeaway .context-badge__value { color: #92400e; }
.context-badge__row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
}
.context-badge__sep {
    color: #9ca3af;
    flex-shrink: 0;
}
.context-badge__value--muted {
    font-weight: 500;
    color: #4b5563;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.delivery-status-pill {
    display: inline-flex;
    padding: 0.08rem 0.45rem;
    border-radius: 999px;
    background: #ede9fe;
    color: #5b21b6;
    font-size: 0.65rem;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
}
.context-badge__label {
    font-size: 0.62rem;
    font-weight: 500;
    color: #1e40af;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.context-badge__value { font-size: 0.82rem; color: #1e3a8a; }
.context-badge__order-num {
    flex-shrink: 0;
    margin-right: 0.1rem;
}

.delivery-details {
    margin-top: 0.5rem;
    padding: 0.45rem 0.6rem;
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    border-radius: 8px;
    font-size: 0.78rem;
    color: #374151;
    line-height: 1.35;
}
.delivery-details__row {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
}
.delivery-details__row .pi {
    color: #6366f1;
    font-size: 0.75rem;
    margin-top: 0.15rem;
    flex-shrink: 0;
}

/* ── Search ─────────────────────────────────────────────────────────────── */
.search-wrapper {
    position: relative;
    flex: 1 1 200px;
    min-width: 160px;
}
.search-wrapper__icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #9ca3af);
    font-size: 0.9rem;
    pointer-events: none;
    z-index: 1;
}
.search-wrapper__input {
    width: 100%;
    padding-left: 2.25rem !important;
}

/* ── Pending chip ───────────────────────────────────────────────────────────────── */
.pending-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fbbf24;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
}

/* ── Category filter ───────────────────────────────────────────────────────── */
.pos-cat-filter-select { width: 240px; flex-shrink: 0; }
.pos-cat-filter-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}

/* ── Product grid ─────────────────────────────────────────────────────────────── */
.product-grid {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    align-content: start;
    padding: 1rem 1.25rem;
}
.product-grid__empty {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 3rem 0;
}

/* ── Product card ─────────────────────────────────────────────────────────────── */
.product-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--border-color, #e5e7eb);
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.15s, transform 0.15s;
    min-height: 310px;
}
.product-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.10); transform: translateY(-2px); }

.product-card__image {
    position: relative;
    height: 160px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
}
.product-card__icon { font-size: 3rem; color: #a5b4fc; opacity: 0.8; }
.product-card__img  { width: 100%; height: 100%; object-fit: cover; }

.product-card__avail {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.2rem 0.45rem;
    border-radius: 999px;
}
.product-card__avail--ok { background: #dcfce7; color: #166534; }
.product-card__avail--no { background: #fee2e2; color: #991b1b; }

.product-card__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.28);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;
}
.product-card:hover .product-card__overlay { opacity: 1; }

.product-card__add-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    border: none;
    background: var(--color-primary, #6366f1);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
}
.product-card__add-btn:hover { background: #4f46e5; }

.product-card__body {
    padding: 0.75rem 0.9rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
}
.product-card__category {
    font-size: 0.68rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.product-card__name {
    font-size: 0.88rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.3;
    margin: 2px 0 4px;
}
.product-card__desc {
    font-size: 0.74rem;
    color: #6366f1;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 6px;
}
.product-card__footer { display: flex; flex-direction: column; gap: 1px; margin-top: auto; }
.product-card__price  { font-size: 1rem; font-weight: 700; color: #2563eb; }
.product-card__sku    { font-size: 0.68rem; color: #9ca3af; }

/* ── Panel derecho (Orden actual) ───────────────────────────────────────────── */
.pos-panel {
    width: min(400px, 34vw);
    flex-shrink: 0;
    background: #fff;
    border-left: 1px solid var(--surface-border);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    box-shadow: -2px 0 12px rgba(15, 23, 42, 0.04);
}
.pos-panel__header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--surface-border);
    background: #fafafa;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.pos-panel__title-row {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
}
.pos-panel__title-icon {
    font-size: 1.15rem;
    color: var(--color-primary, #6366f1);
    margin-top: 0.1rem;
}
.pos-panel__title-block {
    flex: 1;
    min-width: 0;
}
.pos-panel__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.25;
}
.pos-panel__meta {
    margin: 0.2rem 0 0;
    font-size: 0.78rem;
    color: #6b7280;
    line-height: 1.35;
}
.pos-panel__items {
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.65rem 0.75rem;
    min-height: 0;
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
}
.pos-panel__items::-webkit-scrollbar {
    width: 6px;
}
.pos-panel__items::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 999px;
}
.pos-panel__items::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
.order-items-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.panel-empty {
    min-height: 12rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0.5;
}

/* ── Order item ─────────────────────────────────────────────────────────────── */
.order-item {
    background: #f9fafb;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 0.5rem 0.65rem;
}
.order-item__name { font-size: 0.86rem; font-weight: 600; color: #111827; line-height: 1.3; flex: 1; }
.order-item__subtotal { font-size: 0.9rem; font-weight: 700; color: var(--color-primary, #6366f1); }
.order-item--kitchen-cancelled { opacity: 0.72; }
.order-item--kitchen-cancelled .order-item__name { text-decoration: line-through; color: #9ca3af; }
.qty-stepper--locked { opacity: 0.55; }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.order-item__subtotal--excluded { font-size: 0.78rem; font-weight: 600; color: #dc2626; }

.kitchen-order-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    border: 1px solid;
}

.sent-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.65rem;
    font-weight: 600;
    color: #065f46;
    background: #d1fae5;
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
    white-space: nowrap;
    flex-shrink: 0;
}

.icon-btn {
    width: 1.55rem; height: 1.55rem;
    border-radius: 4px; border: none; background: transparent;
    color: #9ca3af;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; cursor: pointer;
    transition: background 0.12s, color 0.12s;
}
.icon-btn:hover { background: #f3f4f6; color: #374151; }
.icon-btn--danger:hover { background: #fee2e2; color: #dc2626; }
.icon-btn--active-green { background: #d1fae5; color: #059669; }
.icon-btn--active-yellow { background: #fef9c3; color: #92400e; }
.icon-btn--has-discount { color: #059669; }
.icon-btn--has-note { color: #d97706; }

/* ── Note ─────────────────────────────────────────────────────────────── */
.note-editor { display: flex; gap: 0.35rem; margin-top: 0.35rem; }
.note-editor__input {
    flex: 1; padding: 0.28rem 0.5rem; font-size: 0.76rem;
    border: 1px solid #fbbf24; border-radius: 4px; background: #fefce8; outline: none;
}
.note-editor__save {
    padding: 0.28rem 0.55rem; font-size: 0.72rem; font-weight: 700;
    background: #fbbf24; border: none; border-radius: 4px; cursor: pointer; color: #451a03;
}
.note-display {
    display: flex; align-items: center; gap: 0.3rem;
    font-size: 0.74rem; color: #92400e; background: #fef9c3;
    border-radius: 4px; padding: 0.2rem 0.45rem; margin-top: 0.3rem;
}

/* ── Discount editor ─────────────────────────────────────────────────────────── */
.discount-editor { margin-top: 0.35rem; }

/* toggle % / S/ */
.discount-type-toggle { display: flex; gap: 0.3rem; margin-bottom: 0.35rem; }
.disc-type-btn {
    flex: 1;
    padding: 0.25rem 0;
    font-size: 0.72rem;
    font-weight: 600;
    border: 1px solid #6ee7b7;
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
    color: #059669;
    transition: background 0.15s, color 0.15s;
}
.disc-type-btn--active {
    background: #059669;
    color: #fff;
    border-color: #059669;
}
.discount-editor__row { display: flex; align-items: center; gap: 0.3rem; }
.discount-editor__input {
    width: 4.5rem;
    padding: 0.28rem 0.4rem;
    font-size: 0.82rem;
    font-weight: 600;
    border: 1px solid #6ee7b7;
    border-radius: 4px;
    background: #ecfdf5;
    outline: none;
    text-align: center;
}
.discount-editor__input:focus { border-color: #059669; }
.discount-editor__pct { font-size: 0.82rem; font-weight: 700; color: #059669; }
.discount-editor__save {
    padding: 0.28rem 0.65rem; font-size: 0.74rem; font-weight: 700;
    background: #059669; border: none; border-radius: 4px; cursor: pointer; color: #fff;
}
.discount-editor__cancel {
    padding: 0.28rem 0.55rem; font-size: 0.72rem;
    background: transparent; border: 1px solid #d1d5db;
    border-radius: 4px; cursor: pointer; color: #6b7280;
}

/* Descuento guardado */
.discount-display {
    display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap;
    font-size: 0.74rem; color: #059669; background: #d1fae5;
    border-radius: 4px; padding: 0.2rem 0.45rem; margin-top: 0.3rem;
}
.discount-display__original {
    text-decoration: line-through;
    opacity: 0.6;
    font-size: 0.72rem;
}

/* ── Qty stepper ─────────────────────────────────────────────────────────────── */
.qty-stepper { display: flex; align-items: center; border: 1px solid var(--surface-border); border-radius: 6px; overflow: hidden; }
.qty-btn {
    width: 1.7rem; height: 1.7rem; border: none; background: #f3f4f6;
    cursor: pointer; font-size: 0.68rem;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
}
.qty-btn:hover { background: #e5e7eb; }
.qty-value { min-width: 2rem; text-align: center; font-size: 0.85rem; font-weight: 600; color: #111827; }

/* ── Panel footer (totales + acciones, siempre visible) ───────────────────── */
.pos-panel__footer {
    border-top: 1px solid var(--surface-border);
    padding: 0.75rem 1rem 0.85rem;
    background: #fff;
    box-shadow: 0 -6px 16px rgba(15, 23, 42, 0.06);
    z-index: 1;
}
.totals { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.85rem; }

.totals__ribbon {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 0 0 0.25rem;
    padding: 0.45rem 0.5rem;
    border: none;
    border-top: 1px dashed #e5e7eb;
    border-bottom: 1px dashed #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.totals__ribbon:hover {
    background: #f3f4f6;
    color: #374151;
}

.totals__ribbon .pi {
    font-size: 0.7rem;
}

.totals__breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-bottom: 0.15rem;
}

.totals__row { display: flex; justify-content: space-between; font-size: 0.84rem; color: #6b7280; }
.totals__row--total {
    font-size: 1rem; font-weight: 700; color: #111827;
    margin-top: 0.25rem; padding-top: 0.4rem;
    border-top: 1px solid var(--surface-border);
}
.totals__row--discount { color: #16a34a; font-weight: 600; }
.totals__discount-value { color: #16a34a; font-weight: 700; }
.totals__discount-toggle {
    display: flex; align-items: center; gap: 0.35rem;
    background: none; border: 1px dashed #d1d5db; border-radius: 6px;
    color: #6b7280; font-size: 0.78rem; cursor: pointer;
    padding: 0.3rem 0.6rem; margin-top: 0.25rem; width: 100%;
    transition: border-color 0.15s, color 0.15s;
}
.totals__discount-toggle:hover { border-color: #6366f1; color: #6366f1; }
.order-discount-editor {
    display: flex; align-items: center; gap: 0.35rem;
    margin-top: 0.25rem;
}
.order-discount-editor__type {
    border: 1px solid #d1d5db; border-radius: 6px;
    padding: 0.25rem 0.4rem; font-size: 0.82rem; background: var(--surface-card, #fff);
    color: #374151; cursor: pointer;
}
.order-discount-editor__input {
    flex: 1; border: 1px solid #d1d5db; border-radius: 6px;
    padding: 0.25rem 0.5rem; font-size: 0.82rem; outline: none;
    min-width: 0;
}
.order-discount-editor__input:focus { border-color: #6366f1; }
.order-discount-editor__btn {
    border: none; border-radius: 6px; cursor: pointer;
    padding: 0.3rem 0.45rem; font-size: 0.8rem;
}
.order-discount-editor__btn--ok     { background: #6366f1; color: #fff; }
.order-discount-editor__btn--clear  { background: #fee2e2; color: #dc2626; }
.order-discount-editor__btn--cancel { background: #f3f4f6; color: #6b7280; }

.action-btns { display: flex; flex-direction: column; gap: 0.55rem; }
.action-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.65rem; border: none; border-radius: 8px;
    font-size: 0.86rem; font-weight: 600; cursor: pointer; color: #fff;
    transition: opacity 0.15s;
}
.action-btn:hover { opacity: 0.88; }
.action-btn:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    pointer-events: none;
}
.action-btn--stations { background: #059669; }
.action-btn--transfer { background: #0891b2; }
.action-btn--pay      { background: #2563eb; }

.pending-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.1rem;
    height: 1.1rem;
    border-radius: 999px;
    background: rgba(255,255,255,0.35);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0 0.25rem;
}

/* ── Mobile tab bar (hidden on desktop) ──────────────────────────────────── */
.mobile-tab-bar { display: none; }

/* ── Responsive: ≤ 768px ─────────────────────────────────────────────────── */
@media (max-width: 768px) {
    /* Stack catalog and panel vertically */
    .pos-order-layout {
        flex-direction: column;
        height: 100%;
        padding-bottom: 4.25rem; /* room for fixed tab bar */
    }

    /* Each pane fills the full screen when active */
    .pos-catalog,
    .pos-panel {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    /* Hide tabs based on mobileView state */
    .pos-catalog--mobile-hidden,
    .pos-panel--mobile-hidden {
        display: none !important;
    }

    /* Remove fixed-width side border on panel */
    .pos-panel {
        width: 100% !important;
        border-left: none;
        border-top: 1px solid var(--surface-border);
        box-shadow: none;
        height: 100%;
        min-height: 0;
    }

    .pos-panel__footer {
        padding-bottom: 0.5rem;
    }

    /* Catalog header: wrap badges + search on narrow screens */
    .pos-catalog__header {
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.6rem 0.75rem;
    }

    .context-badges {
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    /* Search full width on mobile */
    .search-wrapper {
        width: 100%;
    }
    .search-wrapper__input { width: 100%; }

    /* Smaller product cards — 2 columns */
    .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        padding: 0.6rem;
        gap: 0.6rem;
    }

    /* Remove tall min-height; let card grow naturally */
    .product-card { min-height: auto; }

    /* Slightly smaller image area */
    .product-card__image { height: 110px; }

    /* Show mobile tab bar */
    .mobile-tab-bar {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4.25rem;
        background: #1e1e2e;
        border-top: 1px solid rgba(255,255,255,0.08);
        z-index: 200;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.25);
    }

    .mobile-tab-bar__tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        border: none;
        background: transparent;
        color: #6b7280;
        font-size: 0.72rem;
        font-weight: 500;
        cursor: pointer;
        position: relative;
        transition: color 0.2s;
    }

    /* Indicador superior — línea activa */
    .mobile-tab-bar__tab::before {
        content: '';
        position: absolute;
        top: 0;
        left: 25%;
        right: 25%;
        height: 2.5px;
        border-radius: 0 0 3px 3px;
        background: transparent;
        transition: background 0.2s;
    }

    .mobile-tab-bar__tab--active {
        color: #fff;
        font-weight: 700;
    }

    /* Línea indicadora activa */
    .mobile-tab-bar__tab--active::before {
        background: #6366f1;
    }

    /* Pill de fondo en ícono activo */
    .mobile-tab-bar__tab--active .pi,
    .mobile-tab-bar__tab--active .mobile-tab-bar__icon-wrap {
        background: rgba(99,102,241,0.18);
        border-radius: 8px;
        padding: 0.3rem 0.75rem;
    }

    .mobile-tab-bar__tab .pi { font-size: 1.15rem; }

    .mobile-tab-bar__icon-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .mobile-tab-bar__badge {
        position: absolute;
        top: -0.45rem;
        right: -0.55rem;
        min-width: 1.1rem;
        height: 1.1rem;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        font-size: 0.62rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 0.25rem;
        line-height: 1;
        border: 1.5px solid #1e1e2e;
    }
}

/* ── Extra small: ≤ 480px ─────────────────────────────────────────────────── */
@media (max-width: 480px) {
    .product-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .context-badge {
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
    }
}
</style>
