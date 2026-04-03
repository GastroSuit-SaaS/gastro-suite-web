import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { IamApi } from '../infrastructure/api/iam.api.js';
import { UserAssembler } from '../infrastructure/assemblers/user.assembler.js';
import { mockLogin } from '../infrastructure/auth.mock.js';
import { ROLES } from '../../shared/presentation/constants/roles.constants.js';

const TOKEN_KEY    = 'gs_token';
const BRANCH_KEY   = 'gs_branch_id';
const BRANCH_NAME  = 'gs_branch_name';
const USER_KEY     = 'gs_user';
const _isMock      = import.meta.env.VITE_USE_MOCK === 'true';
const api = new IamApi();

export const useIamStore = defineStore('iam', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const currentUser   = ref(null);
    const token         = ref(localStorage.getItem(TOKEN_KEY) ?? null);
    const activeBranchId   = ref(localStorage.getItem(BRANCH_KEY) ?? null);
    const activeBranchName = ref(localStorage.getItem(BRANCH_NAME) ?? '');
    const isLoading     = ref(false);
    const error         = ref(null);

    // ── Rehidratar usuario desde localStorage al iniciar ──────────────
    _rehydrateUser();

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

    /**
     * Persiste el usuario en localStorage como JSON serializado.
     * Se usa para rehidratar currentUser tras un refresh de página.
     */
    function _setUser(user) {
        currentUser.value = user;
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify({
                id: user.id, username: user.username, email: user.email,
                nombres: user.nombres, apellidos: user.apellidos,
                tipoDocumento: user.tipoDocumento, numeroDocumento: user.numeroDocumento,
                telefono: user.telefono, roles: user.roles, isActive: user.isActive,
                empresaId: user.empresaId, sucursalId: user.sucursalId, sucursalNombre: user.sucursalNombre,
            }));
        } else {
            localStorage.removeItem(USER_KEY);
        }
    }

    /**
     * Intenta recuperar el usuario desde localStorage.
     * Se llama al inicializar el store (refresh de página).
     * Si existe token pero no hay usuario guardado, el guard redirigirá a sign-in.
     */
    function _rehydrateUser() {
        if (currentUser.value) return; // ya cargado
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            currentUser.value = UserAssembler.toEntityFromResource(parsed);
        } catch {
            localStorage.removeItem(USER_KEY);
        }
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
        _setUser(null);
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
            // Si mock está habilitado, intentar mock primero para evitar esperar timeout de API
            if (_isMock) {
                try {
                    const mockResponse = mockLogin(credentials);
                    _setToken(mockResponse.token);
                    _setUser(UserAssembler.toEntityFromResource(mockResponse.user));
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
            const response = await api.login(credentials);
            const { token: jwt, user } = response.data;
            _setToken(jwt);
            _setUser(UserAssembler.toEntityFromResource(user ?? response.data));
            if (currentUser.value.sucursalId) {
                _setBranch(currentUser.value.sucursalId, currentUser.value.sucursalNombre);
            }
            return true;
        } catch (err) {
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
        _clearSession();
        // Si mock está habilitado, no esperar al backend
        if (_isMock) return;
        isLoading.value = true;
        try {
            await api.logout();
        } catch { /* ignorar error de logout en backend */ }
        finally {
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
