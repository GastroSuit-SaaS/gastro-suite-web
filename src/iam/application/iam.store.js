import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { IamApi } from '../infrastructure/api/iam.api.js';
import { UserAssembler } from '../infrastructure/assemblers/user.assembler.js';

const api = new IamApi();

export const useIamStore = defineStore('iam', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const currentUser   = ref(null);
    const token         = ref(null);
    const isLoading     = ref(false);
    const error         = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!token.value);

    // ── Actions ───────────────────────────────────────────────────────────
    async function login(credentials) {
        // TODO: call api.login(credentials), transform via UserAssembler.toEntityFromResponse,
        //       store currentUser and token in state
    }

    async function logout() {
        // TODO: call api.logout(), clear currentUser and token from state
    }

    async function register(userData) {
        // TODO: call api.create(userData), transform via UserAssembler
    }

    return { currentUser, token, isLoading, error, isAuthenticated, login, logout, register };
});
