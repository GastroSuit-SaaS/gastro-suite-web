<script setup>
import { computed } from 'vue'
import { useCashRegisterStore } from '../../application/cash-register.store.js'
import DataManager from '../../../shared/presentation/components/data-manager.vue'
import { METHOD_COLORS } from '../../../payments/presentation/constants/payments.constants-ui.js'
import {
    CASH_REGISTER_LABELS as L,
    MOVEMENT_TYPE_CONFIG,
    MOVEMENT_CATEGORY_CONFIG,
} from '../constants/cash-register.constants-ui.js'

const store = useCashRegisterStore()

const props = defineProps({
    items: { type: Array, required: true },
    filteredItems: { type: Array, default: null },
    loading: { type: Boolean, default: false },
    showToolbar: { type: Boolean, default: true },
    showActions: { type: Boolean, default: true },
    globalFilterValue: { type: String, default: '' },
    inlineToolbar: { type: Boolean, default: false },
    newButtonLabel: { type: String, default: '' },
    emptyIcon: { type: String, default: 'pi-inbox' },
    emptyTitle: { type: String, default: 'Sin movimientos' },
    emptySubtitle: { type: String, default: '' },
    rows: { type: Number, default: 20 },
    embedded: { type: Boolean, default: false },
})

const emit = defineEmits([
    'new-item-requested-manager',
    'global-filter-change',
    'view-payment',
    'delete-movement',
])

const displayItems = computed(() => props.filteredItems ?? props.items)

const columns = computed(() => {
    const cols = [
        { field: 'createdAt', header: 'Fecha', sortable: true, template: 'cr-mov-time', style: 'min-width: 100px' },
        { field: 'saleDisplayNumber', header: L.ORDER, sortable: true, template: 'cr-mov-order', style: 'min-width: 80px' },
        { field: 'category', header: 'Categoría', sortable: true, template: 'cr-mov-category', style: 'min-width: 120px' },
        { field: 'paymentMethod', header: L.PAYMENT_METHOD, sortable: true, template: 'cr-mov-method', style: 'min-width: 110px' },
        { field: 'description', header: L.DETAIL, sortable: false, template: 'cr-mov-detail', style: 'min-width: 160px' },
        { field: 'type', header: 'Tipo', sortable: true, template: 'cr-mov-type', style: 'min-width: 90px' },
        { field: 'amount', header: 'Monto', sortable: true, template: 'cr-mov-amount', bodyStyle: 'text-align: right', headerStyle: 'text-align: right' },
        { field: 'collectedBy', header: L.COLLECTED_BY, sortable: true, template: 'cr-mov-user', style: 'min-width: 110px' },
    ]
    if (props.showActions) {
        cols.push({ field: 'actions', header: '', sortable: false, template: 'cr-mov-actions', style: 'min-width: 5rem' })
    }
    return cols
})

function formatDateTime(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    if (isNaN(d.getTime())) return String(dt)
    return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatMovementTime(dt) {
    if (!dt) return '—'
    const d = new Date(dt)
    if (isNaN(d.getTime())) return String(dt)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function categoryLabel(cat) {
    return MOVEMENT_CATEGORY_CONFIG[cat]?.label ?? cat
}

function categoryIcon(cat) {
    return MOVEMENT_CATEGORY_CONFIG[cat]?.icon ?? 'pi pi-circle'
}

function fmtCurrency(n) {
    return `S/ ${(n ?? 0).toFixed(2)}`
}

function methodDotColor(mov) {
    const key = (mov?.paymentMethod || '').toLowerCase()
    if (key && METHOD_COLORS[key]) return METHOD_COLORS[key]
    if (mov?.category === 'venta') return '#10b981'
    if (mov?.category === 'venta_digital') return '#8b5cf6'
    return '#9ca3af'
}

function movementRowClass(mov) {
    return mov?.paymentId ? 'gs-row--clickable' : undefined
}

function onViewMovement(mov) {
    if (mov?.paymentId) emit('view-payment', mov)
}
</script>

<template>
    <data-manager
        :class="['session-movements-table', embedded && 'session-movements-table--embedded']"
        :items="items"
        :filtered-items="displayItems"
        :columns="columns"
        :title="{ singular: 'movimiento', plural: 'movimientos' }"
        :loading="loading"
        :dynamic="true"
        :global-filter-value="globalFilterValue"
        search-placeholder="Buscar orden, mesa, detalle…"
        :show-toolbar="showToolbar"
        :inline-toolbar="inlineToolbar"
        :new-button-label="newButtonLabel || L.NEW_MOVEMENT"
        :show-export="false"
        :show-selection="false"
        :show-actions="false"
        :show-new="inlineToolbar && showToolbar"
        :empty-icon="emptyIcon"
        :empty-title="emptyTitle"
        :empty-subtitle="emptySubtitle"
        item-label="movimientos"
        :rows="rows"
        :row-class="movementRowClass"
        @new-item-requested-manager="emit('new-item-requested-manager')"
        @global-filter-change="emit('global-filter-change', $event)"
        @view-item-requested-manager="onViewMovement"
    >
        <template v-if="$slots.filters" #filters>
            <slot name="filters" />
        </template>

        <template v-if="$slots['empty-actions']" #empty-actions>
            <slot name="empty-actions" />
        </template>

        <template #cr-mov-time="{ data: mov }">
            <span class="td-time" :title="formatDateTime(mov.createdAt)">{{ formatMovementTime(mov.createdAt) }}</span>
        </template>

        <template #cr-mov-order="{ data: mov }">
            <span class="td-order font-semibold text-color">{{ store.movementOrderLabel(mov) }}</span>
        </template>

        <template #cr-mov-category="{ data: mov }">
            <span class="cr-cat-badge" :class="`cr-cat-badge--${mov.category}`">
                <i :class="categoryIcon(mov.category)" aria-hidden="true" />
                {{ categoryLabel(mov.category) }}
            </span>
        </template>

        <template #cr-mov-method="{ data: mov }">
            <span v-if="store.movementPaymentMethodLabel(mov)" class="method-pill">
                <span class="method-dot" :style="{ background: methodDotColor(mov) }"></span>
                {{ store.movementPaymentMethodLabel(mov) }}
            </span>
            <span v-else class="text-color-secondary">—</span>
        </template>

        <template #cr-mov-detail="{ data: mov }">
            <span class="font-medium text-color td-detail">{{ store.movementDescriptionText(mov) }}</span>
        </template>

        <template #cr-mov-type="{ data: mov }">
            <span
                class="badge"
                :style="mov.type === 'income'
                    ? 'background:#dcfce7;color:#16a34a;border:1px solid #16a34a66'
                    : 'background:#fee2e2;color:#dc2626;border:1px solid #dc262666'"
            >
                {{ MOVEMENT_TYPE_CONFIG[mov.type]?.label ?? mov.type }}
            </span>
        </template>

        <template #cr-mov-amount="{ data: mov }">
            <span class="td-amount" :style="mov.type === 'income' ? 'color:#16a34a' : 'color:#dc2626'">
                {{ mov.type === 'expense' ? '−' : '+' }} {{ fmtCurrency(mov.amount) }}
            </span>
        </template>

        <template #cr-mov-user="{ data: mov }">
            <span class="td-user">{{ store.movementCollectedBy(mov) }}</span>
        </template>

        <template v-if="showActions" #cr-mov-actions="{ data: mov }">
            <div class="cr-row-actions">
                <button
                    v-if="mov.paymentId"
                    type="button"
                    class="dm-action-btn dm-action-btn--view"
                    :title="L.VIEW_PAYMENT"
                    @click.stop="emit('view-payment', mov)"
                >
                    <i class="pi pi-eye" />
                </button>
                <button
                    v-if="store.canDeleteMovement(mov)"
                    type="button"
                    class="dm-action-btn dm-action-btn--delete"
                    title="Eliminar"
                    @click.stop="emit('delete-movement', mov)"
                >
                    <i class="pi pi-trash" />
                </button>
            </div>
        </template>
    </data-manager>
</template>

<style scoped>
.session-movements-table {
    flex: 1;
    min-height: 0;
}

.session-movements-table--embedded :deep(.gs-empty--plain) {
    min-height: 120px;
    padding: 1.25rem 0.5rem;
}

.cr-row-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.25rem;
}

.td-time { white-space: nowrap; color: #6b7280; }
.td-order { color: #6366f1; }
.td-detail { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-amount { text-align: right; font-weight: 600; white-space: nowrap; }
.td-user { white-space: nowrap; }

.badge {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}

.method-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    white-space: nowrap;
}

.method-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
}

.cr-cat-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    white-space: nowrap;
}

.cr-cat-badge .pi { font-size: 0.7rem; }

.cr-cat-badge--venta { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
.cr-cat-badge--venta_digital { background: #ede9fe; color: #6d28d9; border-color: #ddd6fe; }
.cr-cat-badge--apertura { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
.cr-cat-badge--reembolso { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
.cr-cat-badge--PROPIA { background: #fce7f3; color: #be185d; border-color: #fbcfe8; }
</style>
