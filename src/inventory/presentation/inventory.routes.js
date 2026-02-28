const inventoryManagement = () => import('./views/inventory-management.vue');

const inventoryRoutes = [
    {
        path: '',
        name: 'inventory-management',
        component: inventoryManagement,
        meta: {
            title: 'Inventario',
            titleModule: 'Gestión de inventario',
            description: 'Gestión de productos y stock',
            showBackButton: false,
        },
    },
];

export default inventoryRoutes;
