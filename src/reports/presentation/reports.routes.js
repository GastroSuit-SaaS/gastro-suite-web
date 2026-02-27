const reportsView = () => import('./views/reports-view.vue');

const reportsRoutes = [
    {
        path: '/reports',
        name: 'reports',
        component: reportsView,
        meta: {
            title: 'Reportes',
        },
    },
];

export default reportsRoutes;
