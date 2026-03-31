import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UsersApi } from '../infrastructure/api/users.api.js';
import { UserProfileAssembler } from '../infrastructure/assemblers/user-profile.assembler.js';
import { MOCK_USERS } from '../infrastructure/users.mock.js';
import { UserProfile } from '../domain/models/user-profile.entity.js';

const api = new UsersApi();

export const useUsersStore = defineStore('users', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const users        = ref([]);
    const selectedUser = ref(null);
    const isLoading    = ref(false);
    const error        = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const activeUsers = computed(() => users.value.filter(u => u.isActive));

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                const branchId = localStorage.getItem('gs_branch_id');
                users.value = branchId
                    ? MOCK_USERS.filter(u => u.sucursalId === branchId || !u.sucursalId)
                    : [...MOCK_USERS];
                return;
            }
            const response = await api.getAll();
            users.value = UserProfileAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar los usuarios';
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
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    async function create(userData) {
        const optimisticId = `user-${Date.now()}`;
        const optimistic = new UserProfile({ id: optimisticId, ...userData });
        users.value.push(optimistic);
        try {
            const response = await api.create(UserProfileAssembler.toResourceFromEntity(userData));
            const saved = UserProfileAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                const idx = users.value.findIndex(u => u.id === optimisticId);
                if (idx !== -1) users.value.splice(idx, 1, saved);
            }
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            users.value = users.value.filter(u => u.id !== optimisticId);
            error.value = e;
        }
    }

    async function update(id, userData) {
        const snapshot = [...users.value];
        users.value = users.value.map(u =>
            u.id === id ? new UserProfile({ ...u, ...userData, id }) : u
        );
        try {
            await api.update(id, UserProfileAssembler.toResourceFromEntity(userData));
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            users.value = snapshot;
            error.value = e;
        }
    }

    async function remove(id) {
        const snapshot = [...users.value];
        users.value = users.value.filter(u => u.id !== id);
        try {
            await api.delete(id);
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            users.value = snapshot;
            error.value = e;
        }
    }

    async function toggleActive(id) {
        const snapshot = [...users.value];
        users.value = users.value.map(u =>
            u.id === id ? new UserProfile({ ...u, isActive: !u.isActive }) : u
        );
        try {
            await api.toggleActive(id);
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            users.value = snapshot;
            error.value = e;
        }
    }

    return { users, selectedUser, isLoading, error, activeUsers, fetchAll, fetchById, create, update, remove, toggleActive };
});
