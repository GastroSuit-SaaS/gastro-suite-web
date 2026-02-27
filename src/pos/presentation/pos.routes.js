const posView = () => import('./views/pos-view.vue');

const posRoutes = [
    {
        path: '/pos',
        name: 'pos',
        component: posView,
        meta: {
            title: 'Punto de Venta',
        },
    },
];

export default posRoutes;
