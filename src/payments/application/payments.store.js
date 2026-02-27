import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PaymentsApi } from '../infrastructure/api/payments.api.js';
import { PaymentAssembler } from '../infrastructure/assemblers/payment.assembler.js';

const api = new PaymentsApi();

export const usePaymentsStore = defineStore('payments', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const payments        = ref([]);
    const selectedPayment = ref(null);
    const isLoading       = ref(false);
    const error           = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const totalAmount = computed(() => payments.value.reduce((acc, p) => acc + p.amount, 0));

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        // TODO: call api.getAll(), transform via PaymentAssembler.toEntitiesFromResponse
    }

    async function fetchById(id) {
        // TODO: call api.getById(id), transform via PaymentAssembler.toEntityFromResource
    }

    async function create(payment) {
        // TODO: call api.create(payment), refresh list
    }

    async function update(id, payment) {
        // TODO: call api.update(id, payment), refresh list
    }

    async function remove(id) {
        // TODO: call api.delete(id), refresh list
    }

    return { payments, selectedPayment, isLoading, error, totalAmount, fetchAll, fetchById, create, update, remove };
});
