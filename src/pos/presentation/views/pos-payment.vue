<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter }  from 'vue-router'
import { useToast }             from 'primevue/usetoast'
import { usePosStore }          from '../../application/pos.store.js'
import {
    POS_ROUTES,
    PAYMENT_METHODS,
    RECEIPT_TYPES,
} from '../constants/pos.constants-ui.js'
import SplitBillDialog from '../components/split-bill-dialog.vue'

const route    = useRoute()
const router   = useRouter()
const toast    = useToast()
const posStore = usePosStore()

const tableId = computed(() => sale.value?.tableId ?? null)
const table   = computed(() => tableId.value ? posStore.tableById(tableId.value) : null)
const zone    = computed(() => table.value?.zoneId ? posStore.zoneById(table.value.zoneId) : null)
const sale    = computed(() => posStore.currentSale)
const isTakeaway = computed(() => sale.value?.isTakeaway ?? false)

onMounted(() => {
    if (!posStore.currentSale) router.replace(POS_ROUTES.TERMINAL)
})

// ── Método de pago ─────────────────────────────────────────────────────────
const selectedMethod = ref('cash')

// ── Detalle efectivo ───────────────────────────────────────────────────────
const cashReceived = ref('')

const cashParsed = computed(() => {
    const v = parseFloat(cashReceived.value)
    return isNaN(v) ? null : v
})

const cashChange = computed(() => {
    if (cashParsed.value === null || !sale.value) return null
    const diff = cashParsed.value - sale.value.total
    return diff >= 0 ? parseFloat(diff.toFixed(2)) : null
})

const cashShortfall = computed(() => {
    if (cashParsed.value === null || !sale.value) return null
    const diff = cashParsed.value - sale.value.total
    return diff < 0 ? parseFloat(Math.abs(diff).toFixed(2)) : null
})

// Montos rápidos redondeados al múltiplo superior más cercano
const quickAmounts = computed(() => {
    if (!sale.value) return []
    const t = sale.value.total
    const candidates = [
        Math.ceil(t / 10)  * 10,
        Math.ceil(t / 20)  * 20,
        Math.ceil(t / 50)  * 50,
        Math.ceil(t / 100) * 100,
    ]
    return [...new Set(candidates)].filter(v => v <= 500 && v >= t)
})

// ── Tipo de comprobante ────────────────────────────────────────────────────
const receiptType = ref('nota')

const customerData = reactive({
    dni:         '',
    nombre:      '',
    ruc:         '',
    razonSocial: '',
    direccion:   '',
})

// ── Validación global ──────────────────────────────────────────────────────
const canConfirm = computed(() => {
    if (!sale.value || sale.value.items.length === 0) return false
    if (selectedMethod.value === 'cash') {
        if (cashParsed.value === null || cashParsed.value < sale.value.total) return false
    }
    if (receiptType.value === 'boleta'  && !customerData.dni.trim())           return false
    if (receiptType.value === 'factura' && (
        !customerData.ruc.trim() || !customerData.razonSocial.trim()
    )) return false
    return true
})

// ── Acciones ───────────────────────────────────────────────────────────────
function goBack() {
    router.push(`${POS_ROUTES.ORDER}/${sale.value?.id ?? ''}`)
}

async function cancelOrder() {
    await posStore.cancelCurrentSale()
    toast.add({
        severity: 'warn',
        summary:  'Orden cancelada',
        detail:   isTakeaway.value ? 'La orden para llevar fue cancelada.' : 'La orden fue cancelada y la mesa liberada.',
        life:     3000,
    })
    router.push(POS_ROUTES.TERMINAL)
}

// ── División de cuenta ──────────────────────────────────────────────────
const showSplitDialog = ref(false)

function dividirCuenta() {
    showSplitDialog.value = true
}

async function onSplitConfirmed({ splits }) {
    const ok = await posStore.confirmSplitPayment({
        splits,
        receiptType: receiptType.value,
        receiptData: { ...customerData },
    })
    if (!ok) {
        toast.add({
            severity: 'error',
            summary:  'Error al procesar pago dividido',
            detail:   posStore.error || 'No se pudo confirmar. Verifica que haya un turno de caja abierto.',
            life:     5000,
        })
        return
    }
    toast.add({
        severity: 'success',
        summary:  'Pago dividido confirmado',
        detail:   isTakeaway.value
            ? `Se registraron ${splits.length} pagos parciales. Orden para llevar cerrada.`
            : `Se registraron ${splits.length} pagos parciales. Mesa liberada.`,
        life:     3000,
    })
    router.push('/payments')
}

function printPreCuenta() {
    if (!sale.value) return
    const s = sale.value
    const t = table.value
    const z = zone.value
    const now = new Date().toLocaleString('es-PE')

    const rows = s.items.map(i =>
        `<tr><td>${i.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">S/ ${i.subtotal.toFixed(2)}</td></tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><head><title>Pre-cuenta</title>
<style>body{font-family:monospace;width:280px;margin:0 auto;padding:16px;font-size:12px}
h2{text-align:center;margin:0 0 4px}p.sub{text-align:center;margin:0 0 12px;color:#666}
table{width:100%;border-collapse:collapse}th,td{padding:3px 0;border-bottom:1px dashed #ccc}
th{text-align:left;font-size:11px}
.totals{margin-top:10px;border-top:2px solid #000;padding-top:6px}
.totals div{display:flex;justify-content:space-between}
.totals .grand{font-weight:bold;font-size:14px;margin-top:4px}
.footer{text-align:center;margin-top:14px;font-size:10px;color:#999}
@media print{body{margin:0}}</style></head><body>
<h2>GastroSuite</h2>
<p class="sub">Pre-cuenta · ${s.isTakeaway ? `Para Llevar #${s.ticketNumber ?? ''}${s.customerName ? ` · ${s.customerName}` : ''}` : `Mesa ${t?.number ?? '—'}${z ? ` · ${z.name}` : ''}`}</p>
<p style="text-align:center;font-size:10px;color:#888">${now}</p>
<table><thead><tr><th>Ítem</th><th style="text-align:center">Cant.</th><th style="text-align:right">Subtotal</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="totals">
<div><span>Subtotal</span><span>S/ ${s.subtotal.toFixed(2)}</span></div>
<div><span>IGV (18%)</span><span>S/ ${s.tax.toFixed(2)}</span></div>
${s.discount > 0 ? `<div><span>Descuento</span><span>-S/ ${s.discount.toFixed(2)}</span></div>` : ''}
<div class="grand"><span>TOTAL</span><span>S/ ${s.total.toFixed(2)}</span></div>
</div>
<p class="footer">*** Este documento no es comprobante de pago ***</p>
</body></html>`

    const win = window.open('', '_blank', 'width=320,height=500')
    if (win) {
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
    }

    toast.add({
        severity: 'info',
        summary:  'Pre-cuenta',
        detail:   'Pre-cuenta generada para impresión.',
        life:     2500,
    })
}

async function confirmPayment() {
    if (!canConfirm.value) return
    const ok = await posStore.confirmPayment({
        method:         selectedMethod.value,
        amountReceived: cashParsed.value ?? sale.value.total,
        receiptType:    receiptType.value,
        receiptData:    { ...customerData },
    })
    if (!ok) {
        toast.add({
            severity: 'error',
            summary:  'Error al procesar pago',
            detail:   posStore.error || 'No se pudo confirmar el pago. Verifica que haya un turno de caja abierto.',
            life:     5000,
        })
        return
    }
    toast.add({
        severity: 'success',
        summary:  'Pago confirmado',
        detail:   isTakeaway.value ? 'Orden para llevar cerrada exitosamente.' : 'Orden cerrada exitosamente. Mesa liberada.',
        life:     3000,
    })
    router.push('/payments')
}
</script>

<template>
    <div class="payment-layout">

        <!-- ══════════════════════════ LEFT: Formulario de pago ═════════════ -->
        <div class="payment-form">

            <!-- Cabecera -->
            <div class="payment-form__header">
                <button class="back-btn" title="Volver a la orden" @click="goBack">
                    <i class="pi pi-arrow-left"></i>
                </button>
                <div class="payment-form__title-group">
                    <h2 class="payment-form__title">Procesar Pago</h2>
                    <div class="payment-form__chips">
                        <span class="hdr-chip hdr-chip--order">
                            <i class="pi pi-hashtag"></i>
                            Orden {{ sale?.id ?? '—' }}
                        </span>
                        <template v-if="isTakeaway">
                            <span class="hdr-chip" style="background:#f59e0b18;border-color:#f59e0b;color:#f59e0b">
                                <i class="pi pi-shopping-bag"></i>
                                Para Llevar #{{ sale?.ticketNumber ?? '' }}
                            </span>
                            <span v-if="sale?.customerName" class="hdr-chip" style="background:#6366f118;border-color:#6366f1;color:#6366f1">
                                <i class="pi pi-user"></i>
                                {{ sale.customerName }}
                            </span>
                        </template>
                        <template v-else>
                            <span class="hdr-chip hdr-chip--table">
                                <i class="pi pi-th-large"></i>
                                Mesa {{ table?.number ?? '—' }}
                            </span>
                            <span v-if="zone" class="hdr-chip" :style="{ background: zone.color + '18', borderColor: zone.color, color: zone.color }">
                                <i class="pi pi-map-marker"></i>
                                {{ zone.name }}
                            </span>
                        </template>
                    </div>
                </div>
            </div>

            <!-- ─── Sección 1: Método de pago ──────────────────────────── -->
            <div class="form-section">
                <h3 class="form-section__title">
                    <i class="pi pi-wallet"></i>
                    Método de Pago
                </h3>

                <div class="method-grid">
                    <button
                        v-for="m in PAYMENT_METHODS"
                        :key="m.key"
                        :class="['method-btn', selectedMethod === m.key ? 'method-btn--active' : '']"
                        :style="selectedMethod === m.key
                            ? { borderColor: m.color, background: m.color + '18', color: m.color }
                            : {}"
                        @click="selectedMethod = m.key"
                    >
                        <div class="method-btn__icon-wrap">
                            <i :class="['pi', m.icon, 'method-btn__icon']"></i>
                            <span v-if="selectedMethod === m.key" class="method-btn__dot" :style="{ background: m.color }"></span>
                        </div>
                        <span>{{ m.label }}</span>
                    </button>
                </div>

                <!-- Detalle efectivo -->
                <Transition name="fade-slide">
                    <div v-if="selectedMethod === 'cash'" class="cash-section">
                        <div class="cash-total-ref">
                            <span class="cash-total-ref__label">Total a cobrar</span>
                            <strong class="cash-total-ref__amount">
                                <span class="cash-total-ref__currency">S/</span>
                                {{ (sale?.total ?? 0).toFixed(2) }}
                            </strong>
                        </div>
                        <div class="cash-row">
                            <label class="cash-row__label">Monto recibido</label>
                            <div class="cash-input-wrap">
                                <span class="cash-input-prefix">S/</span>
                                <input
                                    v-model="cashReceived"
                                    type="number"
                                    min="0"
                                    step="0.10"
                                    class="cash-input"
                                    placeholder="0.00"
                                    inputmode="decimal"
                                />
                            </div>
                        </div>

                        <!-- Montos rápidos -->
                        <div v-if="quickAmounts.length > 0" class="quick-amounts">
                            <span class="quick-amounts__label">Exacto:</span>
                            <button
                                v-for="amt in quickAmounts"
                                :key="amt"
                                class="quick-btn"
                                @click="cashReceived = String(amt)"
                            >
                                S/ {{ amt }}
                            </button>
                        </div>

                        <!-- Vuelto / Faltante -->
                        <div v-if="cashChange !== null" class="change-display change-display--ok">
                            <i class="pi pi-check-circle"></i>
                            <span>Vuelto: <strong>S/ {{ cashChange.toFixed(2) }}</strong></span>
                        </div>
                        <div v-else-if="cashShortfall !== null" class="change-display change-display--err">
                            <i class="pi pi-exclamation-triangle"></i>
                            <span>Faltan: <strong>S/ {{ cashShortfall.toFixed(2) }}</strong></span>
                        </div>
                    </div>
                </Transition>
                <!-- Pago digital -->
                <Transition name="fade-slide">
                    <div v-if="selectedMethod !== 'cash'" class="digital-note">
                        <i class="pi pi-check-circle digital-note__icon"></i>
                        <div class="digital-note__text">
                            <span class="digital-note__title">
                                {{ PAYMENT_METHODS.find(m => m.key === selectedMethod)?.label }} · Pago digital
                            </span>
                            <span class="digital-note__sub">
                                Monto a cobrar: <strong>S/ {{ (sale?.total ?? 0).toFixed(2) }}</strong>
                            </span>
                        </div>
                    </div>
                </Transition>
            </div>

            <!-- ─── Sección 2: Tipo de comprobante ─────────────────────── -->
            <div class="form-section">
                <h3 class="form-section__title">
                    <i class="pi pi-file-edit"></i>
                    Tipo de Comprobante
                </h3>

                <div class="receipt-grid">
                    <button
                        v-for="r in RECEIPT_TYPES"
                        :key="r.key"
                        :class="['receipt-btn', receiptType === r.key ? 'receipt-btn--active' : '']"
                        :style="receiptType === r.key
                            ? { borderColor: r.color, background: r.color + '12', color: r.color }
                            : {}"
                        @click="receiptType = r.key"
                    >
                        <i :class="['pi', r.icon, 'receipt-btn__icon']" :style="receiptType === r.key ? { color: r.color } : {}"></i>
                        <span>{{ r.label }}</span>
                    </button>
                </div>

                <!-- Datos boleta -->
                <Transition name="fade-slide">
                    <div v-if="receiptType === 'boleta'" class="customer-form">
                        <div class="cfield">
                            <label class="cfield__label">
                                DNI <span class="cfield__req">*</span>
                            </label>
                            <input
                                v-model="customerData.dni"
                                class="cfield__input"
                                maxlength="8"
                                placeholder="12345678"
                                inputmode="numeric"
                            />
                        </div>
                        <div class="cfield">
                            <label class="cfield__label">Nombre del cliente</label>
                            <input
                                v-model="customerData.nombre"
                                class="cfield__input"
                                placeholder="Nombre completo"
                            />
                        </div>
                    </div>
                </Transition>

                <!-- Datos factura -->
                <Transition name="fade-slide">
                    <div v-if="receiptType === 'factura'" class="customer-form">
                        <div class="cfield">
                            <label class="cfield__label">
                                RUC <span class="cfield__req">*</span>
                            </label>
                            <input
                                v-model="customerData.ruc"
                                class="cfield__input"
                                maxlength="11"
                                placeholder="20123456789"
                                inputmode="numeric"
                            />
                        </div>
                        <div class="cfield">
                            <label class="cfield__label">
                                Razón Social <span class="cfield__req">*</span>
                            </label>
                            <input
                                v-model="customerData.razonSocial"
                                class="cfield__input"
                                placeholder="Empresa S.A.C."
                            />
                        </div>
                        <div class="cfield">
                            <label class="cfield__label">Dirección</label>
                            <input
                                v-model="customerData.direccion"
                                class="cfield__input"
                                placeholder="Av. Lima 123, Lima"
                            />
                        </div>
                    </div>
                </Transition>
            </div>

        </div>

        <!-- ══════════════════════════ RIGHT: Resumen + Acciones ═════════════ -->
        <div class="payment-panel">

            <!-- Cabecera del panel -->
            <div class="payment-panel__header">
                <div class="flex align-items-center gap-2">
                    <i class="pi pi-receipt text-primary" style="font-size:1.1rem"></i>
                    <span class="font-bold text-color" style="font-size:1rem">Resumen de Orden</span>
                </div>
                <span class="panel-order-id">#{{ sale?.id ?? '—' }}</span>
            </div>

            <!-- Lista de ítems -->
            <div class="payment-panel__items">
                <div v-if="!sale || sale.items.length === 0" class="panel-empty">
                    <i class="pi pi-inbox text-4xl text-color-secondary"></i>
                    <span class="text-sm text-color-secondary">Sin productos en la orden</span>
                </div>

                <div v-else class="summary-items">
                    <div
                        v-for="item in sale.items"
                        :key="item.id"
                        class="summary-item"
                    >
                        <span class="summary-item__qty">{{ item.quantity }}×</span>
                        <div class="summary-item__info">
                            <span class="summary-item__name">{{ item.menuItemName }}</span>
                            <span v-if="item.note" class="summary-item__note">
                                <i class="pi pi-align-left" style="font-size:0.65rem"></i>
                                {{ item.note }}
                            </span>
                            <span v-if="item.discountValue > 0" class="summary-item__disc">
                                <i class="pi pi-tag" style="font-size:0.65rem"></i>
                                {{ item.discountType === 'pct' ? item.discountValue + '%' : 'S/ ' + item.discountValue.toFixed(2) }} dto.
                            </span>
                        </div>
                        <span class="summary-item__price">
                            S/ {{ item.subtotal.toFixed(2) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Totales -->
            <div class="payment-panel__totals">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>S/ {{ (sale?.subtotal ?? 0).toFixed(2) }}</span>
                </div>
                <div class="total-row">
                    <span>IGV (18%)</span>
                    <span>S/ {{ (sale?.tax ?? 0).toFixed(2) }}</span>
                </div>
                <div v-if="(sale?.discount ?? 0) > 0" class="total-row total-row--discount">
                    <span>Descuento</span>
                    <span>- S/ {{ sale.discount.toFixed(2) }}</span>
                </div>
                <div class="total-row total-row--grand">
                    <span>TOTAL A PAGAR</span>
                    <span>S/ {{ (sale?.total ?? 0).toFixed(2) }}</span>
                </div>

                <!-- Resumen del pago seleccionado -->
                <div class="payment-summary">
                    <div class="payment-summary__row">
                        <span>Método</span>
                        <span class="payment-summary__val">
                            <i :class="['pi', PAYMENT_METHODS.find(m => m.key === selectedMethod)?.icon]" style="font-size:0.8rem"></i>
                            {{ PAYMENT_METHODS.find(m => m.key === selectedMethod)?.label }}
                        </span>
                    </div>
                    <template v-if="selectedMethod === 'cash' && cashParsed !== null">
                        <div class="payment-summary__row">
                            <span>Recibido</span>
                            <span class="payment-summary__val">S/ {{ cashParsed.toFixed(2) }}</span>
                        </div>
                        <div v-if="cashChange !== null" class="payment-summary__row payment-summary__row--change">
                            <span>Vuelto</span>
                            <strong class="payment-summary__val">S/ {{ cashChange.toFixed(2) }}</strong>
                        </div>
                    </template>
                    <div class="payment-summary__row">
                        <span>Comprobante</span>
                        <span class="payment-summary__val">
                            {{ RECEIPT_TYPES.find(r => r.key === receiptType)?.label }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Vuelto -->
            <Transition name="fade-slide">
                <div v-if="selectedMethod === 'cash' && cashChange !== null" class="vuelto-banner">
                    <span class="vuelto-banner__lbl">Vuelto al cliente</span>
                    <span class="vuelto-banner__amt">S/ {{ cashChange.toFixed(2) }}</span>
                </div>
            </Transition>

            <!-- Botones de acción -->
            <div class="payment-panel__actions">
                <button
                    :class="['pay-btn pay-btn--primary', canConfirm ? 'pay-btn--ready' : '']"
                    :disabled="!canConfirm"
                    @click="confirmPayment"
                >
                    <i class="pi pi-check-circle"></i>
                    Confirmar Pago
                </button>
                <div class="pay-btn-row">
                    <button class="pay-btn pay-btn--split" @click="dividirCuenta">
                        <i class="pi pi-sliders-h"></i>
                        Dividir Cuenta
                    </button>
                    <button class="pay-btn pay-btn--secondary" @click="printPreCuenta">
                        <i class="pi pi-print"></i>
                        Pre-cuenta
                    </button>
                    <button class="pay-btn pay-btn--danger" @click="cancelOrder">
                        <i class="pi pi-times"></i>
                        Cancelar Orden
                    </button>
                </div>
            </div>

        </div>
    </div>

    <!-- Diálogo de división de cuenta -->
    <SplitBillDialog
        v-model:visible="showSplitDialog"
        :sale="sale"
        @confirmed="onSplitConfirmed"
    />
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.payment-layout {
    display: flex;
    height: 100%;
    min-height: 0;
    background: #f3f4f6;
}

/* ── LEFT: formulario ────────────────────────────────────────────────────── */
.payment-form {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    padding: 1.5rem;
    background: #f3f4f6;
}

.payment-form__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    color: #374151;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
}
.back-btn:hover { background: #f9fafb; }

.payment-form__title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: #111827;
}

.payment-form__title-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1;
    gap: 0.5rem;
}

.payment-form__chips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-left: auto;
}

.payment-form__chips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.hdr-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.74rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    border: 1px solid;
}
.hdr-chip--order {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
}
.hdr-chip--table {
    background: #dbeafe;
    border-color: #93c5fd;
    color: #1e40af;
}

/* ── Form sections ───────────────────────────────────────────────────────── */
.form-section {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
}

.form-section__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #374151;
}

/* ── Payment methods ─────────────────────────────────────────────────────── */
.method-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.6rem;
}

.method-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.85rem 0.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
    color: #374151;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}
.method-btn:hover {
    border-color: #94a3b8;
    background: #f1f5f9;
}
.method-btn--active {
    font-weight: 700;
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
}
.method-btn__icon {
    font-size: 1.4rem;
}
.method-btn__icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
}
.method-btn__dot {
    position: absolute;
    top: 1px;
    right: 1px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid #fff;
}

/* ── Cash section ────────────────────────────────────────────────────────── */
.cash-section {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.cash-total-ref {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1.5px solid #86efac;
    border-radius: 10px;
}

.cash-total-ref__label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #15803d;
}

.cash-total-ref__amount {
    font-size: 1.5rem;
    font-weight: 800;
    color: #15803d;
    letter-spacing: -0.01em;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
}

.cash-total-ref__currency {
    font-size: 0.95rem;
    font-weight: 700;
    color: #16a34a;
    opacity: 0.8;
}

.cash-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.cash-row__label {
    font-size: 0.82rem;
    font-weight: 500;
    color: #4b5563;
    flex-shrink: 0;
    min-width: 10rem;
}

.cash-input-wrap {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
}

.cash-input-prefix {
    position: absolute;
    left: 0.85rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #6b7280;
    pointer-events: none;
    user-select: none;
    z-index: 1;
}

.cash-input {
    width: 100%;
    padding: 0.55rem 0.85rem 0.55rem 2.1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    background: #fff;
    outline: none;
    transition: border-color 0.15s;
}
.cash-input:focus { border-color: #6366f1; }

.quick-amounts {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.quick-amounts__label {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
}

.quick-btn {
    padding: 0.25rem 0.65rem;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    background: #f3f4f6;
    color: #374151;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.12s;
}
.quick-btn:hover {
    border-color: #6366f1;
    color: #4338ca;
    background: #eef2ff;
}

.change-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    font-size: 0.88rem;
}
.change-display--ok {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
}
.change-display--err {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

/* ── Digital payment note ───────────────────────────────────────────────── */
.digital-note {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-top: 1rem;
    padding: 1rem 1.1rem;
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 10px;
}
.digital-note__icon {
    font-size: 1.75rem;
    color: #16a34a;
    flex-shrink: 0;
}
.digital-note__text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}
.digital-note__title {
    font-size: 0.88rem;
    font-weight: 700;
    color: #166534;
}
.digital-note__sub {
    font-size: 0.8rem;
    color: #4b5563;
}

/* ── Receipt type ────────────────────────────────────────────────────────── */
.receipt-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
}

.receipt-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.85rem 0.4rem;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
    color: #374151;
    font-size: 0.72rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
}
.receipt-btn:hover {
    border-color: #94a3b8;
    background: #f1f5f9;
}
.receipt-btn--active {
    font-weight: 700;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.receipt-btn__icon {
    font-size: 1.2rem;
}

/* ── Customer form ───────────────────────────────────────────────────────── */
.customer-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
}

.cfield {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.cfield__label {
    font-size: 0.78rem;
    font-weight: 500;
    color: #374151;
}

.cfield__req {
    color: #ef4444;
}

.cfield__input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 7px;
    font-size: 0.88rem;
    color: #111827;
    background: #fff;
    outline: none;
    transition: border-color 0.15s;
}
.cfield__input:focus { border-color: #6366f1; }

/* ── RIGHT: panel de resumen ─────────────────────────────────────────────── */
.payment-panel {
    width: 360px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-left: 1px solid #e5e7eb;
    overflow: hidden;
}

.payment-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.9rem 1.1rem;
    border-bottom: 1px solid #f3f4f6;
    background: #fafafa;
    flex-shrink: 0;
}

/* ── Order id chip ───────────────────────────────────────────────────────── */
.panel-order-id {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.2rem 0.55rem;
}

/* ── Items list ──────────────────────────────────────────────────────────── */
.payment-panel__items {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.panel-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    color: #9ca3af;
}

.summary-items {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.summary-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid #f3f4f6;
}
.summary-item:last-child { border-bottom: none; }

.summary-item__qty {
    font-size: 0.78rem;
    font-weight: 700;
    color: #6366f1;
    min-width: 1.8rem;
    flex-shrink: 0;
    padding-top: 0.1rem;
}

.summary-item__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.summary-item__name {
    font-size: 0.82rem;
    font-weight: 500;
    color: #111827;
}

.summary-item__note {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    color: #6b7280;
    font-style: italic;
}

.summary-item__disc {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    color: #059669;
    font-weight: 500;
}

.summary-item__price {
    font-size: 0.82rem;
    font-weight: 600;
    color: #1f2937;
    flex-shrink: 0;
}

/* ── Totales ─────────────────────────────────────────────────────────────── */
.payment-panel__totals {
    padding: 0.85rem 1.1rem;
    border-top: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    gap: 0;
    flex-shrink: 0;
}

.total-row {
    display: flex;
    justify-content: space-between;
    padding: 0.3rem 0;
    font-size: 0.82rem;
    color: #6b7280;
    border-bottom: 1px solid #f9fafb;
}
.total-row:last-of-type { border-bottom: none; }

.total-row--discount { color: #059669; }

.total-row--grand {
    display: flex;
    justify-content: space-between;
    padding: 0.6rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    border-top: 2px solid #e5e7eb;
    margin-top: 0.25rem;
}

/* ── Payment summary ─────────────────────────────────────────────────────── */
.payment-summary {
    margin-top: 0.75rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.6rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.payment-summary__row {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    color: #6b7280;
}

.payment-summary__row--change {
    color: #065f46;
    font-weight: 600;
}

.payment-summary__val {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 600;
    color: #374151;
}

/* ── Action buttons ──────────────────────────────────────────────────────── */
.payment-panel__actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.85rem 1.1rem;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.pay-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    border-radius: 9px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
}

.pay-btn--ghost {
    background: transparent;
    border-color: #d1d5db;
    color: #374151;
}
.pay-btn--ghost:hover { background: #f3f4f6; }

.pay-btn--danger {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #dc2626;
}
.pay-btn--danger:hover { background: #fee2e2; }

.pay-btn--split {
    background: #f5f3ff;
    border-color: #c4b5fd;
    color: #7c3aed;
}
.pay-btn--split:hover { background: #ede9fe; }

.pay-btn--secondary {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
}
.pay-btn--secondary:hover { background: #e5e7eb; }

.pay-btn--primary {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
    font-size: 0.95rem;
    padding: 0.75rem 1rem;
}
.pay-btn--primary:hover:not(:disabled) { background: #4338ca; border-color: #4338ca; }
.pay-btn--primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
/* ── Vuelto banner ─────────────────────────────────────────────────────────── */
.vuelto-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.1rem;
    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    border-top: 1px solid #6ee7b7;
    flex-shrink: 0;
}
.vuelto-banner__lbl {
    font-size: 0.75rem;
    font-weight: 700;
    color: #065f46;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.vuelto-banner__amt {
    font-size: 1.5rem;
    font-weight: 800;
    color: #047857;
}

/* ── Secondary action row ─────────────────────────────────────────────── */
.pay-btn-row {
    display: flex;
    gap: 0.4rem;
}
.pay-btn-row .pay-btn {
    flex: 1;
    font-size: 0.75rem;
    padding: 0.5rem 0.35rem;
}
.pay-btn--ready {
    background: #059669 !important;
    border-color: #059669 !important;
}
.pay-btn--ready:hover:not(:disabled) {
    background: #047857 !important;
    border-color: #047857 !important;
}
/* ── Transitions ─────────────────────────────────────────────────────────── */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

/* ── Responsive: ≤ 768px ─────────────────────────────────────────────────── */
@media (max-width: 768px) {
    /* Stack form on top, summary panel below */
    .payment-layout {
        flex-direction: column;
        height: auto;
        overflow-y: auto;
    }

    /* Form takes natural height (no fixed scroll area) */
    .payment-form {
        overflow-y: visible;
        padding: 1rem;
    }

    /* Summary panel: full width, no side border */
    .payment-panel {
        width: 100% !important;
        flex-shrink: 1;
        border-left: none;
        border-top: 1px solid #e5e7eb;
        overflow: visible;
    }

    /* Header: stack title and chips */
    .payment-form__title-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.4rem;
    }

    .payment-form__chips {
        margin-left: 0;
    }

    /* Payment methods: 2×2 grid instead of 4×1 */
    .method-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    /* Receipt types: keep 3 columns but smaller padding */
    .receipt-btn {
        padding: 0.6rem 0.25rem;
        font-size: 0.68rem;
    }

    /* Cash row: stack label above input */
    .cash-row {
        flex-direction: column;
        align-items: stretch;
    }

    .cash-row__label {
        min-width: 0;
    }
}

/* ── Extra small: ≤ 480px ─────────────────────────────────────────────────── */
@media (max-width: 480px) {
    .hdr-chip { font-size: 0.68rem; padding: 0.15rem 0.45rem; }
    .form-section { padding: 1rem; }
    .payment-panel__actions { padding: 0.75rem; }
}
</style>
