import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CashRegisterApi } from '../infrastructure/api/cash-register.api.js';
import { CashMovementAssembler } from '../infrastructure/assemblers/cash-movement.assembler.js';

const api = new CashRegisterApi();

export const useCashRegisterStore = defineStore('cash-register', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const movements        = ref([]);
    const selectedMovement = ref(null);
    const isLoading        = ref(false);
    const error            = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const totalIncome  = computed(() => movements.value.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0));
    const totalExpense = computed(() => movements.value.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0));
    const balance      = computed(() => totalIncome.value - totalExpense.value);

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getAll();
            movements.value = CashMovementAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedMovement.value = CashMovementAssembler.toEntityFromResource(response.data);
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    async function create(movement) {
        isLoading.value = true;
        error.value = null;
        try {
            await api.create(movement);
            await fetchAll();
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    async function remove(id) {
        isLoading.value = true;
        error.value = null;
        try {
            await api.delete(id);
            await fetchAll();
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    return { movements, selectedMovement, isLoading, error, totalIncome, totalExpense, balance, fetchAll, fetchById, create, remove };
});
