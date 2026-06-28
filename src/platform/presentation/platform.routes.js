import { apiEnv } from '../../shared/infrustructure/env.js';

const platformLayout = () => import('./views/platform-layout.vue');
const platformHome = () => import('./views/platform-home.vue');
const platformPlans = () => import('./views/platform-plans.vue');
const platformCompanies = () => import('./views/platform-companies.vue');
const platformAdmins = () => import('./views/platform-admins.vue');
const platformBootstrap = () => import('./views/platform-bootstrap.vue');

export const PLATFORM_ROUTES = Object.freeze({
    ROOT: '/platform',
    BOOTSTRAP: '/platform/bootstrap',
});

const platformChildRoutes = [
    {
        path: '',
        name: 'platform-home',
        component: platformHome,
        meta: { title: 'Platform', requiresSystem: true },
    },
    {
        path: 'plans',
        name: 'platform-plans',
        component: platformPlans,
        meta: { title: 'Planes', requiresSystem: true },
    },
    {
        path: 'companies',
        name: 'platform-companies',
        component: platformCompanies,
        meta: { title: 'Empresas', requiresSystem: true },
    },
    {
        path: 'admins',
        name: 'platform-admins',
        component: platformAdmins,
        meta: { title: 'Admins', requiresSystem: true },
    },
];

const bootstrapRoute = apiEnv.platformBootstrapEnabled
    ? [{
        path: PLATFORM_ROUTES.BOOTSTRAP,
        name: 'platform-bootstrap',
        component: platformBootstrap,
        meta: { title: 'Bootstrap', requiresAuth: false },
    }]
    : [];

const platformRoute = apiEnv.platformEnabled
    ? [{
        path: PLATFORM_ROUTES.ROOT,
        component: platformLayout,
        children: platformChildRoutes,
        meta: { title: 'Platform', requiresSystem: true },
    }]
    : [];

export default [...bootstrapRoute, ...platformRoute];
