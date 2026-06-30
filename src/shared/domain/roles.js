/**
 * Reglas de roles y permisos de ruta (dominio transversal).
 */

export const ROLES = Object.freeze({
    SYSTEM:       'SYSTEM',
    OWNER:        'OWNER',
    BRANCH_ADMIN: 'BRANCH_ADMIN',
    WAITER:       'WAITER',
    CASHIER:      'CASHIER',
    COOK:         'COOK',
});

export const ROLE_ALLOWED_ROUTES = Object.freeze({
    [ROLES.SYSTEM]: [
        '/platform',
    ],
    [ROLES.OWNER]: [
        '/dashboard', '/tables', '/menu', '/pos', '/stations',
        '/payments', '/cash-register', '/inventory', '/reports',
        '/users', '/branches', '/company', '/select-branch',
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

export const BRANCH_REQUIRED_ROUTES = Object.freeze([
    '/tables', '/menu', '/pos', '/stations',
    '/payments', '/cash-register', '/inventory', '/reports',
]);

/**
 * @param {string} role
 * @param {string} path
 */
export function hasRouteAccess(role, path) {
    const allowed = ROLE_ALLOWED_ROUTES[role];
    if (!allowed) return false;
    return allowed.some(r => path.startsWith(r));
}

/**
 * @param {string} path
 */
export function requiresBranch(path) {
    return BRANCH_REQUIRED_ROUTES.some(r => path.startsWith(r));
}
