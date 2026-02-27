import {createRouter, createWebHistory} from "vue-router";
import iamRoutes        from "../iam/presentation/iam.routes.js";
import tablesRoutes     from "../tables/presentation/tables.routes.js";
import dashboardRoutes  from "../dashboard/presentation/dashboard.routes.js";
import inventoryRoutes  from "../inventory/presentation/inventory.routes.js";
import kitchenRoutes    from "../kitchen/presentation/kitchen.routes.js";
import paymentsRoutes   from "../payments/presentation/payments.routes.js";
import posRoutes        from "../pos/presentation/pos.routes.js";
import reportsRoutes    from "../reports/presentation/reports.routes.js";
import usersRoutes      from "../users/presentation/users.routes.js";
//import { authenticationGuard } from "../iam/infrastructure/authentication.guard.js";

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
        path: '/inventory',
        component: layout,
        children: inventoryRoutes,
        meta: { title: 'Inventario' },
    },
    {
        path: '/kitchen',
        component: layout,
        children: kitchenRoutes,
        meta: { title: 'Cocina' },
    },
    {
        path: '/payments',
        component: layout,
        children: paymentsRoutes,
        meta: { title: 'Pagos' },
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

    /*
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: pageNotFound,
        meta: { title: 'Página no encontrada' }
    }
    */

];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes
});


router.beforeEach((to, from, next) => {
    console.log(`Navigating from ${from.name} to ${to.name}`);
    let baseTitle = 'GastroSuite';
    document.title = to.meta.title ? `${to.meta.title} | ${baseTitle}` : baseTitle;
    next();
    // Call authentication guard
    //authenticationGuard(to, from, next);
});

export default router;