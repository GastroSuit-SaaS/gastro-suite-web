const kitchenView = () => import('./views/kitchen-view.vue');

const kitchenRoutes = [
    {
        path: '/kitchen',
        name: 'kitchen',
        component: kitchenView,
        meta: {
            title: 'Cocina',
        },
    },
];

export default kitchenRoutes;
