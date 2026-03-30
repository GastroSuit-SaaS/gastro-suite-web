<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePaymentsStore }         from '../../application/payments.store.js'
import { PAYMENT_STATUS }           from '../../domain/models/payment.entity.js'

const store = usePaymentsStore()

onMounted(() => {
    store.fetchAll()
})

// ── Filtros ────────────────────────────────────────────────────────────────
const filterMethod  = ref('all')
const filterReceipt = ref('all')
const searchQuery   = ref('')

const METHODS = [
    { key: 'all',  label: 'Todos',    icon: 'pi-list' },
    { key: 'cash', label: 'Efectivo', icon: 'pi-money-bill' },
    { key: 'card', label: 'Tarjeta',  icon: 'pi-credit-card' },
    { key: 'yape', label: 'Yape',     icon: 'pi-mobile' },
    { key: 'plin', label: 'Plin',     icon: 'pi-send' },
]

const RECEIPT_LABELS = { nota: 'Nota de Venta', boleta: 'Boleta', factura: 'Factura' }
const METHOD_LABELS  = { cash: 'Efectivo', card: 'Tarjeta', yape: 'Yape', plin: 'Plin' }
const METHOD_COLORS  = { cash: '#10b981', card: '#6366f1', yape: '#8b5cf6', plin: '#3b82f6' }
const RECEIPT_COLORS = { nota: '#6b7280', boleta: '#f59e0b', factura: '#3b82f6' }

const filteredPayments = computed(() => {
    let list = store.todaysPayments
    if (filterMethod.value  !== 'all') list = list.filter(p => p.method      === filterMethod.value)
    if (filterReceipt.value !== 'all') list = list.filter(p => p.receiptType === filterReceipt.value)
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.trim().toLowerCase()
        list = list.filter(p =>
            String(p.tableNumber).includes(q) ||
            String(p.saleId).includes(q)      ||
            (p.receiptData?.nombre?.toLowerCase().includes(q)) ||
            (p.receiptData?.razonSocial?.toLowerCase().includes(q)) ||
            (p.receiptData?.dni?.includes(q)) ||
            (p.receiptData?.ruc?.includes(q))
        )
    }
    return list
})

// ── Detalle expandido ──────────────────────────────────────────────────────
const expandedId = ref(null)
function toggleExpand(id) {
    expandedId.value = expandedId.value === id ? null : id
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
    <div class="pay-history">

        <!-- ══ Stat cards ═════════════════════════════════════════════════ -->
        <div class="stat-strip">
            <div class="stat-card stat-card--primary">
                <span class="stat-card__label">Total del día</span>
                <span class="stat-card__value">S/ {{ store.todayTotal.toFixed(2) }}</span>
                <span class="stat-card__sub">{{ store.todayCount }} transacción{{ store.todayCount !== 1 ? 'es' : '' }}</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__method-row">
                    <span class="method-dot" style="background:#10b981"></span>
                    <span class="stat-card__label">Efectivo</span>
                </div>
                <span class="stat-card__value stat-card__value--sm">S/ {{ store.todayByMethod.cash.toFixed(2) }}</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__method-row">
                    <span class="method-dot" style="background:#6366f1"></span>
                    <span class="stat-card__label">Tarjeta</span>
                </div>
                <span class="stat-card__value stat-card__value--sm">S/ {{ store.todayByMethod.card.toFixed(2) }}</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__method-row">
                    <span class="method-dot" style="background:#8b5cf6"></span>
                    <span class="stat-card__label">Yape</span>
                </div>
                <span class="stat-card__value stat-card__value--sm">S/ {{ store.todayByMethod.yape.toFixed(2) }}</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__method-row">
                    <span class="method-dot" style="background:#3b82f6"></span>
                    <span class="stat-card__label">Plin</span>
                </div>
                <span class="stat-card__value stat-card__value--sm">S/ {{ store.todayByMethod.plin.toFixed(2) }}</span>
            </div>
        </div>

        <!-- ══ Filtros ════════════════════════════════════════════════════ -->
        <div class="filters-bar">
            <!-- Búsqueda -->
            <div class="search-wrap">
                <i class="pi pi-search search-wrap__icon"></i>
                <input
                    v-model="searchQuery"
                    class="search-wrap__input"
                    placeholder="Buscar por mesa, orden, DNI, RUC..."
                />
            </div>

            <!-- Método de pago -->
            <div class="filter-group">
                <span class="filter-group__label">Método</span>
                <button
                    v-for="m in METHODS"
                    :key="m.key"
                    :class="['filter-pill', filterMethod === m.key ? 'filter-pill--active' : '']"
                    @click="filterMethod = m.key"
                >
                    <i :class="['pi', m.icon]"></i>
                    {{ m.label }}
                </button>
            </div>

            <span class="filter-divider"></span>

            <!-- Comprobante -->
            <div class="filter-group">
                <span class="filter-group__label">Comprobante</span>
                <button
                    :class="['filter-pill', filterReceipt === 'all' ? 'filter-pill--active' : '']"
                    @click="filterReceipt = 'all'"
                >Todos</button>
                <button
                    v-for="[key, label] in Object.entries(RECEIPT_LABELS)"
                    :key="key"
                    :class="['filter-pill', filterReceipt === key ? 'filter-pill--active' : '']"
                    @click="filterReceipt = key"
                >{{ label }}</button>
            </div>
        </div>

        <!-- ══ Loading ════════════════════════════════════════════════════ -->
        <div v-if="store.isLoading" class="state-msg">
            <i class="pi pi-spin pi-spinner" style="font-size:1.6rem;color:#9ca3af"></i>
            <span>Cargando pagos...</span>
        </div>

        <!-- ══ Empty ══════════════════════════════════════════════════════ -->
        <div v-else-if="filteredPayments.length === 0" class="state-msg">
            <i class="pi pi-receipt" style="font-size:2rem;color:#d1d5db"></i>
            <span class="state-msg__title">Sin pagos registrados hoy</span>
            <span class="state-msg__sub">Los pagos procesados desde el POS aparecerán aquí</span>
        </div>

        <!-- ══ Tabla de pagos ═════════════════════════════════════════════ -->
        <div v-else class="pay-table-wrap">
            <table class="pay-table">
                <thead>
                    <tr>
                        <th>Hora</th>
                        <th>Orden</th>
                        <th>Mesa / Zona</th>
                        <th>Método</th>
                        <th>Comprobante</th>
                        <th style="text-align:right">Total</th>
                        <th style="text-align:right">Recibido</th>
                        <th style="text-align:right">Vuelto</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <template
                        v-for="p in filteredPayments"
                        :key="p.id"
                    >
                        <!-- Fila principal -->
                        <tr
                            :class="['pay-row', expandedId === p.id ? 'pay-row--expanded' : '']"
                            @click="toggleExpand(p.id)"
                        >
                            <td class="td-time">{{ formatTime(p.processedAt) }}</td>
                            <td class="td-order">#{{ p.saleId }}</td>
                            <td class="td-table">
                                <span v-if="p.tableNumber">Mesa {{ p.tableNumber }}</span>
                                <span v-else class="td-na">—</span>
                                <span v-if="p.zoneName" class="td-zone"> · {{ p.zoneName }}</span>
                            </td>
                            <td>
                                <span
                                    class="badge"
                                    :style="{ background: METHOD_COLORS[p.method] + '22', color: METHOD_COLORS[p.method], border: '1px solid ' + METHOD_COLORS[p.method] + '66' }"
                                >
                                    {{ METHOD_LABELS[p.method] ?? p.method }}
                                </span>
                            </td>
                            <td>
                                <span
                                    class="badge"
                                    :style="{ background: RECEIPT_COLORS[p.receiptType] + '22', color: RECEIPT_COLORS[p.receiptType], border: '1px solid ' + RECEIPT_COLORS[p.receiptType] + '66' }"
                                >
                                    {{ RECEIPT_LABELS[p.receiptType] ?? p.receiptType }}
                                </span>
                            </td>
                            <td class="td-amount">S/ {{ p.total.toFixed(2) }}</td>
                            <td class="td-amount">S/ {{ p.amountReceived.toFixed(2) }}</td>
                            <td class="td-amount td-change">
                                <span v-if="p.change > 0">S/ {{ p.change.toFixed(2) }}</span>
                                <span v-else class="td-na">—</span>
                            </td>
                            <td class="td-expand">
                                <i :class="['pi', expandedId === p.id ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                            </td>
                        </tr>

                        <!-- Detalle expandido -->
                        <tr v-if="expandedId === p.id" class="detail-row">
                            <td colspan="9">
                                <div class="detail-wrap">
                                    <!-- Items -->
                                    <div class="detail-col">
                                        <p class="detail-col__title">Productos</p>
                                        <div
                                            v-for="(item, idx) in p.items"
                                            :key="idx"
                                            class="detail-item"
                                        >
                                            <span class="detail-item__qty">{{ item.qty }}×</span>
                                            <span class="detail-item__name">{{ item.name }}</span>
                                            <span class="detail-item__price">S/ {{ item.subtotal.toFixed(2) }}</span>
                                        </div>
                                        <div class="detail-totals">
                                            <div class="detail-total-row">
                                                <span>Subtotal</span>
                                                <span>S/ {{ p.subtotal.toFixed(2) }}</span>
                                            </div>
                                            <div class="detail-total-row">
                                                <span>IGV (18%)</span>
                                                <span>S/ {{ p.tax.toFixed(2) }}</span>
                                            </div>
                                            <div v-if="p.discount > 0" class="detail-total-row detail-total-row--disc">
                                                <span>Descuento</span>
                                                <span>- S/ {{ p.discount.toFixed(2) }}</span>
                                            </div>
                                            <div class="detail-total-row detail-total-row--grand">
                                                <span>Total</span>
                                                <span>S/ {{ p.total.toFixed(2) }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Datos del comprobante -->
                                    <div v-if="p.receiptType !== 'nota'" class="detail-col">
                                        <p class="detail-col__title">Datos del Comprobante</p>
                                        <template v-if="p.receiptType === 'boleta'">
                                            <div class="detail-field" v-if="p.receiptData?.dni">
                                                <span class="detail-field__label">DNI</span>
                                                <span class="detail-field__val">{{ p.receiptData.dni }}</span>
                                            </div>
                                            <div class="detail-field" v-if="p.receiptData?.nombre">
                                                <span class="detail-field__label">Nombre</span>
                                                <span class="detail-field__val">{{ p.receiptData.nombre }}</span>
                                            </div>
                                        </template>
                                        <template v-if="p.receiptType === 'factura'">
                                            <div class="detail-field" v-if="p.receiptData?.ruc">
                                                <span class="detail-field__label">RUC</span>
                                                <span class="detail-field__val">{{ p.receiptData.ruc }}</span>
                                            </div>
                                            <div class="detail-field" v-if="p.receiptData?.razonSocial">
                                                <span class="detail-field__label">Razón Social</span>
                                                <span class="detail-field__val">{{ p.receiptData.razonSocial }}</span>
                                            </div>
                                            <div class="detail-field" v-if="p.receiptData?.direccion">
                                                <span class="detail-field__label">Dirección</span>
                                                <span class="detail-field__val">{{ p.receiptData.direccion }}</span>
                                            </div>
                                        </template>
                                    </div>

                                    <!-- Fecha completa -->
                                    <div class="detail-col">
                                        <p class="detail-col__title">Registro</p>
                                        <div class="detail-field">
                                            <span class="detail-field__label">Fecha</span>
                                            <span class="detail-field__val">{{ formatDate(p.processedAt) }}</span>
                                        </div>
                                        <div class="detail-field">
                                            <span class="detail-field__label">Hora</span>
                                            <span class="detail-field__val">{{ formatTime(p.processedAt) }}</span>
                                        </div>
                                        <div class="detail-field">
                                            <span class="detail-field__label">ID Pago</span>
                                            <span class="detail-field__val">#{{ p.id }}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

    </div>
</template>

<style scoped>
/* ── Contenedor principal ────────────────────────────────────────────────── */
.pay-history {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    height: 100%;
    overflow-y: auto;
    background: #f3f4f6;
}

/* ── Stat strip ──────────────────────────────────────────────────────────── */
.stat-strip {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.stat-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 130px;
}

.stat-card--primary {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-color: transparent;
    color: #fff;
}
.stat-card--primary .stat-card__label { color: rgba(255,255,255,0.75); }
.stat-card--primary .stat-card__sub   { color: rgba(255,255,255,0.6); font-size: 0.75rem; }

.stat-card__method-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.method-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.stat-card__label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.stat-card__value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #111827;
    line-height: 1;
}
.stat-card--primary .stat-card__value { color: #fff; }

.stat-card__value--sm { font-size: 1.2rem; }

/* ── Filtros ─────────────────────────────────────────────────────────────── */
.filters-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.search-wrap {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 320px;
}
.search-wrap__icon {
    position: absolute;
    left: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 0.85rem;
    pointer-events: none;
}
.search-wrap__input {
    width: 100%;
    padding: 0.45rem 0.75rem 0.45rem 2.1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.83rem;
    background: #fff;
    color: #111827;
    outline: none;
    transition: border-color 0.15s;
}
.search-wrap__input:focus { border-color: #6366f1; }

.filter-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.filter-group__label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 0.15rem;
    white-space: nowrap;
}

.filter-divider {
    display: block;
    width: 1px;
    height: 1.5rem;
    background: #e5e7eb;
    flex-shrink: 0;
    align-self: center;
}

.filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    background: #fff;
    color: #4b5563;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;
}
.filter-pill:hover { border-color: #6366f1; color: #4338ca; background: #eef2ff; }
.filter-pill--active {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
    font-weight: 600;
}

/* ── Estados ─────────────────────────────────────────────────────────────── */
.state-msg {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #9ca3af;
    padding: 3rem;
}
.state-msg__title { font-size: 1rem; font-weight: 600; color: #6b7280; }
.state-msg__sub   { font-size: 0.83rem; }

/* ── Tabla ───────────────────────────────────────────────────────────────── */
.pay-table-wrap {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}

.pay-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.83rem;
}

.pay-table thead tr {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
}

.pay-table th {
    padding: 0.7rem 0.85rem;
    text-align: left;
    font-size: 0.73rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
}

.pay-row {
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background 0.1s;
}
.pay-row:hover,
.pay-row--expanded { background: #fafafe; }

.pay-table td {
    padding: 0.7rem 0.85rem;
    color: #374151;
    vertical-align: middle;
}

.td-time   { color: #6b7280; white-space: nowrap; }
.td-order  { font-weight: 600; color: #6366f1; }
.td-table  { white-space: nowrap; }
.td-zone   { color: #9ca3af; font-size: 0.78rem; }
.td-na     { color: #d1d5db; }
.td-amount { text-align: right; font-weight: 600; white-space: nowrap; }
.td-change { color: #059669; }
.td-expand { width: 2rem; text-align: center; color: #9ca3af; }

/* ── Badge ───────────────────────────────────────────────────────────────── */
.badge {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}

/* ── Detalle expandido ───────────────────────────────────────────────────── */
.detail-row td {
    padding: 0;
    background: #fafafe;
    border-bottom: 1px solid #e5e7eb;
}

.detail-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1.1rem 1.25rem;
}

.detail-col {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 180px;
    flex: 1;
}

.detail-col__title {
    margin: 0 0 0.3rem;
    font-size: 0.73rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.detail-item {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    font-size: 0.82rem;
}
.detail-item__qty  { font-weight: 700; color: #6366f1; min-width: 1.5rem; flex-shrink: 0; }
.detail-item__name { flex: 1; color: #374151; }
.detail-item__price { color: #374151; font-weight: 500; white-space: nowrap; }

.detail-totals {
    margin-top: 0.5rem;
    border-top: 1px solid #e5e7eb;
    padding-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.detail-total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    color: #6b7280;
}
.detail-total-row--disc  { color: #059669; }
.detail-total-row--grand {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    font-weight: 700;
    color: #111827;
    border-top: 1px solid #e5e7eb;
    padding-top: 0.3rem;
    margin-top: 0.15rem;
}

.detail-field {
    display: flex;
    gap: 0.5rem;
    font-size: 0.8rem;
}
.detail-field__label {
    color: #9ca3af;
    min-width: 6rem;
    flex-shrink: 0;
    font-weight: 500;
}
.detail-field__val {
    color: #374151;
    font-weight: 500;
}
</style>

