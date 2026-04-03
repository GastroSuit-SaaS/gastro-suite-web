import { useIamStore } from '../application/iam.store.js';
import { IAM_ROUTES } from '../presentation/iam.routes.js';
import { hasRouteAccess, requiresBranch } from '../../shared/presentation/constants/roles.constants.js';

/** Rutas que no requieren autenticación */
const PUBLIC_PATHS = [
    IAM_ROUTES.SIGN_IN,
    IAM_ROUTES.SIGN_UP,
    IAM_ROUTES.FORGOT_PASSWORD,
    IAM_ROUTES.RESET_PASSWORD,
];

/**
 * Guard de autenticación global para Vue Router.
 *
 * Lógica:
 *   1. Rutas públicas → siempre permite.
 *   2. Sin token → redirige a /sign-in.
 *   3. Con token + ruta protegida:
 *      a. Verifica acceso por rol (si hay usuario cargado).
 *      b. Si la ruta requiere sucursal y no hay sucursal activa → /select-branch.
 *   4. Si ya está autenticado e intenta ir a /sign-in → /dashboard.
 */
export function authenticationGuard(to, from, next) {
    const iamStore = useIamStore();
    const isPublic = PUBLIC_PATHS.includes(to.path);

    if (isPublic) {
        if (to.path === IAM_ROUTES.SIGN_IN && iamStore.isAuthenticated) {
            return next('/dashboard'); 
        }
        return next();
    }

    // /select-branch siempre accesible si está autenticado
    if (to.path === '/select-branch') {
        if (!iamStore.isAuthenticated) {
            return next({ path: IAM_ROUTES.SIGN_IN, query: { redirect: to.fullPath } });
        }
        return next();
    }

    if (!iamStore.isAuthenticated) {
        return next({ path: IAM_ROUTES.SIGN_IN, query: { redirect: to.fullPath } });
    }

    // Si hay token pero no hay usuario cargado (localStorage corrupto o borrado),
    // limpiar sesión y redirigir a login
    if (!iamStore.currentUser) {
        iamStore.logout();
        return next({ path: IAM_ROUTES.SIGN_IN, query: { redirect: to.fullPath } });
    }

    // Verificar acceso por rol (solo si el usuario está cargado)
    const role = iamStore.userRole;
    if (role && !hasRouteAccess(role, to.path)) {
        return next('/dashboard');
    }

    // Verificar si la ruta requiere sucursal activa
    if (requiresBranch(to.path) && !iamStore.hasBranchSelected) {
        // OWNER sin sucursal → seleccionar primero
        if (iamStore.isOwner) {
            return next({ path: '/select-branch', query: { redirect: to.fullPath } });
        }
        // Rol operativo sin sucursal (error de datos) → dashboard
        return next('/dashboard');
    }

    next();
}
