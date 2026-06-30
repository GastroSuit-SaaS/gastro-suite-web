const platformHome = () => import('./views/platform-home.vue');
const platformPlans = () => import('./views/platform-plans.vue');
const platformCompanies = () => import('./views/platform-companies.vue');
const platformAdmins = () => import('./views/platform-admins.vue');
const platformRequests = () => import('./views/platform-subscription-requests.vue');
const platformBootstrap = () => import('./views/platform-bootstrap.vue');
const platformAuditLog = () => import('./views/platform-audit-log.vue');

export const PLATFORM_ROUTES = Object.freeze({
    ROOT: '/platform',
    BOOTSTRAP: '/platform/bootstrap',
    REQUESTS: '/platform/requests',
});

const platformChildRoutes = [
    {
        path: '',
        name: 'platform-home',
        component: platformHome,
        meta: {
            title: 'Plataforma Metasoft',
            titleModule: 'Plataforma Metasoft',
            description: 'Gestión SaaS de Gastro Suite',
            requiresSystem: true,
        },
    },
    {
        path: 'requests',
        name: 'platform-requests',
        component: platformRequests,
        meta: {
            title: 'Solicitudes',
            titleModule: 'Solicitudes de suscripción',
            description: 'Validar pagos y activar o renovar contratos',
            requiresSystem: true,
        },
    },
    {
        path: 'plans',
        name: 'platform-plans',
        component: platformPlans,
        meta: {
            title: 'Planes',
            titleModule: 'Planes de suscripción',
            description: 'Catálogo comercial y límites por plan',
            requiresSystem: true,
        },
    },
    {
        path: 'companies',
        name: 'platform-companies',
        component: platformCompanies,
        meta: {
            title: 'Empresas',
            titleModule: 'Empresas cliente',
            description: 'Restaurantes registrados y estado de suscripción',
            requiresSystem: true,
        },
    },
    {
        path: 'admins',
        name: 'platform-admins',
        component: platformAdmins,
        meta: {
            title: 'Super admins',
            titleModule: 'Super administradores',
            description: 'Usuarios SYSTEM de Metasoft',
            requiresSystem: true,
        },
    },
    {
        path: 'audit',
        name: 'platform-audit',
        component: platformAuditLog,
        meta: {
            title: 'Auditoría',
            titleModule: 'Auditoría de plataforma',
            description: 'Trazabilidad de acciones de super admins',
            requiresSystem: true,
        },
    },
];

/** Rutas públicas de bootstrap — resolver en router/index.js con apiEnv. */
export function buildPlatformBootstrapRoutes(platformBootstrapEnabled) {
    return platformBootstrapEnabled
        ? [{
            path: PLATFORM_ROUTES.BOOTSTRAP,
            name: 'platform-bootstrap',
            component: platformBootstrap,
            meta: { title: 'Bootstrap', requiresAuth: false },
        }]
        : [];
}

/** Rutas hijas bajo layout.vue — el padre se registra en router/index.js */
export const platformLayoutChildren = platformChildRoutes;

export default buildPlatformBootstrapRoutes(false);
