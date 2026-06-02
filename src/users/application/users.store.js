import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UsersApi } from '../infrastructure/api/users.api.js';
import { UserProfileAssembler } from '../infrastructure/assemblers/user-profile.assembler.js';
import { UserProfile } from '../domain/models/user-profile.entity.js';
import { requireCompanyId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';
import { useIamStore } from '../../iam/application/iam.store.js';

const api = new UsersApi();

export const useUsersStore = defineStore('users', () => {

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
            const companyId = requireCompanyId();
            const response = await api.listByCompany(companyId);
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
        try {
            const companyId = requireCompanyId();
            const response = await api.create(UserProfileAssembler.toCreateRequest(userData, companyId));
            const saved = UserProfileAssembler.toEntityFromResponse(response);
            if (saved) users.value.push(saved);
            else await fetchAll();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al crear el usuario');
            throw e;
        }
    }

    async function update(id, userData) {
        const snapshot = [...users.value];
        users.value = users.value.map((u) =>
            u.id === id ? new UserProfile({ ...u, ...userData, id }) : u
        );
        try {
            await api.update(id, UserProfileAssembler.toUpdateRequest(userData));
        } catch (e) {
            users.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al actualizar el usuario');
            throw e;
        }
    }

    async function remove(id) {
        const snapshot = [...users.value];
        users.value = users.value.filter((u) => u.id !== id);
        try {
            await api.delete(id);
        } catch (e) {
            users.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al eliminar el usuario');
            throw e;
        }
    }

    async function toggleActive(id) {
        const user = users.value.find((u) => u.id === id);
        if (!user) return;
        await update(id, { ...user, isActive: !user.isActive });
    }

    return { users, selectedUser, isLoading, error, activeUsers, fetchAll, fetchById, create, update, remove, toggleActive };
});
