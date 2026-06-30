import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UsersApi } from '../infrastructure/api/users.api.js';
import { UserProfileAssembler } from '../infrastructure/assemblers/user-profile.assembler.js';
import { UserProfile } from '../domain/models/user-profile.entity.js';
import { requireActiveBranchId, requireCompanyId } from '../../shared/application/tenant-context.js';
import { ROLES } from '../../shared/domain/roles.js';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { useBranchesStore } from '../../branches/application/branches.store.js';
import { storeSuccess, storeFailure } from '../../shared/application/store-result.js';
import { useUsersFacade } from './users.facade.js';
import { buildUserRoleOptions } from '../domain/user-role.ui.js';

const api = new UsersApi();

export const useUsersStore = defineStore('users', () => {

    const facade = useUsersFacade();
    const users        = ref([]);
    const selectedUser = ref(null);
    const isLoading    = ref(false);
    const error        = ref(null);

    const activeUsers = computed(() => users.value.filter((u) => u.isActive));

    /** Excluye al usuario de la sesión actual (el API también lo filtra por userId). */
    function excludeSessionUser(profiles) {
        const session = useIamStore().currentUser;
        if (!session) return profiles;
        return profiles.filter((profile) => {
            if (session.employeeId && profile.id === session.employeeId) return false;
            if (session.id && profile.userId === session.id) return false;
            if (session.username && profile.username === session.username) return false;
            return true;
        });
    }

    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const iam = useIamStore();
            const useBranchScope = iam.userRole === ROLES.BRANCH_ADMIN && iam.hasBranchSelected;
            const response = useBranchScope
                ? await api.listByBranch(requireActiveBranchId())
                : await api.listByCompany(requireCompanyId());
            users.value = excludeSessionUser(
                UserProfileAssembler.toEntitiesFromResponse(response),
            );
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar los usuarios');
            users.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedUser.value = UserProfileAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar el usuario');
        } finally {
            isLoading.value = false;
        }
    }

    async function create(userData) {
        error.value = null;
        try {
            const companyId = requireCompanyId();
            const response = await api.create(UserProfileAssembler.toCreateRequest(userData, companyId));
            const saved = UserProfileAssembler.toEntityFromResponse(response);
            if (saved) users.value.push(saved);
            else await fetchAll();
            return storeSuccess({ id: saved?.id ?? null });
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al crear el usuario');
            return storeFailure(e, 'No se pudo crear el usuario');
        }
    }

    async function update(id, userData) {
        error.value = null;
        const snapshot = [...users.value];
        users.value = users.value.map((u) =>
            u.id === id ? new UserProfile({ ...u, ...userData, id }) : u
        );
        try {
            await api.update(id, UserProfileAssembler.toUpdateRequest(userData));
            return storeSuccess();
        } catch (e) {
            users.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al actualizar el usuario');
            return storeFailure(e, 'No se pudo actualizar el usuario');
        }
    }

    async function remove(id) {
        error.value = null;
        const snapshot = [...users.value];
        users.value = users.value.filter((u) => u.id !== id);
        try {
            await api.delete(id);
            return storeSuccess();
        } catch (e) {
            users.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al eliminar el usuario');
            return storeFailure(e, 'No se pudo eliminar el usuario');
        }
    }

    async function toggleActive(id) {
        const user = users.value.find((u) => u.id === id);
        if (!user) return storeFailure(new Error('Usuario no encontrado'), 'Usuario no encontrado');
        return update(id, { ...user, isActive: !user.isActive });
    }

    function assignableRolesForPlan(entitlements) {
        return facade.assignableRolesForPlan(entitlements);
    }

    function roleOptionsForPlan(entitlements) {
        return buildUserRoleOptions(assignableRolesForPlan(entitlements));
    }

    async function bootstrapManagement() {
        await facade.bootstrapManagement();
    }

    async function assignBranchManager(sucursalId, payload) {
        return useBranchesStore().assignManager(sucursalId, payload);
    }

    return {
        users, selectedUser, isLoading, error, activeUsers,
        branchOptions: facade.branchOptions,
        fetchAll, fetchById, create, update, remove, toggleActive,
        assignableRolesForPlan, roleOptionsForPlan, bootstrapManagement, assignBranchManager,
    };
});
