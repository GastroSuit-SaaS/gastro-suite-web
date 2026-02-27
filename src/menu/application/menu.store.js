import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { MenuApi } from '../infrastructure/api/menu.api.js';
import { MenuItemAssembler } from '../infrastructure/assemblers/menu-item.assembler.js';

const api = new MenuApi();

export const useMenuStore = defineStore('menu', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const items        = ref([]);
    const selectedItem = ref(null);
    const isLoading    = ref(false);
    const error        = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const availableItems = computed(() => items.value.filter(i => i.isAvailable));
    const totalItems     = computed(() => items.value.length);

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getAll();
            items.value = MenuItemAssembler.toEntitiesFromResponse(response);
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
            selectedItem.value = MenuItemAssembler.toEntityFromResource(response.data);
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    async function create(item) {
        isLoading.value = true;
        error.value = null;
        try {
            await api.create(item);
            await fetchAll();
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    async function update(id, item) {
        isLoading.value = true;
        error.value = null;
        try {
            await api.update(id, item);
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

    return { items, selectedItem, isLoading, error, availableItems, totalItems, fetchAll, fetchById, create, update, remove };
});
