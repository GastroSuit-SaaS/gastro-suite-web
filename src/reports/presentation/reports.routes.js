const reportsHome = () => import('./views/reports-home.vue');

const reportsRoutes = [
    {
        path: '',
        name: 'reports-home',
        component: reportsHome,
        meta: {
            title: 'Reportes',
            titleModule: 'Centro de reportes',
            description: 'Reportes y estadísticas del negocio',
            showBackButton: false,
        },
    },
];

export default reportsRoutes;
