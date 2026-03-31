import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PaymentsApi } from '../infrastructure/api/payments.api.js';
import { PaymentAssembler } from '../infrastructure/assemblers/payment.assembler.js';
import { Payment, PAYMENT_STATUS, PAYMENT_METHOD, RECEIPT_TYPE } from '../domain/models/payment.entity.js';
import { MOCK_PAYMENTS } from '../infrastructure/payments.mock.js';

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
        const map = Object.fromEntries(
            Object.values(PAYMENT_METHOD).map(m => [m, 0])
        );
        todaysPayments.value.forEach(p => {
            if (p.method in map) map[p.method] += p.total;
        });
        return map;
    });

    const todayCount = computed(() => todaysPayments.value.length);

    // ── Filter State (consumed by payments-management view) ──────────────
    const filterMethod  = ref('all');
    const filterReceipt = ref('all');
    const searchQuery   = ref('');
    const showAll       = ref(false);   // false = sólo hoy | true = historial completo

    const filteredPayments = computed(() => {
        let list = showAll.value ? payments.value : todaysPayments.value;
        if (filterMethod.value  !== 'all') list = list.filter(p => p.method      === filterMethod.value);
        if (filterReceipt.value !== 'all') list = list.filter(p => p.receiptType === filterReceipt.value);
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.trim().toLowerCase();
            list = list.filter(p =>
                String(p.tableNumber).includes(q) ||
                String(p.saleId).includes(q)      ||
                (p.receiptData?.nombre?.toLowerCase().includes(q)) ||
                (p.receiptData?.razonSocial?.toLowerCase().includes(q)) ||
                (p.receiptData?.dni?.includes(q)) ||
                (p.receiptData?.ruc?.includes(q))
            );
        }
        return list;
    });

    function setFilterMethod(val)  { filterMethod.value  = val; }
    function setFilterReceipt(val) { filterReceipt.value = val; }
    function setSearchQuery(val)   { searchQuery.value   = val; }
    function setShowAll(val)       { showAll.value       = val; }

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                const branchId = localStorage.getItem('gs_branch_id');
                payments.value = branchId ? MOCK_PAYMENTS.filter(p => p.sucursalId === branchId) : [...MOCK_PAYMENTS];
                return;
            }
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
        const payment = payments.value.find(p => p.id === id);
        // Pagos completados no se eliminan — usar refund() en su lugar
        if (payment?.status === PAYMENT_STATUS.COMPLETED) return;
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
            const response = await api.processPayment(PaymentAssembler.toResourceFromEntity(payment));
            if (response.status === 201 || response.status === 200) {
                const saved = PaymentAssembler.toEntityFromResponse(response);
                if (saved) {
                    const idx = payments.value.findIndex(p => p.id === tempId);
                    if (idx !== -1) payments.value.splice(idx, 1, saved);
                    return saved;
                }
            }
        } catch (e) {
            // Pago queda localmente con flag de sincronización pendiente
            const idx = payments.value.findIndex(p => p.id === tempId);
            if (idx !== -1) {
                payments.value[idx] = new Payment({ ...payments.value[idx], pendingSync: true });
            }
        }
        return payment;
    }

    /**
     * Marca un pago existente como reembolsado.
     * @param {number} id     - ID del pago a reembolsar
     * @param {string} reason - Motivo del reembolso
     */
    async function refund(id, reason = '') {
        const idx = payments.value.findIndex(p => p.id === id);
        if (idx === -1) return;
        const snapshot = new Payment({ ...payments.value[idx] });
        payments.value[idx] = new Payment({ ...payments.value[idx], status: PAYMENT_STATUS.REFUNDED });
        try {
            await api.refund(id, reason);
        } catch {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            // Rollback: restore original payment status
            payments.value[idx] = snapshot;
        }
    }

    return {
        payments, selectedPayment, isLoading, error,
        todaysPayments, todayTotal, totalAmount, todayByMethod, todayCount,
        filterMethod, filterReceipt, searchQuery, showAll, filteredPayments,
        setFilterMethod, setFilterReceipt, setSearchQuery, setShowAll,
        fetchAll, fetchById, remove, registerPayment, refund,
    };
});
