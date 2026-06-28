import { useIamStore } from '../application/iam.store.js';
import { IAM_ROUTES } from '../presentation/iam.routes.js';
import { PLATFORM_ROUTES } from '../../platform/presentation/platform.routes.js';
import { hasRouteAccess, requiresBranch, ROLES } from '../../shared/presentation/constants/roles.constants.js';
import { isRouteAllowedByPlan, resolvePlanEntitlements } from '../../shared/presentation/constants/subscription-entitlements.constants.js';
import { useCompanyStore } from '../../company/application/company.store.js';
import { SESSION_KEYS } from '../../shared/infrustructure/session-storage.js';

/** Rutas que no requieren autenticación */
const PUBLIC_PATHS = [
    IAM_ROUTES.SIGN_IN,
    IAM_ROUTES.SIGN_UP,
    IAM_ROUTES.FORGOT_PASSWORD,
    IAM_ROUTES.RESET_PASSWORD,
    PLATFORM_ROUTES.BOOTSTRAP,
];

/**
 * Guard de autenticación global para Vue Router.
 *
 * Lógica:
 *   1. Rutas públicas → siempre permite.
 *   2. Sin token → redirige a /sign-in.
 *   3. Con token + ruta protegida:
 *      a. Verifica acceso por rol (si hay usuario cargado).
 *      b. Si la ruta requiere sucursal y no hay sucursal activa → /select-branch (OWNER) o /dashboard.
 *   4. Si ya está autenticado e intenta ir a /sign-in → /dashboard.
 */
export async function authenticationGuard(to, from, next) {
    const iamStore = useIamStore();
    const isPublic = PUBLIC_PATHS.includes(to.path);

    if (isPublic) {
        if (to.path === IAM_ROUTES.SIGN_IN) {
            iamStore.clearAuthError();
            const staleToken = !!localStorage.getItem(SESSION_KEYS.TOKEN);
            if (staleToken && !iamStore.currentUser) {
                iamStore.logout();
            }
            if (iamStore.isAuthenticated) {
                return next(iamStore.isSystem ? '/platform' : '/dashboard');
            }
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

    // SYSTEM no usa flujo operativo de sucursal
    if (role === ROLES.SYSTEM && !to.path.startsWith('/platform')) {
        return next('/platform');
    }

    if (role && !hasRouteAccess(role, to.path)) {
        return next('/dashboard');
    }

    // Plan SaaS — bloquear rutas no incluidas en el plan activo
    if (role && role !== ROLES.SYSTEM) {
        const companyStore = useCompanyStore();
        if (!companyStore.subscriptionFetchAttempted) {
            try {
                await companyStore.fetchSubscriptionSummary();
            } catch {
                /* entitlements restrictivos vía resolvePlanEntitlements */
            }
        }
        const entitlements = resolvePlanEntitlements(
            companyStore.subscriptionSummary,
            companyStore.features,
        );
        if (!isRouteAllowedByPlan(to.path, entitlements)) {
            return next('/dashboard');
        }
    }

    // Verificar si la ruta requiere sucursal activa (operación POS, menú, etc.)
    if (requiresBranch(to.path) && !iamStore.hasBranchSelected) {
        if (iamStore.isOwner) {
            return next({ path: '/select-branch', query: { redirect: to.fullPath } });
        }
        return next('/dashboard');
    }

    next();
}
