import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UsersApi } from '../infrastructure/api/users.api.js';
import { UserProfileAssembler } from '../infrastructure/assemblers/user-profile.assembler.js';

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
        // TODO: call api.getAll(), transform via UserProfileAssembler.toEntitiesFromResponse
    }

    async function fetchById(id) {
        // TODO: call api.getById(id), transform via UserProfileAssembler.toEntityFromResource
    }

    async function create(user) {
        // TODO: call api.create(user), refresh list
    }

    async function update(id, user) {
        // TODO: call api.update(id, user), refresh list
    }

    async function remove(id) {
        // TODO: call api.delete(id), refresh list
    }

    return { users, selectedUser, isLoading, error, activeUsers, fetchAll, fetchById, create, update, remove };
});
