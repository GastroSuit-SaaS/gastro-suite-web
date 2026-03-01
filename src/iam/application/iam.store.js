import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { IamApi } from '../infrastructure/api/iam.api.js';
import { UserAssembler } from '../infrastructure/assemblers/user.assembler.js';

const TOKEN_KEY = 'gs_token';
const api = new IamApi();

export const useIamStore = defineStore('iam', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const currentUser = ref(null);
    // Restaurar token desde localStorage al inicializar el store
    const token       = ref(localStorage.getItem(TOKEN_KEY) ?? null);
    const isLoading   = ref(false);
    const error       = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!token.value);

    // ── Helpers ───────────────────────────────────────────────────────────
    function _setToken(jwt) {
        token.value = jwt;
        if (jwt) localStorage.setItem(TOKEN_KEY, jwt);
        else     localStorage.removeItem(TOKEN_KEY);
    }

    function _clearSession() {
        currentUser.value = null;
        _setToken(null);
    }

    // ── Actions ───────────────────────────────────────────────────────────

    /**
     * Inicia sesion. Guarda el token en localStorage.
     * @param {{ username: string, password: string }} credentials
     * @returns {Promise<boolean>} true si exitoso
     */
    async function login(credentials) {
        isLoading.value = true;
        error.value     = null;
        try {
            const response = await api.login(credentials);
            const { token: jwt, user } = response.data;
            _setToken(jwt);
            currentUser.value = UserAssembler.toEntityFromResource(user ?? response.data);
            return true;
        } catch (err) {
            error.value = err.response?.data?.message ?? 'Credenciales incorrectas. Verifica tu usuario y contrasena.';
            _clearSession();
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Cierra la sesion del usuario autenticado.
     */
    async function logout() {
        isLoading.value = true;
        try {
            await api.logout();
        } catch { /* ignorar error de logout en backend */ }
        finally {
            _clearSession();
            isLoading.value = false;
        }
    }

    /**
     * Registra una nueva empresa con su primera sucursal y usuario administrador.
     * @param {{ empresa: Object, sucursal: Object, usuario: Object }} payload
     * @returns {Promise<boolean>} true si exitoso
     */
    async function register(payload) {
        isLoading.value = true;
        error.value     = null;
        try {
            await api.register(payload);
            return true;
        } catch (err) {
            error.value = err.response?.data?.message ?? 'Error al registrar. Intenta nuevamente.';
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Solicita correo de recuperacion de contrasena.
     * @param {string} email
     * @returns {Promise<boolean>} true si exitoso
     */
    async function forgotPassword(email) {
        isLoading.value = true;
        error.value     = null;
        try {
            await api.forgotPassword(email);
            return true;
        } catch (err) {
            error.value = err.response?.data?.message ?? 'No encontramos una cuenta con ese correo.';
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        currentUser, token, isLoading, error, isAuthenticated,
        login, logout, register, forgotPassword,
    };
});
