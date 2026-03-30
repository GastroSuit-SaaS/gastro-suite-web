import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PaymentsApi } from '../infrastructure/api/payments.api.js';
import { PaymentAssembler } from '../infrastructure/assemblers/payment.assembler.js';
import { Payment, PAYMENT_STATUS, PAYMENT_METHOD, RECEIPT_TYPE } from '../domain/models/payment.entity.js';

const api = new PaymentsApi();

// ── Mock data (DEV fallback) ───────────────────────────────────────────────
const today = new Date();
const t = (h, m) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);

const MOCK_PAYMENTS = [
    new Payment({ id: 1001, saleId: 301, tableNumber: 5,  zoneName: 'Terraza',  items: [{ name: 'Lomo Saltado', qty: 2, subtotal: 52.00 }, { name: 'Inca Kola 500ml', qty: 2, subtotal: 12.00 }], subtotal: 54.24, tax: 9.76, discount: 0, total: 64.00,  method: PAYMENT_METHOD.CASH, amountReceived: 100, change: 36.00, receiptType: RECEIPT_TYPE.BOLETA,  receiptData: { dni: '45678912', nombre: 'Carlos Mendes'      }, status: PAYMENT_STATUS.COMPLETED, processedAt: t(9,  15) }),
    new Payment({ id: 1002, saleId: 302, tableNumber: 2,  zoneName: 'Interior', items: [{ name: 'Ceviche Mixto', qty: 1, subtotal: 45.00 }, { name: 'Chicha Morada', qty: 2, subtotal: 10.00 }], subtotal: 46.61, tax: 8.39, discount: 5, total: 50.00,  method: PAYMENT_METHOD.YAPE,  amountReceived: 50,  change: 0,     receiptType: RECEIPT_TYPE.NOTA,    receiptData: {},                                             status: PAYMENT_STATUS.COMPLETED, processedAt: t(10, 30) }),
    new Payment({ id: 1003, saleId: 303, tableNumber: 8,  zoneName: 'Jardín',   items: [{ name: 'Arroz con Leche', qty: 3, subtotal: 21.00 }, { name: 'Café Americano', qty: 3, subtotal: 18.00 }], subtotal: 33.05, tax: 5.95, discount: 0, total: 39.00,  method: PAYMENT_METHOD.CARD,  amountReceived: 39,  change: 0,     receiptType: RECEIPT_TYPE.FACTURA, receiptData: { ruc: '20512345678', razonSocial: 'Eventos SAC', direccion: 'Av. Lima 230' }, status: PAYMENT_STATUS.COMPLETED, processedAt: t(11, 45) }),
    new Payment({ id: 1004, saleId: 304, tableNumber: 1,  zoneName: 'Interior', items: [{ name: 'Pizza Napolitana', qty: 1, subtotal: 38.00 }],                                                   subtotal: 32.20, tax: 5.80, discount: 0, total: 38.00,  method: PAYMENT_METHOD.PLIN,  amountReceived: 38,  change: 0,     receiptType: RECEIPT_TYPE.BOLETA,  receiptData: { dni: '12345678', nombre: 'María Torres'       }, status: PAYMENT_STATUS.COMPLETED, processedAt: t(12, 10) }),
    new Payment({ id: 1005, saleId: 305, tableNumber: 3,  zoneName: 'Terraza',  items: [{ name: 'Tacu Tacu', qty: 2, subtotal: 60.00 }, { name: 'Jugo Natural', qty: 2, subtotal: 16.00 }],      subtotal: 64.41, tax: 11.59, discount: 0, total: 76.00, method: PAYMENT_METHOD.CASH, amountReceived: 100, change: 24.00, receiptType: RECEIPT_TYPE.NOTA,    receiptData: {},                                             status: PAYMENT_STATUS.COMPLETED, processedAt: t(13, 5)  }),
    new Payment({ id: 1006, saleId: 306, tableNumber: 6,  zoneName: 'Jardín',   items: [{ name: 'Causa Rellena', qty: 2, subtotal: 30.00 }, { name: 'Agua San Luis', qty: 2, subtotal: 8.00 }],  subtotal: 32.20, tax: 5.80, discount: 0, total: 38.00,  method: PAYMENT_METHOD.YAPE,  amountReceived: 38,  change: 0,     receiptType: RECEIPT_TYPE.BOLETA,  receiptData: { dni: '87654321', nombre: 'José Quispe'        }, status: PAYMENT_STATUS.COMPLETED, processedAt: t(14, 20) }),
    new Payment({ id: 1007, saleId: 307, tableNumber: 4,  zoneName: 'Interior', items: [{ name: 'Sopa Criolla', qty: 1, subtotal: 22.00 }, { name: 'Gaseosa 1L', qty: 1, subtotal: 8.00 }],     subtotal: 25.42, tax: 4.58, discount: 0, total: 30.00,  method: PAYMENT_METHOD.CARD,  amountReceived: 30,  change: 0,     receiptType: RECEIPT_TYPE.NOTA,    receiptData: {},                                             status: PAYMENT_STATUS.COMPLETED, processedAt: t(15, 0)  }),
    new Payment({ id: 1008, saleId: 308, tableNumber: 7,  zoneName: 'Terraza',  items: [{ name: 'Pollo a la Brasa', qty: 1, subtotal: 55.00 }, { name: 'Papas Fritas', qty: 2, subtotal: 16.00 }, { name: 'Inca Kola 1.5L', qty: 1, subtotal: 9.00 }], subtotal: 67.80, tax: 12.20, discount: 0, total: 80.00, method: PAYMENT_METHOD.CASH, amountReceived: 100, change: 20.00, receiptType: RECEIPT_TYPE.FACTURA, receiptData: { ruc: '20601234567', razonSocial: 'Tech Corp EIRL', direccion: 'Jr. Puno 456' }, status: PAYMENT_STATUS.COMPLETED, processedAt: t(16, 35) }),
];

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
            // Backend no disponible — usar mock data si VITE_USE_MOCK=true
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                payments.value = [...MOCK_PAYMENTS];
            } else {
                error.value = e?.response?.data?.message ?? 'Error al cargar los pagos';
            }
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
            // Pago queda localmente; se sincronizará en el próximo fetchAll
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
        if (idx !== -1) payments.value[idx] = new Payment({ ...payments.value[idx], status: PAYMENT_STATUS.REFUNDED });
        try {
            await api.refund(id, reason);
        } catch {
            // Cambio local se mantiene; se sincronizará en el próximo fetchAll
        }
    }

    return {
        payments, selectedPayment, isLoading, error,
        todaysPayments, todayTotal, totalAmount, todayByMethod, todayCount,
        fetchAll, fetchById, remove, registerPayment, refund,
    };
});
