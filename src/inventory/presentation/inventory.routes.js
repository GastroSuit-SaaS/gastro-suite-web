const inventoryView = () => import('./views/inventory-view.vue');

const inventoryRoutes = [
    {
        path: '/inventory',
        name: 'inventory',
        component: inventoryView,
        meta: {
            title: 'Inventario',
        },
    },
];

export default inventoryRoutes;
