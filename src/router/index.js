import {createRouter, createWebHistory} from "vue-router";
import iamRoutes            from "../iam/presentation/iam.routes.js";
import tablesRoutes         from "../tables/presentation/tables.routes.js";
import dashboardRoutes      from "../dashboard/presentation/dashboard.routes.js";
import inventoryRoutes      from "../inventory/presentation/inventory.routes.js";
import stationsRoutes       from "../stations/presentation/stations.routes.js";
import paymentsRoutes       from "../payments/presentation/payments.routes.js";
import posRoutes            from "../pos/presentation/pos.routes.js";
import reportsRoutes        from "../reports/presentation/reports.routes.js";
import usersRoutes          from "../users/presentation/users.routes.js";
import menuRoutes           from "../menu/presentation/menu.routes.js";
import cashRegisterRoutes   from "../cash-register/presentation/cash-register.routes.js";
import branchesRoutes       from "../branches/presentation/branches.routes.js";
import { authenticationGuard } from "../iam/infrastructure/authentication.guard.js";

const layout = () => import('../public/presentation/views/layout.vue');

const routes = [

    {
        path: '/',
        redirect: '/sign-in'
    },

    // IAM Routes (public – no layout wrapper)
    ...iamRoutes,

    // Protected routes – wrapped in the main layout
    {
        path: '/dashboard',
        component: layout,
        children: dashboardRoutes,
        meta: { title: 'Dashboard' },
    },
    {
        path: '/tables',
        component: layout,
        children: tablesRoutes,
        meta: { title: 'Mesas' },
    },
    {
        path: '/menu',
        component: layout,
        children: menuRoutes,
        meta: { title: 'Menú' },
    },
    {
        path: '/inventory',
        component: layout,
        children: inventoryRoutes,
        meta: { title: 'Inventario' },
    },
    {
        path: '/stations',
        component: layout,
        children: stationsRoutes,
        meta: { title: 'Estaciones' },
    },
    {
        path: '/payments',
        component: layout,
        children: paymentsRoutes,
        meta: { title: 'Pagos' },
    },
    {
        path: '/cash-register',
        component: layout,
        children: cashRegisterRoutes,
        meta: { title: 'Caja' },
    },
    {
        path: '/pos',
        component: layout,
        children: posRoutes,
        meta: { title: 'Punto de Venta' },
    },
    {
        path: '/reports',
        component: layout,
        children: reportsRoutes,
        meta: { title: 'Reportes' },
    },
    {
        path: '/users',
        component: layout,
        children: usersRoutes,
        meta: { title: 'Usuarios' },
    },
    {
        path: '/branches',
        component: layout,
        children: branchesRoutes,
        meta: { title: 'Sucursales' },
    },
    {
        path: '/select-branch',
        name: 'select-branch',
        component: () => import('../branches/presentation/views/select-branch.vue'),
        meta: { title: 'Seleccionar Sucursal' },
    },

    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('../shared/presentation/views/page-not-found.vue'),
        meta: { title: 'Página no encontrada' }
    },

];

const router = createRouter({
    history: createWebHistory (),
    routes: routes
});


router.beforeEach((to, from, next) => {
    let baseTitle = 'GastroSuite';
    document.title = to.meta.title ? `${to.meta.title} | ${baseTitle}` : baseTitle;
    authenticationGuard(to, from, next);
});

export default router;