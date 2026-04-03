<script setup>
import { ref, computed, watch } from 'vue'
import { SplitBill, SPLIT_MODE } from '../../domain/models/split-bill.entity.js'
import { PAYMENT_METHODS } from '../constants/pos.constants-ui.js'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: Boolean,
    sale:    { type: Object, default: null },
})
const emit = defineEmits(['update:visible', 'confirmed'])

// ── State ──────────────────────────────────────────────
const mode       = ref(SPLIT_MODE.EQUAL)
const splitCount = ref(2)
const splits     = ref([])
const step       = ref(1) // 1 = config, 2 = assign methods

// ── Computed ───────────────────────────────────────────
const saleTotal = computed(() => props.sale?.total ?? 0)
const saleItems = computed(() => props.sale?.items ?? [])

const allPaid = computed(() => splits.value.length > 0 && splits.value.every(s => s.isPaid))

const paidTotal = computed(() =>
    parseFloat(splits.value.filter(s => s.isPaid).reduce((sum, s) => sum + s.total, 0).toFixed(2))
)

const remainingTotal = computed(() =>
    parseFloat((saleTotal.value - paidTotal.value).toFixed(2))
)

const splitsTotalMatch = computed(() => {
    const sum = splits.value.reduce((s, b) => s + b.total, 0)
    return Math.abs(sum - saleTotal.value) < 0.02
})

// Items not yet assigned in BY_ITEMS mode
const unassignedItems = computed(() => {
    if (mode.value !== SPLIT_MODE.BY_ITEMS) return []
    const assignedIds = new Set(splits.value.flatMap(s => s.items.map(i => i.id)))
    return saleItems.value.filter(i => !assignedIds.has(i.id))
})

const canProceedToStep2 = computed(() => {
    if (mode.value === SPLIT_MODE.EQUAL) return splitCount.value >= 2
    // BY_ITEMS: all items must be assigned and at least 2 splits with items
    return unassignedItems.value.length === 0
        && splits.value.filter(s => s.items.length > 0).length >= 2
})

const buttonLabel = computed(() => {
    if (step.value === 1) return 'Continuar'
    if (allPaid.value) return 'Confirmar Pagos'
    return 'Asigna todos los métodos de pago'
})

// ── Watchers ───────────────────────────────────────────
watch(() => props.visible, (v) => {
    if (v) {
        mode.value       = SPLIT_MODE.EQUAL
        splitCount.value = 2
        splits.value     = []
        step.value       = 1
    }
})

watch([mode, splitCount], () => {
    if (step.value === 1) generateSplits()
})

// ── Logic ──────────────────────────────────────────────
function generateSplits() {
    if (!props.sale) return
    if (mode.value === SPLIT_MODE.EQUAL) {
        splits.value = SplitBill.createEqualSplits(props.sale, splitCount.value)
    } else {
        splits.value = SplitBill.createItemSplits(splitCount.value)
    }
}

function assignItemToSplit(item, splitId) {
    // Remove from current split if assigned
    for (const s of splits.value) {
        const idx = s.items.findIndex(i => i.id === item.id)
        if (idx !== -1) {
            s.items.splice(idx, 1)
            s.recalculate()
        }
    }
    // Add to target split
    const target = splits.value.find(s => s.id === splitId)
    if (target) {
        target.items.push(item)
        target.recalculate()
    }
}

function removeItemFromSplit(item, splitId) {
    const target = splits.value.find(s => s.id === splitId)
    if (!target) return
    const idx = target.items.findIndex(i => i.id === item.id)
    if (idx !== -1) {
        target.items.splice(idx, 1)
        target.recalculate()
    }
}

function setSplitMethod(splitId, method) {
    const s = splits.value.find(b => b.id === splitId)
    if (s) s.markPaid(method)
}

function unsetSplitMethod(splitId) {
    const s = splits.value.find(b => b.id === splitId)
    if (s) {
        s.isPaid = false
        s.method = null
    }
}

function goToStep2() {
    if (!canProceedToStep2.value) return
    // For equal: generate fresh splits with final count
    if (mode.value === SPLIT_MODE.EQUAL) {
        splits.value = SplitBill.createEqualSplits(props.sale, splitCount.value)
    }
    step.value = 2
}

function goBackToStep1() {
    step.value = 1
    splits.value.forEach(s => { s.isPaid = false; s.method = null })
}

function onCancel() {
    emit('update:visible', false)
}

function onSave() {
    if (step.value === 1) {
        goToStep2()
        return
    }
    if (!allPaid.value) return
    emit('confirmed', {
        mode: mode.value,
        splits: splits.value.map(s => ({
            id:     s.id,
            label:  s.label,
            total:  s.total,
            method: s.method,
            items:  s.items.map(i => ({ id: i.id, name: i.menuItemName, qty: i.quantity, subtotal: i.subtotal })),
        })),
    })
    emit('update:visible', false)
}

function methodMeta(key) {
    return PAYMENT_METHODS.find(m => m.key === key) ?? { label: key, icon: 'pi-money-bill', color: '#6b7280' }
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="false"
        entity-name="División de Cuenta"
        :custom-button-label="buttonLabel"
        size="large"
        @update:visible="$emit('update:visible', $event)"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="split-dialog">

                <!-- ═══ STEP 1: Config ═══════════════════════════════════ -->
                <template v-if="step === 1">

                    <!-- Total reference -->
                    <div class="split-total-ref">
                        <span class="split-total-ref__label">Total de la orden</span>
                        <span class="split-total-ref__amount">S/ {{ saleTotal.toFixed(2) }}</span>
                    </div>

                    <!-- Mode selector -->
                    <div class="split-mode-row">
                        <button
                            :class="['split-mode-btn', mode === 'equal' ? 'split-mode-btn--active' : '']"
                            @click="mode = 'equal'"
                        >
                            <i class="pi pi-users"></i>
                            <div>
                                <span class="split-mode-btn__title">Partes iguales</span>
                                <span class="split-mode-btn__desc">Divide el total entre N personas</span>
                            </div>
                        </button>
                        <button
                            :class="['split-mode-btn', mode === 'by_items' ? 'split-mode-btn--active' : '']"
                            @click="mode = 'by_items'"
                        >
                            <i class="pi pi-list"></i>
                            <div>
                                <span class="split-mode-btn__title">Por ítems</span>
                                <span class="split-mode-btn__desc">Asigna cada producto a una cuenta</span>
                            </div>
                        </button>
                    </div>

                    <!-- Count selector -->
                    <div class="split-count-row">
                        <label class="split-count-label">
                            {{ mode === 'equal' ? '¿Cuántas personas?' : '¿Cuántas cuentas?' }}
                        </label>
                        <div class="split-count-ctrl">
                            <button class="split-count-btn" :disabled="splitCount <= 2" @click="splitCount--">
                                <i class="pi pi-minus"></i>
                            </button>
                            <span class="split-count-value">{{ splitCount }}</span>
                            <button class="split-count-btn" :disabled="splitCount >= 10" @click="splitCount++">
                                <i class="pi pi-plus"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Preview: Equal mode -->
                    <div v-if="mode === 'equal' && splits.length > 0" class="split-preview">
                        <div v-for="s in splits" :key="s.id" class="split-preview__card">
                            <i class="pi pi-user"></i>
                            <span class="split-preview__label">{{ s.label }}</span>
                            <span class="split-preview__amount">S/ {{ s.total.toFixed(2) }}</span>
                        </div>
                    </div>

                    <!-- Item assignment: BY_ITEMS mode -->
                    <div v-if="mode === 'by_items'" class="split-items-layout">
                        <!-- Unassigned pool -->
                        <div class="split-pool">
                            <div class="split-pool__header">
                                <span class="split-pool__title">
                                    <i class="pi pi-inbox"></i> Sin asignar
                                </span>
                                <span class="split-pool__count">{{ unassignedItems.length }}</span>
                            </div>
                            <div
                                v-for="item in unassignedItems"
                                :key="item.id"
                                class="split-item"
                            >
                                <span class="split-item__qty">{{ item.quantity }}×</span>
                                <span class="split-item__name">{{ item.menuItemName }}</span>
                                <span class="split-item__price">S/ {{ item.subtotal.toFixed(2) }}</span>
                                <div class="split-item__actions">
                                    <button
                                        v-for="s in splits"
                                        :key="s.id"
                                        class="split-assign-btn"
                                        :title="`Asignar a ${s.label}`"
                                        @click="assignItemToSplit(item, s.id)"
                                    >
                                        {{ s.label.replace('Cuenta ', '#') }}
                                    </button>
                                </div>
                            </div>
                            <div v-if="unassignedItems.length === 0" class="split-pool__empty">
                                <i class="pi pi-check-circle" style="color: #16a34a;"></i>
                                Todos los ítems asignados
                            </div>
                        </div>

                        <!-- Split buckets -->
                        <div class="split-buckets">
                            <div v-for="s in splits" :key="s.id" class="split-bucket">
                                <div class="split-bucket__header">
                                    <span class="split-bucket__label">{{ s.label }}</span>
                                    <span class="split-bucket__total">S/ {{ s.total.toFixed(2) }}</span>
                                </div>
                                <div
                                    v-for="item in s.items"
                                    :key="item.id"
                                    class="split-bucket-item"
                                >
                                    <span>{{ item.quantity }}× {{ item.menuItemName }}</span>
                                    <button class="split-remove-btn" @click="removeItemFromSplit(item, s.id)">
                                        <i class="pi pi-times"></i>
                                    </button>
                                </div>
                                <div v-if="s.items.length === 0" class="split-bucket__empty">
                                    Sin ítems
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- ═══ STEP 2: Payment methods ══════════════════════════ -->
                <template v-if="step === 2">

                    <button class="split-back-link" @click="goBackToStep1">
                        <i class="pi pi-arrow-left"></i> Volver a configurar
                    </button>

                    <!-- Progress bar -->
                    <div class="split-progress">
                        <div class="split-progress__bar">
                            <div
                                class="split-progress__fill"
                                :style="{ width: saleTotal > 0 ? (paidTotal / saleTotal * 100) + '%' : '0%' }"
                            ></div>
                        </div>
                        <div class="split-progress__labels">
                            <span>Pagado: <strong>S/ {{ paidTotal.toFixed(2) }}</strong></span>
                            <span>Restante: <strong>S/ {{ remainingTotal.toFixed(2) }}</strong></span>
                        </div>
                    </div>

                    <!-- Split cards with payment assignment -->
                    <div class="split-pay-cards">
                        <div
                            v-for="s in splits"
                            :key="s.id"
                            :class="['split-pay-card', s.isPaid ? 'split-pay-card--paid' : '']"
                        >
                            <div class="split-pay-card__header">
                                <span class="split-pay-card__label">{{ s.label }}</span>
                                <span class="split-pay-card__amount">S/ {{ s.total.toFixed(2) }}</span>
                            </div>

                            <!-- Items preview (by_items mode) -->
                            <div v-if="mode === 'by_items' && s.items.length > 0" class="split-pay-card__items">
                                <span v-for="item in s.items" :key="item.id" class="split-pay-card__item">
                                    {{ item.quantity }}× {{ item.menuItemName }}
                                </span>
                            </div>

                            <!-- Method selection or paid state -->
                            <div v-if="s.isPaid" class="split-pay-card__paid">
                                <div class="split-pay-card__badge">
                                    <i :class="['pi', methodMeta(s.method).icon]" :style="{ color: methodMeta(s.method).color }"></i>
                                    {{ methodMeta(s.method).label }}
                                    <i class="pi pi-check-circle" style="color: #16a34a; margin-left: 0.25rem;"></i>
                                </div>
                                <button class="split-undo-btn" @click="unsetSplitMethod(s.id)">
                                    <i class="pi pi-undo"></i> Cambiar
                                </button>
                            </div>
                            <div v-else class="split-pay-card__methods">
                                <button
                                    v-for="m in PAYMENT_METHODS"
                                    :key="m.key"
                                    class="split-method-btn"
                                    :style="{ borderColor: m.color + '60', color: m.color }"
                                    @click="setSplitMethod(s.id, m.key)"
                                >
                                    <i :class="['pi', m.icon]"></i>
                                    {{ m.label }}
                                </button>
                            </div>
                        </div>
                    </div>
                </template>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.split-dialog {
    display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem;
}

/* ── Total reference ──────────────────────────────────── */
.split-total-ref {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.65rem 1rem; border-radius: 10px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
}
.split-total-ref__label { font-size: 0.8rem; font-weight: 600; color: #166534; }
.split-total-ref__amount { font-size: 1.1rem; font-weight: 800; color: #15803d; }

/* ── Mode selector ────────────────────────────────────── */
.split-mode-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }

.split-mode-btn {
    display: flex; align-items: flex-start; gap: 0.6rem;
    padding: 0.75rem; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #fff;
    cursor: pointer; transition: all 0.15s; text-align: left;
}
.split-mode-btn:hover { border-color: #a5b4fc; }
.split-mode-btn--active {
    border-color: #6366f1; background: #eef2ff;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}
.split-mode-btn .pi { font-size: 1.1rem; color: #6366f1; margin-top: 0.1rem; }
.split-mode-btn div { display: flex; flex-direction: column; }
.split-mode-btn__title { font-size: 0.82rem; font-weight: 700; color: #111827; }
.split-mode-btn__desc { font-size: 0.7rem; color: #6b7280; margin-top: 0.1rem; }

/* ── Count selector ───────────────────────────────────── */
.split-count-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 0;
}
.split-count-label { font-size: 0.82rem; font-weight: 600; color: #374151; }
.split-count-ctrl { display: flex; align-items: center; gap: 0.6rem; }
.split-count-btn {
    display: flex; align-items: center; justify-content: center;
    width: 2rem; height: 2rem; border-radius: 8px;
    border: 1.5px solid #e5e7eb; background: #fff;
    cursor: pointer; font-size: 0.8rem; color: #374151;
    transition: all 0.15s;
}
.split-count-btn:hover:not(:disabled) { border-color: #6366f1; background: #eef2ff; }
.split-count-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.split-count-value {
    font-size: 1.3rem; font-weight: 800; color: #6366f1;
    min-width: 2rem; text-align: center;
}

/* ── Equal preview cards ──────────────────────────────── */
.split-preview {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem;
}
.split-preview__card {
    display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
    padding: 0.65rem; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #f9fafb;
}
.split-preview__card .pi { font-size: 1rem; color: #6366f1; }
.split-preview__label { font-size: 0.75rem; font-weight: 600; color: #6b7280; }
.split-preview__amount { font-size: 1rem; font-weight: 800; color: #111827; }

/* ── BY_ITEMS layout ──────────────────────────────────── */
.split-items-layout {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
    max-height: 320px; overflow-y: auto;
}

.split-pool {
    display: flex; flex-direction: column; gap: 0.3rem;
    padding: 0.5rem; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #f9fafb;
}
.split-pool__header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 0.35rem; border-bottom: 1px solid #e5e7eb;
}
.split-pool__title {
    display: flex; align-items: center; gap: 0.3rem;
    font-size: 0.75rem; font-weight: 700; color: #374151;
}
.split-pool__title .pi { font-size: 0.8rem; }
.split-pool__count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.2rem; height: 1.2rem; border-radius: 6px;
    background: #f3f4f6; font-size: 0.65rem; font-weight: 700; color: #6b7280;
}
.split-pool__empty {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem; font-size: 0.75rem; color: #16a34a;
}

.split-item {
    display: flex; align-items: center; gap: 0.35rem;
    padding: 0.35rem 0.4rem; border-radius: 6px;
    background: #fff; border: 1px solid #e5e7eb;
    font-size: 0.75rem;
}
.split-item__qty { font-weight: 700; color: #6366f1; min-width: 1.5rem; }
.split-item__name { flex: 1; color: #111827; font-weight: 500; }
.split-item__price { font-weight: 600; color: #374151; white-space: nowrap; }
.split-item__actions { display: flex; gap: 0.2rem; margin-left: 0.3rem; }

.split-assign-btn {
    padding: 0.15rem 0.4rem; border-radius: 4px;
    border: 1px solid #c7d2fe; background: #eef2ff;
    font-size: 0.6rem; font-weight: 700; color: #6366f1;
    cursor: pointer; transition: all 0.12s;
}
.split-assign-btn:hover { background: #6366f1; color: #fff; }

/* ── Split buckets ────────────────────────────────────── */
.split-buckets { display: flex; flex-direction: column; gap: 0.4rem; }

.split-bucket {
    padding: 0.5rem; border-radius: 8px;
    border: 1.5px solid #e5e7eb; background: #fff;
}
.split-bucket__header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 0.3rem; border-bottom: 1px solid #f3f4f6;
}
.split-bucket__label { font-size: 0.75rem; font-weight: 700; color: #374151; }
.split-bucket__total { font-size: 0.8rem; font-weight: 800; color: #111827; }
.split-bucket__empty { font-size: 0.68rem; color: #9ca3af; padding: 0.35rem 0; }

.split-bucket-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.2rem 0; font-size: 0.72rem; color: #374151;
}
.split-remove-btn {
    display: flex; align-items: center; justify-content: center;
    width: 1.2rem; height: 1.2rem; border-radius: 4px;
    border: none; background: #fef2f2; color: #dc2626;
    cursor: pointer; font-size: 0.6rem;
}
.split-remove-btn:hover { background: #fee2e2; }

/* ── Step 2: Back link ────────────────────────────────── */
.split-back-link {
    display: flex; align-items: center; gap: 0.35rem;
    background: none; border: none; cursor: pointer;
    font-size: 0.78rem; font-weight: 600; color: #6366f1;
    padding: 0;
}
.split-back-link:hover { text-decoration: underline; }

/* ── Progress bar ─────────────────────────────────────── */
.split-progress { display: flex; flex-direction: column; gap: 0.35rem; }
.split-progress__bar {
    height: 6px; border-radius: 6px;
    background: #e5e7eb; overflow: hidden;
}
.split-progress__fill {
    height: 100%; border-radius: 6px;
    background: linear-gradient(90deg, #6366f1, #059669);
    transition: width 0.3s ease;
}
.split-progress__labels {
    display: flex; justify-content: space-between;
    font-size: 0.72rem; color: #6b7280;
}

/* ── Pay cards ────────────────────────────────────────── */
.split-pay-cards { display: flex; flex-direction: column; gap: 0.5rem; }

.split-pay-card {
    padding: 0.75rem; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #fff;
    transition: all 0.15s;
}
.split-pay-card--paid {
    border-color: #bbf7d0; background: #f0fdf4;
}

.split-pay-card__header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.4rem;
}
.split-pay-card__label { font-size: 0.82rem; font-weight: 700; color: #111827; }
.split-pay-card__amount { font-size: 1rem; font-weight: 800; color: #111827; }

.split-pay-card__items {
    display: flex; flex-wrap: wrap; gap: 0.25rem;
    margin-bottom: 0.5rem;
}
.split-pay-card__item {
    font-size: 0.68rem; color: #6b7280; background: #f3f4f6;
    padding: 0.1rem 0.4rem; border-radius: 4px;
}

.split-pay-card__methods {
    display: flex; flex-wrap: wrap; gap: 0.35rem;
}
.split-method-btn {
    display: flex; align-items: center; gap: 0.3rem;
    padding: 0.4rem 0.7rem; border-radius: 8px;
    border: 1.5px solid; background: #fff;
    font-size: 0.75rem; font-weight: 600;
    cursor: pointer; transition: all 0.12s;
}
.split-method-btn:hover { opacity: 0.85; transform: scale(1.02); }

.split-pay-card__paid {
    display: flex; align-items: center; justify-content: space-between;
}
.split-pay-card__badge {
    display: flex; align-items: center; gap: 0.35rem;
    font-size: 0.78rem; font-weight: 600; color: #374151;
}
.split-undo-btn {
    display: flex; align-items: center; gap: 0.2rem;
    background: none; border: none; cursor: pointer;
    font-size: 0.7rem; color: #6366f1; font-weight: 500;
}
.split-undo-btn:hover { text-decoration: underline; }
</style>
