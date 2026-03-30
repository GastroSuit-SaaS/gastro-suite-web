const stationsManagement = () => import('./views/stations-management.vue');

const stationsRoutes = [
    {
        path: '',
        name: 'stations-management',
        component: stationsManagement,
        meta: {
            title: 'Estaciones',
            titleModule: 'Estaciones de Preparación',
            description: 'Gestión de estaciones y seguimiento de pedidos',
            showBackButton: false,
        },
    },
];

export default stationsRoutes;
