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
    {
        path: 'comparison',
        redirect: (to) => ({
            name: 'dashboard-home',
            query: { ...to.query, compare: to.query.compare ?? 'yesterday' },
        }),
    },
];

export default dashboardRoutes;
