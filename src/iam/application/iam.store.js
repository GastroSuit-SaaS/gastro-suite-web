import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { IamApi } from '../infrastructure/api/iam.api.js';
import { UserAssembler } from '../infrastructure/assemblers/user.assembler.js';
import { mockLogin } from '../infrastructure/auth.mock.js';
import { ROLES } from '../../shared/presentation/constants/roles.constants.js';

const TOKEN_KEY    = 'gs_token';
const BRANCH_KEY   = 'gs_branch_id';
const BRANCH_NAME  = 'gs_branch_name';
const api = new IamApi();

export const useIamStore = defineStore('iam', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const currentUser   = ref(null);
    const token         = ref(localStorage.getItem(TOKEN_KEY) ?? null);
    const activeBranchId   = ref(localStorage.getItem(BRANCH_KEY) ?? null);
    const activeBranchName = ref(localStorage.getItem(BRANCH_NAME) ?? '');
    const isLoading     = ref(false);
    const error         = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!token.value);
    const userRole        = computed(() => currentUser.value?.primaryRole ?? '');
    const isOwner         = computed(() => currentUser.value?.isOwner ?? false);
    const hasBranchSelected = computed(() => !!activeBranchId.value);

    // ── Helpers ───────────────────────────────────────────────────────────
    function _setToken(jwt) {
        token.value = jwt;
        if (jwt) localStorage.setItem(TOKEN_KEY, jwt);
        else     localStorage.removeItem(TOKEN_KEY);
    }

    function _setBranch(branchId, branchName = '') {
        activeBranchId.value   = branchId;
        activeBranchName.value = branchName;
        if (branchId) {
            localStorage.setItem(BRANCH_KEY, branchId);
            localStorage.setItem(BRANCH_NAME, branchName);
        } else {
            localStorage.removeItem(BRANCH_KEY);
            localStorage.removeItem(BRANCH_NAME);
        }
    }

    function _clearSession() {
        currentUser.value = null;
        _setToken(null);
        _setBranch(null);
    }

    // ── Actions ───────────────────────────────────────────────────────────

    /**
     * Inicia sesion. Guarda el token en localStorage.
     * Si el usuario tiene sucursal asignada (rol operativo), la setea automáticamente.
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
            // Roles operativos: setear su sucursal automáticamente
            if (currentUser.value.sucursalId) {
                _setBranch(currentUser.value.sucursalId, currentUser.value.sucursalNombre);
            }
            return true;
        } catch (err) {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                try {
                    const mockResponse = mockLogin(credentials);
                    _setToken(mockResponse.token);
                    currentUser.value = UserAssembler.toEntityFromResource(mockResponse.user);
                    if (currentUser.value.sucursalId) {
                        _setBranch(currentUser.value.sucursalId, currentUser.value.sucursalNombre);
                    }
                    return true;
                } catch (mockErr) {
                    error.value = mockErr.message;
                    _clearSession();
                    return false;
                }
            }
            error.value = err.response?.data?.message ?? 'No se pudo iniciar sesión. Verifica tus credenciales e intenta de nuevo.';
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
     * Selecciona una sucursal activa (usado por OWNER al elegir sucursal).
     * @param {string} branchId
     * @param {string} branchName
     */
    function selectBranch(branchId, branchName = '') {
        _setBranch(branchId, branchName);
    }

    /**
     * Limpia la sucursal activa (OWNER vuelve a vista global).
     */
    function clearBranch() {
        _setBranch(null);
    }

    /**
     * Registra una nueva empresa con su usuario administrador (OWNER).
     * @param {{ empresa: Object, usuario: Object }} payload
     * @returns {Promise<boolean>} true si exitoso
     */
    async function register(payload) {
        isLoading.value = true;
        error.value     = null;
        try {
            await api.register(payload);
            return true;
        } catch (err) {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                return true;
            }
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
        currentUser, token, isLoading, error,
        isAuthenticated, userRole, isOwner, hasBranchSelected,
        activeBranchId, activeBranchName,
        login, logout, register, forgotPassword,
        selectBranch, clearBranch,
    };
});
