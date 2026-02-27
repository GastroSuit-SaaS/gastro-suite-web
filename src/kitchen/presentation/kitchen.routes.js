const kitchenDisplay = () => import('./views/kitchen-display.vue');

const kitchenRoutes = [
    {
        path: '',
        name: 'kitchen-display',
        component: kitchenDisplay,
        meta: {
            title: 'Cocina',
        },
    },
];

export default kitchenRoutes;
