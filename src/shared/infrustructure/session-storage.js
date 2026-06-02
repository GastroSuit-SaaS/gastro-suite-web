import { clearAllReadCaches } from './offline/read-cache.js';
import { clearOutbox } from './offline/outbox-storage.js';

/** Claves de sesión en localStorage (IAM + BaseApi + stores). */
export const SESSION_KEYS = Object.freeze({
    TOKEN: 'gs_token',
    BRANCH_ID: 'gs_branch_id',
    BRANCH_NAME: 'gs_branch_name',
    USER: 'gs_user',
});

/** Solo JWT, usuario y sucursal activa. */
export function clearSessionStorage() {
    Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key));
}

/**
 * Limpia todo lo persistido de GastroSuite en localStorage al cerrar sesión o 401.
 */
export function clearAllAppLocalStorage() {
    clearSessionStorage();
    clearAllReadCaches();
    clearOutbox();
}
