import {createRouter, createWebHistory} from "vue-router";
import iamRoutes from "../iam/presentation/iam.routes.js";
import tablesRoutes from "../tables/presentation/tables.routes.js"; 
//import {authenticationGuard} from "./iam/infrastructure/authentication.guard.js";

const layout = () => import('../public/presentation/views/layout.vue');

const routes = [

    {
        path: '/',
        redirect: '/sign-in'
    },
    
    // IAM Routes - Rutas expandidas del módulo
    ...iamRoutes,

    {
        path: '/tables',
        component: layout,
        children: tablesRoutes,
        meta: { title: 'Tables' }
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