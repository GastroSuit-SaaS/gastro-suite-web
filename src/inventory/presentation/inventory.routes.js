const inventoryManagement = () => import('./views/inventory-management.vue');

const inventoryRoutes = [
    {
        path: '',
        name: 'inventory-management',
        component: inventoryManagement,
        meta: {
            title: 'Inventario',
        },
    },
];

export default inventoryRoutes;
