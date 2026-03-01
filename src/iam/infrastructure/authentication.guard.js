import { useIamStore } from '../application/iam.store.js';
import { IAM_ROUTES } from '../presentation/iam.routes.js';

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
 * Uso en router/index.js:
 *   import { authenticationGuard } from '../iam/infrastructure/authentication.guard.js'
 *   router.beforeEach(authenticationGuard)
 *
 * Lógica:
 *   - Rutas públicas → siempre permite.
 *   - Rutas protegidas + sin token → redirige a /sign-in.
 *   - Rutas protegidas + con token → permite.
 *   - Si el usuario ya está autenticado e intenta ir a /sign-in → redirige al dashboard.
 */
export function authenticationGuard(to, from, next) {
    const iamStore = useIamStore();
    const isPublic = PUBLIC_PATHS.includes(to.path);

    if (isPublic) {
        // Si ya está autenticado y va a sign-in, redirigir al dashboard
        if (to.path === IAM_ROUTES.SIGN_IN && iamStore.isAuthenticated) {
            return next('/dashboard');
        }
        return next();
    }

    if (!iamStore.isAuthenticated) {
        return next({ path: IAM_ROUTES.SIGN_IN, query: { redirect: to.fullPath } });
    }

    next();
}
