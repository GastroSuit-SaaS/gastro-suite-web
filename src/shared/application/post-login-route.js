import { ROLES } from '../presentation/constants/roles.constants.js';

/**
 * Ruta inicial tras login según rol operativo (SaaS restaurante).
 * @param {string} role
 * @param {boolean} hasBranch
 * @returns {string}
 */
export function resolvePostLoginPath(role, hasBranch) {
    if (role === ROLES.OWNER && !hasBranch) {
        return '/select-branch';
    }
    if (role === ROLES.CASHIER || role === ROLES.BRANCH_ADMIN) {
        return '/cash-register';
    }
    return '/dashboard';
}
