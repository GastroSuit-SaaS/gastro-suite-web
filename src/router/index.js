import {createRouter, createWebHistory} from "vue-router";
import iamRoutes from "../iam/presentation/iam.routes.js";
//import {authenticationGuard} from "./iam/infrastructure/authentication.guard.js";

const layout = () => import('../public/presentation/views/layout.vue');

const routes = [

    {
        path: '/',
        redirect: '/sign-in'
    },
    
    {
        path: '/sign-in',
        children: iamRoutes,
        meta: { title: 'Autenticación' }
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
    // Call authentication guard
    //authenticationGuard(to, from, next);
});

export default router;