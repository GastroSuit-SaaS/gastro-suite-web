import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { IamApi } from '../infrastructure/api/iam.api.js';
import { UserAssembler } from '../infrastructure/assemblers/user.assembler.js';
import { RegistrationAssembler } from '../infrastructure/assemblers/registration.assembler.js';
import { User } from '../domain/models/user.entity.js';
import { SESSION_KEYS, clearAllAppLocalStorage } from '../../shared/infrustructure/session-storage.js';
import { getApiErrorMessage, getApiErrorCode } from '../../shared/infrustructure/api-error.js';
import { appLogger } from '../../shared/infrustructure/app-logger.js';
import { logRegisterFailure, resolveRegisterErrorMessage } from '../infrastructure/register-error.js';
import { clearSignUpDraft } from '../infrastructure/sign-up-draft.js';
import { resetOperationalSocketClient } from '../../shared/infrustructure/realtime/operational-socket.js';
import { resetApplicationStores } from '../../shared/application/reset-application-stores.js';

const api = new IamApi();

export const useIamStore = defineStore('iam', () => {

    const currentUser   = ref(null);
    const token         = ref(localStorage.getItem(SESSION_KEYS.TOKEN) ?? null);
    const activeBranchId   = ref(localStorage.getItem(SESSION_KEYS.BRANCH_ID) ?? null);
    const activeBranchName = ref(localStorage.getItem(SESSION_KEYS.BRANCH_NAME) ?? '');
    const isLoading     = ref(false);
    const error         = ref(null);
    /** linked | missing_company | error | idle */
    const employeeLinkStatus  = ref('idle');
    const employeeLinkMessage = ref(null);

    _rehydrateUser();

    /** Sesión válida solo con JWT y usuario rehidratado (evita token huérfano en localStorage). */
    const isAuthenticated = computed(() => !!token.value && !!currentUser.value);
    const userRole        = computed(() => currentUser.value?.primaryRole ?? '');
    const isOwner         = computed(() => currentUser.value?.isOwner ?? false);
    const hasBranchSelected = computed(() => !!activeBranchId.value);
    const companyId       = computed(() => currentUser.value?.empresaId ?? null);

    function _setToken(jwt) {
        token.value = jwt;
        if (jwt) localStorage.setItem(SESSION_KEYS.TOKEN, jwt);
        else     localStorage.removeItem(SESSION_KEYS.TOKEN);
    }

    function _setUser(user) {
        currentUser.value = user;
        if (user) {
            localStorage.setItem(SESSION_KEYS.USER, JSON.stringify({
                id: user.id, username: user.username, email: user.email,
                nombres: user.nombres, apellidos: user.apellidos,
                tipoDocumento: user.tipoDocumento, numeroDocumento: user.numeroDocumento,
                telefono: user.telefono, roles: user.roles, isActive: user.isActive,
                empresaId: user.empresaId, sucursalId: user.sucursalId, sucursalNombre: user.sucursalNombre,
                employeeId: user.employeeId,
            }));
        } else {
            localStorage.removeItem(SESSION_KEYS.USER);
        }
    }

    function _rehydrateUser() {
        if (currentUser.value) return;
        const raw = localStorage.getItem(SESSION_KEYS.USER);
        if (!raw) return;
        try {
            currentUser.value = UserAssembler.toEntityFromResource(JSON.parse(raw));
        } catch {
            localStorage.removeItem(SESSION_KEYS.USER);
        }
    }

    function _setBranch(branchId, branchName = '') {
        activeBranchId.value   = branchId;
        activeBranchName.value = branchName;
        if (branchId) {
            localStorage.setItem(SESSION_KEYS.BRANCH_ID, branchId);
            localStorage.setItem(SESSION_KEYS.BRANCH_NAME, branchName);
        } else {
            localStorage.removeItem(SESSION_KEYS.BRANCH_ID);
            localStorage.removeItem(SESSION_KEYS.BRANCH_NAME);
        }
    }

    function _clearSession() {
        _setUser(null);
        _setToken(null);
        _setBranch(null);
        employeeLinkStatus.value  = 'idle';
        employeeLinkMessage.value = null;
        resetApplicationStores();
        clearAllAppLocalStorage();
        clearSignUpDraft();
    }

    async function signIn(credentials) {
        isLoading.value = true;
        error.value     = null;
        try {
            const response = await api.signIn(credentials);
            const data = response.data;
            const jwt = data?.token;
            if (!jwt) {
                throw new Error('El servidor no devolvió un token de sesión.');
            }

            _setToken(jwt);
            const user = UserAssembler.toEntityFromSignInResponse(data);
            _setUser(user);

            if (user.sucursalId) {
                _setBranch(user.sucursalId, user.sucursalNombre);
            }
            await ensureEmployeeLink();
            return true;
        } catch (err) {
            const status = err?.response?.status;
            const code = getApiErrorCode(err);
            const invalidCredentials = status === 401
                || (status === 400 && code === 'USR_ERROR');
            error.value = invalidCredentials
                ? 'Usuario o contraseña incorrectos.'
                : getApiErrorMessage(
                    err,
                    'No se pudo iniciar sesión. Verifica tus credenciales e intenta de nuevo.'
                );
            _clearSession();
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    function clearAuthError() {
        error.value = null;
    }

    async function logout() {
        error.value = null;
        resetOperationalSocketClient();
        _clearSession();
    }

    async function selectBranch(branchId, branchName = '') {
        _setBranch(branchId, branchName);
        if (token.value && currentUser.value) {
            await ensureEmployeeLink();
        }
    }

    function clearBranch() {
        _setBranch(null);
    }

    /**
     * Garantiza vínculo empleado ↔ usuario (OWNER/admin sin registro previo).
     * Actualiza currentUser con employeeId para caja y cobros.
     */
    async function ensureEmployeeLink() {
        if (!token.value || !currentUser.value) {
            employeeLinkStatus.value = 'idle';
            return { ok: false, reason: 'no_session' };
        }
        if (currentUser.value.employeeId) {
            employeeLinkStatus.value  = 'linked';
            employeeLinkMessage.value = null;
            return { ok: true };
        }

        const empresaId = currentUser.value.empresaId ?? companyId.value;
        if (!empresaId) {
            employeeLinkStatus.value  = 'missing_company';
            employeeLinkMessage.value = 'Tu usuario no tiene empresa asociada. No se pueden registrar cobros, movimientos de caja ni inventario.';
            return { ok: false, reason: 'missing_company' };
        }

        try {
            const response = await api.ensureEmployeeLink({
                companyId: empresaId,
                branchId:    activeBranchId.value ?? currentUser.value.sucursalId ?? null,
                nombres:     currentUser.value.nombres || undefined,
                apellidos:   currentUser.value.apellidos || undefined,
                email:       currentUser.value.email || undefined,
            });
            const data = response.data;
            if (data?.employeeId) {
                _setUser(UserAssembler.toEntityFromSignInResponse({
                    ...data,
                    token: token.value,
                }));
                employeeLinkStatus.value  = 'linked';
                employeeLinkMessage.value = null;
                return { ok: true };
            }
            employeeLinkStatus.value  = 'error';
            employeeLinkMessage.value = 'No se pudo vincular tu usuario con un empleado.';
            return { ok: false, reason: 'no_employee_id' };
        } catch (err) {
            employeeLinkStatus.value  = 'error';
            employeeLinkMessage.value = getApiErrorMessage(
                err,
                'No se pudo vincular tu usuario con un empleado. Reintenta o contacta al administrador.',
            );
            return { ok: false, reason: 'api_error' };
        }
    }

    /**
     * Onboarding OWNER atómico: POST /auth/register-owner
     * (empresa + usuario + empleado + sesión; rollback en servidor si falla un paso).
     * @param {{ empresa: import('../domain/models/empresa-registration.vo.js').EmpresaRegistration, usuario: import('../domain/models/usuario-registration.vo.js').UsuarioRegistration }} payload
     */
    async function register(payload) {
        isLoading.value = true;
        error.value     = null;
        const empresa = payload?.empresa ?? {};
        const usuario = payload?.usuario ?? {};

        try {
            appLogger.info('IAM:Register', 'Iniciando registro OWNER', {
                ruc: empresa.ruc ? `${String(empresa.ruc).slice(0, 4)}***` : undefined,
                username: usuario.username,
            });

            const response = await api.registerOwner(
                RegistrationAssembler.toRegisterOwnerRequest(empresa, usuario),
            );
            const data = response.data;
            const jwt = data?.token;
            if (!jwt) {
                throw new Error('El servidor no devolvió un token de sesión.');
            }

            _setToken(jwt);
            const user = UserAssembler.toEntityFromSignInResponse(data);
            _setUser(new User({
                ...user,
                email: usuario.email || user.email,
                nombres: usuario.nombres || user.nombres,
                apellidos: usuario.apellidos || user.apellidos,
                tipoDocumento: usuario.tipoDocumento || user.tipoDocumento,
                numeroDocumento: usuario.numeroDocumento || user.numeroDocumento,
                telefono: usuario.telefono || user.telefono,
            }));

            appLogger.info('IAM:Register', 'Registro completado', {
                userId: user.id,
                companyId: user.empresaId,
            });
            return true;
        } catch (err) {
            logRegisterFailure(err, { username: usuario.username, ruc: empresa.ruc });
            error.value = resolveRegisterErrorMessage(err);
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function forgotPassword() {
        error.value = 'Recuperación de contraseña aún no está disponible en el API.';
        return false;
    }

    return {
        currentUser, token, isLoading, error,
        isAuthenticated, userRole, isOwner, hasBranchSelected, companyId,
        activeBranchId, activeBranchName,
        signIn, logout, clearAuthError, register, forgotPassword,
        selectBranch, clearBranch, ensureEmployeeLink,
        employeeLinkStatus, employeeLinkMessage,
    };
});
