import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PaymentsApi } from '../infrastructure/api/payments.api.js';
import { PaymentAssembler } from '../infrastructure/assemblers/payment.assembler.js';
import { Payment, PAYMENT_STATUS, PAYMENT_METHOD } from '../domain/models/payment.entity.js';

const api = new PaymentsApi();

export const usePaymentsStore = defineStore('payments', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const payments        = ref([]);
    const selectedPayment = ref(null);
    const isLoading       = ref(false);
    const error           = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const todaysPayments = computed(() =>
        payments.value.filter(p => p.isToday && p.status === PAYMENT_STATUS.COMPLETED)
    );

    const todayTotal = computed(() =>
        todaysPayments.value.reduce((sum, p) => sum + p.total, 0)
    );

    const totalAmount = computed(() =>
        payments.value.reduce((sum, p) => sum + p.total, 0)
    );

    const todayByMethod = computed(() => {
        const map = {
            [PAYMENT_METHOD.CASH]: 0,
            [PAYMENT_METHOD.CARD]: 0,
            [PAYMENT_METHOD.YAPE]: 0,
            [PAYMENT_METHOD.PLIN]: 0,
        };
        todaysPayments.value.forEach(p => {
            if (map[p.method] !== undefined) map[p.method] += p.total;
        });
        return map;
    });

    const todayCount = computed(() => todaysPayments.value.length);

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getAll();
            payments.value = PaymentAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar los pagos';
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedPayment.value = PaymentAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al obtener el pago';
        } finally {
            isLoading.value = false;
        }
    }

    async function remove(id) {
        isLoading.value = true;
        error.value = null;
        try {
            await api.delete(id);
            payments.value = payments.value.filter(p => p.id !== id);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al eliminar el pago';
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Registra un nuevo pago localmente (y encola persistencia al backend).
     * Llamado por pos.store.confirmPayment() al cerrar una orden.
     *
     * @param {{
     *   saleId: number, tableNumber: number|null, zoneName: string|null,
     *   items: Array, subtotal: number, tax: number, discount: number, total: number,
     *   method: string, amountReceived: number, change: number,
     *   receiptType: string, receiptData: object
     * }} data
     * @returns {Payment}
     */
    async function registerPayment(data) {
        const tempId  = Date.now();
        const payment = new Payment({ id: tempId, status: PAYMENT_STATUS.COMPLETED, ...data });
        payments.value.unshift(payment);            // optimistic insert — más reciente primero
        try {
            const response = await api.create(PaymentAssembler.toResourceFromEntity(payment));
            if (response.status === 201 || response.status === 200) {
                const saved = PaymentAssembler.toEntityFromResponse(response);
                if (saved) {
                    const idx = payments.value.findIndex(p => p.id === tempId);
                    if (idx !== -1) payments.value.splice(idx, 1, saved);
                    return saved;
                }
            }
        } catch (e) {
            // Pago queda localmente; se sincronizará en el próximo fetchAll
        }
        return payment;
    }

    return {
        payments, selectedPayment, isLoading, error,
        todaysPayments, todayTotal, totalAmount, todayByMethod, todayCount,
        fetchAll, fetchById, remove, registerPayment,
    };
});
