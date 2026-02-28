const dashboardHome = () => import('./views/dashboard-home.vue');

const dashboardRoutes = [
    {
        path: '',
        name: 'dashboard-home',
        component: dashboardHome,
        meta: {
            title: 'Dashboard',
            titleModule: 'Panel principal',
            description: 'Panel de control y métricas del negocio',
            showBackButton: false,
        },
    },
];

export default dashboardRoutes;
