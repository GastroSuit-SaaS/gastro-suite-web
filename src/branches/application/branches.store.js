import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BranchesApi } from '../infrastructure/api/branches.api.js';
import { BranchAssembler } from '../infrastructure/assemblers/branch.assembler.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';

const api = new BranchesApi();

export const useBranchesStore = defineStore('branches', () => {

    const items         = ref([]);
    const selectedItem  = ref(null);
    const isLoading     = ref(false);
    const error         = ref(null);

    const totalItems     = computed(() => items.value.length);
    const activeBranches = computed(() => items.value.filter((b) => b.isActive));

    function _requireCompanyId() {
        const companyId = useIamStore().companyId;
        if (!companyId) {
            throw new Error('No hay empresa asociada a la sesión. Vuelve a iniciar sesión.');
        }
        return companyId;
    }

    async function fetchAll(params) {
        isLoading.value = true;
        error.value = null;
        try {
            const companyId = _requireCompanyId();
            const response = await api.listByCompany(companyId, params);
            items.value = BranchAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar las sucursales');
            items.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedItem.value = BranchAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar la sucursal');
        } finally {
            isLoading.value = false;
        }
    }

    async function create(data) {
        isLoading.value = true;
        error.value = null;
        try {
            const companyId = _requireCompanyId();
            const entity = BranchAssembler.toEntityFromResource({ ...data, empresaId: companyId });
            await api.create(BranchAssembler.toCreateRequest(entity, companyId));
            await fetchAll();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al crear la sucursal');
        } finally {
            isLoading.value = false;
        }
    }

    async function update(id, data) {
        isLoading.value = true;
        error.value = null;
        try {
            const entity = BranchAssembler.toEntityFromResource({ ...data, id });
            await api.update(id, BranchAssembler.toUpdateRequest(entity));
            await fetchAll();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al actualizar la sucursal');
        } finally {
            isLoading.value = false;
        }
    }

    async function remove(id) {
        isLoading.value = true;
        error.value = null;
        const snapshot = [...items.value];
        items.value = items.value.filter((b) => b.id !== id);
        try {
            await api.delete(id);
        } catch (e) {
            items.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al eliminar la sucursal');
        } finally {
            isLoading.value = false;
        }
    }

    async function toggleActive(id) {
        const branch = items.value.find((b) => b.id === id);
        if (!branch) return;
        const next = { ...branch, isActive: !branch.isActive };
        await update(id, next);
    }

    return {
        items, selectedItem, isLoading, error,
        totalItems, activeBranches,
        fetchAll, fetchById, create, update, remove, toggleActive,
    };
});
