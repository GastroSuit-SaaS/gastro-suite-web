import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PosApi } from '../infrastructure/api/pos.api.js';
import { SaleAssembler } from '../infrastructure/assemblers/sale.assembler.js';

const api = new PosApi();

export const usePosStore = defineStore('pos', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const sales        = ref([]);
    const currentSale  = ref(null);
    const isLoading    = ref(false);
    const error        = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const currentTotal = computed(() => currentSale.value?.total ?? 0);

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        // TODO: call api.getAll(), transform via SaleAssembler.toEntitiesFromResponse
    }

    async function fetchById(id) {
        // TODO: call api.getById(id), transform via SaleAssembler.toEntityFromResource
    }

    async function create(sale) {
        // TODO: call api.create(sale), set as currentSale
    }

    async function update(id, sale) {
        // TODO: call api.update(id, sale), refresh list
    }

    async function remove(id) {
        // TODO: call api.delete(id), refresh list
    }

    return { sales, currentSale, isLoading, error, currentTotal, fetchAll, fetchById, create, update, remove };
});
