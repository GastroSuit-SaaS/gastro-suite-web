<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCashRegisterStore } from '../../application/cash-register.store.js'
import { CASH_REGISTER_LABELS as L } from '../constants/cash-register.constants-ui.js'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'session-closed'])

const store  = useCashRegisterStore()
const router = useRouter()

const isActiveSalesBlock = computed(() =>
    store.closeSessionError?.code === 'CRG_002',
)

const step          = ref(1)
const countedAmount = ref(0)
const notes         = ref('')

const difference = computed(() =>
    parseFloat((countedAmount.value - store.sessionExpectedCash).toFixed(2))
)

const headerTitle = computed(() =>
    step.value === 1
        ? `${L.CLOSE_SESSION} — ${L.SUMMARY}`
        : `${L.CLOSE_SESSION} — ${L.CASH_COUNT}`
)

watch(() => props.visible, (val) => {
    if (val) {
        step.value          = 1
        countedAmount.value = store.sessionExpectedCash
        notes.value         = ''
    }
})

const cashSales = computed(() => store.sessionCashSalesRevenue)
const digitalSales = computed(() => store.sessionDigitalIncome)
const totalSold = computed(() => store.sessionTotalSalesRevenue)
const deposits = computed(() =>
    store.currentSessionMovements
        .filter(m => m.category === 'deposito')
        .reduce((s, m) => s + m.amount, 0)
)

function onCancel() {
    emit('update:visible', false)
}

function onConfirm() {
    emit('session-closed', {
        countedAmount: parseFloat(countedAmount.value),
        notes:         notes.value,
    })
}

function goToPos() {
    emit('update:visible', false)
    router.push('/pos')
}

function fmtCurrency(n) {
    return `S/ ${(n ?? 0).toFixed(2)}`
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="false"
        entity-name="Cierre de turno"
        :header-title-override="headerTitle"
        size="wide"
        @canceled-shared="onCancel"
    >
        <template #content>
            <pv-message
                v-if="isActiveSalesBlock"
                severity="warn"
                :closable="false"
                class="close-session-block-msg"
            >
                <span>{{ store.closeSessionError?.message }}</span>
                <div class="close-session-block-msg__actions">
                    <pv-button label="Ir al POS" icon="pi pi-shopping-cart" size="small" @click="goToPos" />
                    <pv-button label="Ver mesas" icon="pi pi-table" size="small" severity="secondary" outlined @click="router.push('/tables'); emit('update:visible', false)" />
                </div>
            </pv-message>

            <div v-if="step === 1" class="flex flex-column gap-4 pt-2">
                <div class="surface-ground border-round-lg p-4">
                    <p class="text-xs text-color-secondary uppercase font-medium mt-0 mb-3">Ventas del turno</p>
                    <div class="flex flex-column gap-2">
                        <div class="flex justify-content-between text-sm">
                            <span style="color: #374151;">Ventas en efectivo</span>
                            <span class="font-bold text-green-400">{{ fmtCurrency(cashSales) }}</span>
                        </div>
                        <div class="flex justify-content-between text-sm">
                            <span style="color: #374151;">Ventas digitales (Tarjeta/Yape/Plin)</span>
                            <span class="font-bold text-purple-400">{{ fmtCurrency(digitalSales) }}</span>
                        </div>
                        <div class="flex justify-content-between text-sm border-top-1 surface-border pt-2 mt-1">
                            <span class="font-medium" style="color: #111827;">Total vendido en turno</span>
                            <span class="font-bold" style="color: #111827;">{{ fmtCurrency(totalSold) }}</span>
                        </div>
                        <div class="flex justify-content-between text-sm">
                            <span style="color: #374151;">Cantidad de ventas</span>
                            <span class="font-medium" style="color: #111827;">{{ store.sessionSalesCount }}</span>
                        </div>
                        <div v-if="store.sessionTipsIncome > 0" class="flex justify-content-between text-sm">
                            <span style="color: #374151;">Propinas</span>
                            <span class="font-medium text-pink-400">{{ fmtCurrency(store.sessionTipsIncome) }}</span>
                        </div>
                        <div v-if="store.sessionRefundsExpense > 0" class="flex justify-content-between text-sm">
                            <span style="color: #374151;">Reembolsos</span>
                            <span class="font-medium text-red-400">− {{ fmtCurrency(store.sessionRefundsExpense) }}</span>
                        </div>
                    </div>
                </div>

                <div class="surface-ground border-round-lg p-4">
                    <p class="text-xs text-color-secondary uppercase font-medium mt-0 mb-3">Movimientos manuales</p>
                    <div class="flex flex-column gap-2">
                        <div class="flex justify-content-between text-sm">
                            <span style="color: #374151;">Depósitos</span>
                            <span class="font-medium text-green-400">+ {{ fmtCurrency(deposits) }}</span>
                        </div>
                        <div class="flex justify-content-between text-sm">
                            <span style="color: #374151;">Retiros / Compras</span>
                            <span class="font-medium text-red-400">- {{ fmtCurrency(store.sessionCashExpense) }}</span>
                        </div>
                    </div>
                </div>

                <div class="surface-ground border-round-lg p-4">
                    <p class="text-xs text-color-secondary uppercase font-medium mt-0 mb-3">Efectivo en gaveta</p>
                    <div class="flex flex-column gap-2">
                        <div class="flex justify-content-between text-sm">
                            <span style="color: #374151;">Fondo inicial</span>
                            <span class="font-medium" style="color: #111827;">{{ fmtCurrency(store.currentSession?.initialAmount) }}</span>
                        </div>
                        <div class="flex justify-content-between text-sm">
                            <span style="color: #374151;">+ Ingresos efectivo</span>
                            <span class="font-medium text-green-400">{{ fmtCurrency(store.sessionCashIncome) }}</span>
                        </div>
                        <div class="flex justify-content-between text-sm">
                            <span style="color: #374151;">- Egresos efectivo</span>
                            <span class="font-medium text-red-400">{{ fmtCurrency(store.sessionCashExpense) }}</span>
                        </div>
                        <div class="flex justify-content-between text-sm border-top-1 surface-border pt-2 mt-1">
                            <span class="font-bold" style="color: #111827;">EFECTIVO ESPERADO</span>
                            <span class="font-bold text-xl" style="color: #111827;">{{ fmtCurrency(store.sessionExpectedCash) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="flex flex-column gap-4 pt-2">
                <div class="surface-ground border-round-lg p-4 text-center">
                    <p class="text-xs text-color-secondary uppercase font-medium mt-0 mb-1">Efectivo esperado</p>
                    <span class="font-bold text-2xl" style="color: #111827;">{{ fmtCurrency(store.sessionExpectedCash) }}</span>
                </div>

                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        {{ L.COUNTED_AMOUNT }} (S/) <span class="text-red-500">*</span>
                    </label>
                    <pv-input-number
                        v-model="countedAmount"
                        mode="currency" currency="PEN" locale="es-PE"
                        :min="0" :maxFractionDigits="2"
                        class="w-full"
                        autofocus
                    />
                </div>

                <div class="surface-ground border-round-lg p-4">
                    <div class="flex justify-content-between align-items-center">
                        <span class="text-sm font-medium" style="color: #374151;">{{ L.DIFFERENCE }}</span>
                        <span :class="['font-bold text-xl', difference < 0 ? 'text-red-400' : difference > 0 ? 'text-orange-400' : 'text-green-400']">
                            {{ difference >= 0 ? '+' : '' }}{{ fmtCurrency(difference) }}
                        </span>
                    </div>
                    <p v-if="difference < 0" class="text-sm text-red-400 mt-2 mb-0">
                        <i class="pi pi-exclamation-triangle mr-1" />
                        Faltante de {{ fmtCurrency(Math.abs(difference)) }} en caja
                    </p>
                    <p v-else-if="difference > 0" class="text-sm text-orange-400 mt-2 mb-0">
                        <i class="pi pi-info-circle mr-1" />
                        Sobrante de {{ fmtCurrency(difference) }} en caja
                    </p>
                    <p v-else class="text-sm text-green-400 mt-2 mb-0">
                        <i class="pi pi-check-circle mr-1" />
                        Caja cuadrada
                    </p>
                </div>

                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Notas de cierre (opcional)
                    </label>
                    <pv-textarea
                        v-model="notes"
                        :rows="2"
                        class="w-full"
                        placeholder="Observaciones del cierre de turno"
                        auto-resize
                    />
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-content-between w-full">
                <pv-button
                    v-if="step === 2"
                    label="← Volver"
                    severity="secondary"
                    text
                    @click="step = 1"
                />
                <span v-else />
                <div class="flex gap-2">
                    <pv-button label="Cancelar" severity="secondary" text @click="onCancel" />
                    <pv-button
                        v-if="step === 1"
                        label="Siguiente →"
                        icon="pi pi-arrow-right"
                        icon-pos="right"
                        @click="step = 2"
                    />
                    <pv-button
                        v-else
                        label="Confirmar Cierre"
                        icon="pi pi-lock"
                        severity="warn"
                        @click="onConfirm"
                    />
                </div>
            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.close-session-block-msg__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
}
</style>
