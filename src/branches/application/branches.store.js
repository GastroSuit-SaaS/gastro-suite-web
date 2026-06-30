import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BranchesApi } from '../infrastructure/api/branches.api.js';
import { BranchAssembler } from '../infrastructure/assemblers/branch.assembler.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error.js';
import { storeSuccess, storeFailure, storeFailureMessage } from '../../shared/application/store-result.js';
import { useBranchesFacade } from './branches.facade.js';

const api = new BranchesApi();

export const useBranchesStore = defineStore('branches', () => {
    const facade = useBranchesFacade();
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
        error.value = null;
        try {
            const companyId = _requireCompanyId();
            const entity = BranchAssembler.toEntityFromResource({ ...data, empresaId: companyId });
            await api.create(BranchAssembler.toCreateRequest(entity, companyId));
            await fetchAll();
            return storeSuccess();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al crear la sucursal');
            return storeFailure(e, 'No se pudo crear la sucursal');
        }
    }

    async function update(id, data) {
        error.value = null;
        try {
            const entity = BranchAssembler.toEntityFromResource({ ...data, id });
            await api.update(id, BranchAssembler.toUpdateRequest(entity));
            await fetchAll();
            return storeSuccess();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al actualizar la sucursal');
            return storeFailure(e, 'No se pudo actualizar la sucursal');
        }
    }

    async function remove(id) {
        error.value = null;
        const snapshot = [...items.value];
        items.value = items.value.filter((b) => b.id !== id);
        try {
            await api.delete(id);
            return storeSuccess();
        } catch (e) {
            items.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al eliminar la sucursal');
            return storeFailure(e, 'No se pudo eliminar la sucursal');
        }
    }

    async function toggleActive(id) {
        const branch = items.value.find((b) => b.id === id);
        if (!branch) return storeFailureMessage('Sucursal no encontrada');
        const next = { ...branch, isActive: !branch.isActive };
        return update(id, next);
    }

    /** Asigna encargado de sucursal (caso de uso cruzado users → branches). */
    async function assignManager(branchId, { encargadoId, encargadoNombre }) {
        const branch = items.value.find((b) => b.id === branchId);
        if (!branch) {
            return storeFailureMessage('Sucursal no encontrada');
        }
        return update(branchId, {
            ...branch,
            encargadoId,
            encargadoNombre,
        });
    }

    async function bootstrapManagement() {
        await Promise.all([fetchAll(), facade.ensureUsersLoaded()]);
    }

    return {
        items, selectedItem, isLoading, error,
        totalItems, activeBranches,
        fetchAll, fetchById, create, update, remove, toggleActive, assignManager,
        bootstrapManagement,
        activeBranchId: facade.activeBranchId,
        managerCandidates: facade.managerCandidates,
        ensureUsersLoaded: facade.ensureUsersLoaded,
        encargadoDisplayForBranch: facade.encargadoDisplayForBranch,
    };
});
