import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryApi } from '../infrastructure/api/inventory.api.js';
import { ProductAssembler } from '../infrastructure/assemblers/product.assembler.js';

const api = new InventoryApi();

export const useInventoryStore = defineStore('inventory', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const products      = ref([]);
    const selectedProduct = ref(null);
    const isLoading     = ref(false);
    const error         = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const totalProducts = computed(() => products.value.length);

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        // TODO: call api.getAll(), transform via ProductAssembler.toEntitiesFromResponse
    }

    async function fetchById(id) {
        // TODO: call api.getById(id), transform via ProductAssembler.toEntityFromResource
    }

    async function create(product) {
        // TODO: call api.create(product), refresh list
    }

    async function update(id, product) {
        // TODO: call api.update(id, product), refresh list
    }

    async function remove(id) {
        // TODO: call api.delete(id), refresh list
    }

    return { products, selectedProduct, isLoading, error, totalProducts, fetchAll, fetchById, create, update, remove };
});
