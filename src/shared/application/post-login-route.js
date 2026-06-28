import { ROLES } from '../presentation/constants/roles.constants.js';

/**
 * Ruta inicial tras login según rol operativo (SaaS restaurante).
 * OWNER va directo al dashboard (elige sucursal ahí, no en paso previo).
 * @param {string} role
 * @returns {string}
 */
export function resolvePostLoginPath(role) {
    if (role === ROLES.SYSTEM) {
        return '/platform';
    }
    if (role === ROLES.CASHIER || role === ROLES.BRANCH_ADMIN) {
        return '/cash-register';
    }
    return '/dashboard';
}
