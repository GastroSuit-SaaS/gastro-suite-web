import { clearAllReadCaches } from './offline/read-cache.js';
import { clearOutbox } from './offline/outbox-storage.js';

/** Claves de sesión en localStorage (IAM + BaseApi + stores). */
export const SESSION_KEYS = Object.freeze({
    TOKEN: 'gs_token',
    BRANCH_ID: 'gs_branch_id',
    BRANCH_NAME: 'gs_branch_name',
    USER: 'gs_user',
    LOGIN_REVEAL: 'gs_login_reveal',
    /** Sucursal solo para métricas del dashboard (OWNER); no afecta operación POS/caja. */
    DASHBOARD_VIEW_BRANCH: 'gs_dashboard_view_branch',
});

/** Solo JWT, usuario y sucursal activa operativa. */
export function clearSessionStorage() {
    Object.values(SESSION_KEYS).forEach((key) => {
        if (key === SESSION_KEYS.DASHBOARD_VIEW_BRANCH) return;
        localStorage.removeItem(key);
    });
    sessionStorage.removeItem(SESSION_KEYS.DASHBOARD_VIEW_BRANCH);
}

/**
 * Limpia todo lo persistido de GastroSuite en localStorage al cerrar sesión o 401.
 */
export function clearAllAppLocalStorage() {
    clearSessionStorage();
    clearAllReadCaches();
    clearOutbox();
}

/** Marca animación de entrada tras login exitoso. */
export function setLoginRevealPending() {
    sessionStorage.setItem(SESSION_KEYS.LOGIN_REVEAL, '1');
}

/** Consume la marca (una sola vez). */
export function consumeLoginRevealPending() {
    const pending = sessionStorage.getItem(SESSION_KEYS.LOGIN_REVEAL) === '1';
    if (pending) sessionStorage.removeItem(SESSION_KEYS.LOGIN_REVEAL);
    return pending;
}
