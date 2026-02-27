const reportsHome = () => import('./views/reports-home.vue');

const reportsRoutes = [
    {
        path: '',
        name: 'reports-home',
        component: reportsHome,
        meta: {
            title: 'Reportes',
        },
    },
];

export default reportsRoutes;
