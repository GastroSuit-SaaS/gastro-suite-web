const dashboardHome = () => import('./views/dashboard-home.vue');

const dashboardRoutes = [
    {
        path: '',
        name: 'dashboard-home',
        component: dashboardHome,
        meta: {
            title: 'Dashboard',
        },
    },
];

export default dashboardRoutes;
