import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryApi } from '../infrastructure/api/inventory.api.js';
import { ProductAssembler } from '../infrastructure/assemblers/product.assembler.js';

const api = new InventoryApi();

export const useInventoryStore = defineStore('inventory', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const products        = ref([]);
    const selectedProduct = ref(null);
    const isLoading       = ref(false);
    const error           = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const totalProducts = computed(() => products.value.length);

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getAll();
            products.value = ProductAssembler.toEntitiesFromResponse(response);
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
            selectedProduct.value = ProductAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    async function create(product) {
        const optimisticId = Math.max(0, ...products.value.map(p => p.id)) + 1;
        const optimistic = new (await import('../domain/models/product.entity.js')).Product({ id: optimisticId, ...product });
        products.value.push(optimistic);
        try {
            const response = await api.create(ProductAssembler.toResourceFromEntity(product));
            const saved = ProductAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                const idx = products.value.findIndex(p => p.id === optimisticId);
                if (idx !== -1) products.value.splice(idx, 1, saved);
            }
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            products.value = products.value.filter(p => p.id !== optimisticId);
            error.value = e;
        }
    }

    async function update(id, product) {
        const snapshot = [...products.value];
        products.value = products.value.map(p =>
            p.id === id ? new (Object.getPrototypeOf(p)).constructor({ ...p, ...product, id }) : p
        );
        try {
            await api.update(id, ProductAssembler.toResourceFromEntity(product));
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            products.value = snapshot;
            error.value = e;
        }
    }

    async function remove(id) {
        const snapshot = [...products.value];
        products.value = products.value.filter(p => p.id !== id);
        try {
            await api.delete(id);
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            products.value = snapshot;
            error.value = e;
        }
    }

    return { products, selectedProduct, isLoading, error, totalProducts, fetchAll, fetchById, create, update, remove };
});
