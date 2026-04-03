<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePaymentsStore }         from '../../application/payments.store.js'
import { PAYMENT_STATUS }           from '../../domain/models/payment.entity.js'
import {
    METHOD_LABELS, METHOD_COLORS, METHOD_FILTER_OPTIONS,
    RECEIPT_LABELS, RECEIPT_COLORS,
    PAYMENT_STATUS_CONFIG,
} from '../constants/payments.constants-ui.js'
import ModuleStateFeedback           from '../../../shared/presentation/components/module-state-feedback.vue'

const store = usePaymentsStore()

onMounted(() => {
    store.fetchAll()
})

// ── Paginación ───────────────────────────────────────────────────────────
const PAGE_SIZE = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(store.filteredPayments.length / PAGE_SIZE)))
const paginatedPayments = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return store.filteredPayments.slice(start, start + PAGE_SIZE)
})

// ── Detalle en popup ─────────────────────────────────────────────────────
const detailPayment = ref(null)
function openDetail(p)  { detailPayment.value = p }
function closeDetail()  { detailPayment.value = null }

const confirmRefundId = ref(null)
function openRefundConfirm(id) { confirmRefundId.value = id }
function cancelRefund()        { confirmRefundId.value = null }
async function confirmRefund() {
    if (!confirmRefundId.value) return
    await store.refund(confirmRefundId.value)
    confirmRefundId.value = null
    closeDetail()
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Dropdown options ─────────────────────────────────────────────────────
const methodOptions = [
    { label: 'Todos', value: 'all' },
    ...METHOD_FILTER_OPTIONS.filter(m => m.key !== 'all').map(m => ({ label: m.label, value: m.key })),
]
const receiptOptions = [
    { label: 'Todos', value: 'all' },
    ...Object.entries(RECEIPT_LABELS).map(([key, label]) => ({ label, value: key })),
]
</script>

<template>
    <module-state-feedback
        :loading="store.isLoading"
        :error="store.error"
        loading-label="Cargando pagos..."
        @retry="store.fetchAll()"
    >
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
        <div class="flex align-items-center flex-wrap gap-3">
            <!-- Búsqueda -->
            <pv-icon-field class="flex-1" style="min-width: 200px">
                <pv-input-icon class="pi pi-search" />
                <pv-input-text
                    :modelValue="store.searchQuery"
                    @update:modelValue="store.setSearchQuery($event); currentPage = 1"
                    placeholder="Buscar por mesa, orden, DNI, RUC..."
                    class="w-full"
                    size="small"
                />
            </pv-icon-field>

            <!-- Método de pago -->
            <div class="flex align-items-center gap-2">
                <label class="text-xs font-semibold text-color-secondary uppercase white-space-nowrap">Método</label>
                <pv-select
                    :modelValue="store.filterMethod"
                    @update:modelValue="store.setFilterMethod($event); currentPage = 1"
                    :options="methodOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Todos"
                    size="small"
                    style="min-width: 140px"
                />
            </div>

            <!-- Comprobante -->
            <div class="flex align-items-center gap-2">
                <label class="text-xs font-semibold text-color-secondary uppercase white-space-nowrap">Comprobante</label>
                <pv-select
                    :modelValue="store.filterReceipt"
                    @update:modelValue="store.setFilterReceipt($event); currentPage = 1"
                    :options="receiptOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Todos"
                    size="small"
                    style="min-width: 160px"
                />
            </div>

            <!-- Hoy / Historial -->
            <pv-button
                :label="store.showAll ? 'Historial completo' : 'Solo hoy'"
                icon="pi pi-history"
                :outlined="!store.showAll"
                size="small"
                severity="secondary"
                @click="store.setShowAll(!store.showAll); currentPage = 1"
            />
        </div>

        <!-- ══ Empty ═══════════════════════════════════════════════════════════ -->
        <div v-if="store.filteredPayments.length === 0" class="state-msg">
            <i class="pi pi-receipt" style="font-size:2rem;color:#d1d5db"></i>
            <span class="state-msg__title">Sin pagos registrados hoy</span>
            <span class="state-msg__sub">Los pagos procesados desde el POS aparecerán aquí</span>
        </div>

        <!-- ══ Tabla de pagos ═════════════════════════════════════════════ -->
        <div v-else class="pay-table-wrap">
            <table class="pay-table">
                <thead>
                    <tr>
                        <th>{{ store.showAll ? 'Fecha' : 'Hora' }}</th>
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
                    <tr
                        v-for="p in paginatedPayments"
                        :key="p.id"
                        class="pay-row"
                        @click="openDetail(p)"
                    >
                            <td class="td-time">
                                <template v-if="store.showAll">
                                    <span class="td-date">{{ formatDate(p.processedAt) }}</span>
                                    <span class="td-hour">{{ formatTime(p.processedAt) }}</span>
                                </template>
                                <template v-else>{{ formatTime(p.processedAt) }}</template>
                            </td>
                            <td class="td-order">
                                #{{ p.saleId }}
                                <span v-if="p.isSplit" class="badge badge--split" title="Pago dividido">
                                    <i class="pi pi-users" style="font-size:0.6rem"></i>
                                    {{ p.splitIndex + 1 }}/{{ p.splitCount }}
                                </span>
                            </td>
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
                                <i class="pi pi-eye"></i>
                            </td>
                        </tr>
                </tbody>
            </table>
        </div>

        <!-- Paginación -->
        <div v-if="store.filteredPayments.length > PAGE_SIZE" class="pay-pagination">
            <span class="pay-pagination__info">
                {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, store.filteredPayments.length) }}
                de {{ store.filteredPayments.length }}
            </span>
            <div class="pay-pagination__controls">
                <button class="pay-pagination__btn" :disabled="currentPage <= 1" @click="currentPage--">
                    <i class="pi pi-chevron-left"></i>
                </button>
                <span class="pay-pagination__page">{{ currentPage }} / {{ totalPages }}</span>
                <button class="pay-pagination__btn" :disabled="currentPage >= totalPages" @click="currentPage++">
                    <i class="pi pi-chevron-right"></i>
                </button>
            </div>
        </div>

    </div>
    </module-state-feedback>

    <!-- ══ Popup detalle ═════════════════════════════════════════════════ -->
    <Teleport to="body">
        <Transition name="dlg-fade">
            <div v-if="detailPayment" class="dlg-backdrop" @click.self="closeDetail">
                <div class="dlg" role="dialog" aria-modal="true">

                    <!-- Header -->
                    <div class="dlg-header">
                        <div class="dlg-title">
                            <i class="pi pi-receipt" style="color:#6366f1;font-size:1rem"></i>
                            <span>Pago <strong>#{{ detailPayment.id }}</strong></span>
                            <span v-if="detailPayment.isSplit" class="badge badge--split">
                                <i class="pi pi-users" style="font-size:0.6rem"></i>
                                División {{ detailPayment.splitIndex + 1 }}/{{ detailPayment.splitCount }}
                            </span>
                            <span
                                class="badge"
                                :style="{ background: METHOD_COLORS[detailPayment.method] + '22', color: METHOD_COLORS[detailPayment.method], border: '1px solid ' + METHOD_COLORS[detailPayment.method] + '66' }"
                            >{{ METHOD_LABELS[detailPayment.method] }}</span>
                            <span
                                class="badge"
                                :style="{ background: RECEIPT_COLORS[detailPayment.receiptType] + '22', color: RECEIPT_COLORS[detailPayment.receiptType], border: '1px solid ' + RECEIPT_COLORS[detailPayment.receiptType] + '66' }"
                            >{{ RECEIPT_LABELS[detailPayment.receiptType] }}</span>
                            <span
                                v-if="PAYMENT_STATUS_CONFIG[detailPayment.status]"
                                class="badge"
                                :style="{ background: PAYMENT_STATUS_CONFIG[detailPayment.status].bg, color: PAYMENT_STATUS_CONFIG[detailPayment.status].color, border: '1px solid ' + PAYMENT_STATUS_CONFIG[detailPayment.status].color + '66' }"
                            >
                                <i :class="['pi', PAYMENT_STATUS_CONFIG[detailPayment.status].icon]" style="font-size:.7rem"></i>
                                {{ PAYMENT_STATUS_CONFIG[detailPayment.status].label }}
                            </span>
                        </div>
                        <button class="dlg-close" @click="closeDetail" aria-label="Cerrar">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="dlg-body">

                        <!-- Columna: Productos -->
                        <div class="detail-col">
                            <p class="detail-col__title">Productos</p>
                            <div
                                v-for="(item, idx) in detailPayment.items"
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
                                    <span>S/ {{ detailPayment.subtotal.toFixed(2) }}</span>
                                </div>
                                <div class="detail-total-row">
                                    <span>IGV (18%)</span>
                                    <span>S/ {{ detailPayment.tax.toFixed(2) }}</span>
                                </div>
                                <div v-if="detailPayment.discount > 0" class="detail-total-row detail-total-row--disc">
                                    <span>Descuento</span>
                                    <span>- S/ {{ detailPayment.discount.toFixed(2) }}</span>
                                </div>
                                <div class="detail-total-row detail-total-row--grand">
                                    <span>Total</span>
                                    <span>S/ {{ detailPayment.total.toFixed(2) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Columna: Pago -->
                        <div class="detail-col">
                            <p class="detail-col__title">Detalle del Pago</p>
                            <div class="detail-field">
                                <span class="detail-field__label">Recibido</span>
                                <span class="detail-field__val">S/ {{ detailPayment.amountReceived.toFixed(2) }}</span>
                            </div>
                            <div class="detail-field">
                                <span class="detail-field__label">Vuelto</span>
                                <span class="detail-field__val" :style="detailPayment.change > 0 ? 'color:#059669;font-weight:600' : ''">
                                    {{ detailPayment.change > 0 ? 'S/ ' + detailPayment.change.toFixed(2) : '—' }}
                                </span>
                            </div>
                            <div class="detail-field" v-if="detailPayment.tableNumber">
                                <span class="detail-field__label">Mesa</span>
                                <span class="detail-field__val">{{ detailPayment.tableNumber }}<span v-if="detailPayment.zoneName" style="color:#9ca3af"> · {{ detailPayment.zoneName }}</span></span>
                            </div>
                            <div class="detail-field">
                                <span class="detail-field__label">Fecha</span>
                                <span class="detail-field__val">{{ formatDate(detailPayment.processedAt) }}</span>
                            </div>
                            <div class="detail-field">
                                <span class="detail-field__label">Hora</span>
                                <span class="detail-field__val">{{ formatTime(detailPayment.processedAt) }}</span>
                            </div>
                            <div v-if="detailPayment.note" class="detail-field">
                                <span class="detail-field__label">Nota</span>
                                <span class="detail-field__val">{{ detailPayment.note }}</span>
                            </div>
                        </div>

                        <!-- Columna: Comprobante (solo si aplica) -->
                        <div v-if="detailPayment.receiptType !== 'nota'" class="detail-col">
                            <p class="detail-col__title">Datos del Comprobante</p>
                            <template v-if="detailPayment.receiptType === 'boleta'">
                                <div class="detail-field" v-if="detailPayment.receiptData?.dni">
                                    <span class="detail-field__label">DNI</span>
                                    <span class="detail-field__val">{{ detailPayment.receiptData.dni }}</span>
                                </div>
                                <div class="detail-field" v-if="detailPayment.receiptData?.nombre">
                                    <span class="detail-field__label">Nombre</span>
                                    <span class="detail-field__val">{{ detailPayment.receiptData.nombre }}</span>
                                </div>
                            </template>
                            <template v-if="detailPayment.receiptType === 'factura'">
                                <div class="detail-field" v-if="detailPayment.receiptData?.ruc">
                                    <span class="detail-field__label">RUC</span>
                                    <span class="detail-field__val">{{ detailPayment.receiptData.ruc }}</span>
                                </div>
                                <div class="detail-field" v-if="detailPayment.receiptData?.razonSocial">
                                    <span class="detail-field__label">Razón Social</span>
                                    <span class="detail-field__val">{{ detailPayment.receiptData.razonSocial }}</span>
                                </div>
                                <div class="detail-field" v-if="detailPayment.receiptData?.direccion">
                                    <span class="detail-field__label">Dirección</span>
                                    <span class="detail-field__val">{{ detailPayment.receiptData.direccion }}</span>
                                </div>
                            </template>
                        </div>

                    </div>

                    <!-- Footer -->
                    <div class="dlg-footer">
                        <!-- Confirmación de reembolso -->
                        <template v-if="confirmRefundId === detailPayment.id">
                            <span class="dlg-refund-confirm-text">
                                <i class="pi pi-exclamation-circle"></i>
                                ¿Confirmar reembolso?
                            </span>
                            <button class="dlg-btn dlg-btn--danger" @click="confirmRefund">Sí, reembolsar</button>
                            <button class="dlg-btn" @click="cancelRefund">Cancelar</button>
                        </template>
                        <template v-else>
                            <button
                                v-if="detailPayment.status === PAYMENT_STATUS.COMPLETED"
                                class="dlg-btn dlg-btn--danger"
                                @click="openRefundConfirm(detailPayment.id)"
                            >
                                <i class="pi pi-replay"></i> Reembolsar
                            </button>
                            <button class="dlg-btn dlg-btn--primary" @click="closeDetail">Cerrar</button>
                        </template>
                    </div>

                </div>
            </div>
        </Transition>
    </Teleport>

</template>

<style scoped>
/* ── Contenedor principal ────────────────────────────────────────────────── */
.pay-history {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
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

/* ── (Filtros ahora usan pv-select / PrimeFlex, sin CSS custom) ────────── */

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
    overflow-x: auto;
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
.pay-row:hover { background: #fafafe; }

.pay-table td {
    padding: 0.7rem 0.85rem;
    color: #374151;
    vertical-align: middle;
}

.td-time   { color: #6b7280; white-space: nowrap; }
.td-date   { display: block; font-size: 0.75rem; font-weight: 600; color: #374151; line-height: 1.2; }
.td-hour   { display: block; font-size: 0.75rem; color: #9ca3af; line-height: 1.2; }
.td-order  { font-weight: 600; color: #6366f1; }
.td-table  { white-space: nowrap; }
.td-zone   { color: #9ca3af; font-size: 0.78rem; }
.td-na     { color: #d1d5db; }
.td-amount { text-align: right; font-weight: 600; white-space: nowrap; }
.td-change { color: #059669; }
.td-expand { width: 2rem; text-align: center; color: #9ca3af; }

/* ── Pagination ──────────────────────────────────────────────────────────── */
.pay-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.25rem;
}

.pay-pagination__info {
    font-size: 0.78rem;
    color: #6b7280;
}

.pay-pagination__controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pay-pagination__page {
    font-size: 0.78rem;
    font-weight: 600;
    color: #374151;
    min-width: 3.5rem;
    text-align: center;
}

.pay-pagination__btn {
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
    color: #374151;
    transition: background 0.12s, border-color 0.12s;
}
.pay-pagination__btn:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
.pay-pagination__btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Badge ───────────────────────────────────────────────────────────────── */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}

.badge--split {
    background: #ede9fe;
    color: #7c3aed;
    border: 1px solid #c4b5fd;
    margin-left: 0.3rem;
}

/* ── Popup dialog ────────────────────────────────────────────────────────── */
.dlg-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.dlg {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 760px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.dlg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem 0.85rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.dlg-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #111827;
    flex-wrap: wrap;
}

.dlg-close {
    width: 2rem;
    height: 2rem;
    border: none;
    background: #f3f4f6;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;
    transition: background 0.1s;
}
.dlg-close:hover { background: #e5e7eb; color: #111827; }

.dlg-body {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1.25rem;
    overflow-y: auto;
    flex: 1;
}

.dlg-footer {
    display: flex;
    justify-content: flex-end;
    padding: 0.85rem 1.25rem;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.dlg-btn {
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.12s;
}
.dlg-btn--primary {
    background: #6366f1;
    color: #fff;
    border-color: #6366f1;
}
.dlg-btn--primary:hover { background: #4f46e5; }
.dlg-btn--danger {
    background: #fee2e2;
    color: #dc2626;
    border-color: #fca5a5;
    margin-right: auto;
}
.dlg-btn--danger:hover { background: #fecaca; }

.dlg-footer { gap: 0.5rem; align-items: center; }
.dlg-refund-confirm-text {
    margin-right: auto;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #dc2626;
}

/* Loading/Error states handled by shared ModuleStateFeedback component */

/* Transition */
.dlg-fade-enter-active,
.dlg-fade-leave-active { transition: opacity 0.18s ease; }
.dlg-fade-enter-from,
.dlg-fade-leave-to   { opacity: 0; }

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

