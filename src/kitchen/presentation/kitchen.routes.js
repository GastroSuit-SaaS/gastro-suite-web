const kitchenDisplay = () => import('./views/kitchen-display.vue');

const kitchenRoutes = [
    {
        path: '',
        name: 'kitchen-display',
        component: kitchenDisplay,
        meta: {
            title: 'Cocina',
            titleModule: 'Display de cocina',
            description: 'Gestión y seguimiento de órdenes en cocina',
            showBackButton: false,
        },
    },
];

export default kitchenRoutes;
