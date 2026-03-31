/**
 * Shared Presentation — Role & Permission Constants
 *
 * Define los roles del sistema y los módulos/rutas a los que cada rol tiene acceso.
 * Usado por: layout (menú dinámico), auth guard, toolbar.
 */

export const ROLES = Object.freeze({
    OWNER:        'OWNER',
    BRANCH_ADMIN: 'BRANCH_ADMIN',
    WAITER:       'WAITER',
    CASHIER:      'CASHIER',
    COOK:         'COOK',
});

/**
 * Rutas base permitidas por rol.
 * El guard y el menú lateral filtran según esta tabla.
 *
 * OWNER ve todo. Los demás ven solo lo asignado.
 */
export const ROLE_ALLOWED_ROUTES = Object.freeze({
    [ROLES.OWNER]: [
        '/dashboard', '/tables', '/menu', '/pos', '/stations',
        '/payments', '/cash-register', '/inventory', '/reports',
        '/users', '/branches', '/select-branch',
    ],
    [ROLES.BRANCH_ADMIN]: [
        '/dashboard', '/tables', '/menu', '/pos', '/stations',
        '/payments', '/cash-register', '/inventory', '/reports', '/users',
    ],
    [ROLES.WAITER]: [
        '/dashboard', '/pos', '/tables',
    ],
    [ROLES.CASHIER]: [
        '/dashboard', '/pos', '/payments', '/cash-register',
    ],
    [ROLES.COOK]: [
        '/dashboard', '/stations',
    ],
});

/**
 * Rutas que requieren tener una sucursal activa seleccionada.
 * El OWNER puede acceder a /branches, /users, /dashboard sin sucursal.
 */
export const BRANCH_REQUIRED_ROUTES = Object.freeze([
    '/tables', '/menu', '/pos', '/stations',
    '/payments', '/cash-register', '/inventory', '/reports',
]);

/**
 * Verifica si un rol tiene acceso a una ruta.
 * @param {string} role
 * @param {string} path - Ruta base (e.g. '/pos')
 * @returns {boolean}
 */
export function hasRouteAccess(role, path) {
    const allowed = ROLE_ALLOWED_ROUTES[role];
    if (!allowed) return false;
    return allowed.some(r => path.startsWith(r));
}

/**
 * Verifica si una ruta requiere sucursal activa.
 * @param {string} path
 * @returns {boolean}
 */
export function requiresBranch(path) {
    return BRANCH_REQUIRED_ROUTES.some(r => path.startsWith(r));
}
