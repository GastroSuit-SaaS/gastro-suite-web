import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BranchesApi } from '../infrastructure/api/branches.api.js';
import { BranchAssembler } from '../infrastructure/assemblers/branch.assembler.js';
import { MOCK_BRANCHES } from '../infrastructure/branches.mock.js';

const api = new BranchesApi();

export const useBranchesStore = defineStore('branches', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const items         = ref([]);
    const selectedItem  = ref(null);
    const isLoading     = ref(false);
    const error         = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const totalItems     = computed(() => items.value.length);
    const activeBranches = computed(() => items.value.filter(b => b.isActive));

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                items.value = [...MOCK_BRANCHES];
                return;
            }
            const response = await api.getAll();
            items.value = BranchAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar las sucursales';
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedItem.value = BranchAssembler.toEntityFromResource(response.data?.data ?? response.data);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar la sucursal';
        } finally {
            isLoading.value = false;
        }
    }

    async function create(data) {
        isLoading.value = true;
        error.value = null;
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                const newId = `branch-${String(items.value.length + 1).padStart(3, '0')}`;
                const newBranch = BranchAssembler.toEntityFromResource({ ...data, id: newId, empresaId: 'empresa-001' });
                items.value.push(newBranch);
                return;
            }
            const resource = BranchAssembler.toResourceFromEntity(data);
            await api.create(resource);
            await fetchAll();
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al crear la sucursal';
        } finally {
            isLoading.value = false;
        }
    }

    async function update(id, data) {
        isLoading.value = true;
        error.value = null;
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                const idx = items.value.findIndex(b => b.id === id);
                if (idx !== -1) items.value[idx] = BranchAssembler.toEntityFromResource({ ...items.value[idx], ...data });
                return;
            }
            const resource = BranchAssembler.toResourceFromEntity(data);
            await api.update(id, resource);
            await fetchAll();
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al actualizar la sucursal';
        } finally {
            isLoading.value = false;
        }
    }

    async function remove(id) {
        isLoading.value = true;
        error.value = null;
        const snapshot = [...items.value];
        items.value = items.value.filter(b => b.id !== id);
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            await api.delete(id);
        } catch (e) {
            items.value = snapshot;
            error.value = e?.response?.data?.message ?? 'Error al eliminar la sucursal';
        } finally {
            isLoading.value = false;
        }
    }

    async function toggleActive(id) {
        const branch = items.value.find(b => b.id === id);
        if (!branch) return;
        const newStatus = !branch.isActive;
        try {
            await api.update(id, { isActive: newStatus });
            branch.isActive = newStatus;
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                branch.isActive = newStatus;
            } else {
                error.value = e?.response?.data?.message ?? 'Error al cambiar el estado';
            }
        }
    }

    return {
        items, selectedItem, isLoading, error,
        totalItems, activeBranches,
        fetchAll, fetchById, create, update, remove, toggleActive,
    };
});
