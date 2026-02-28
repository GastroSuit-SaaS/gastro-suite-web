const menuManagement = () => import('./views/menu-management.vue');

const menuRoutes = [
    {
        path: '',
        name: 'menu-management',
        component: menuManagement,
        meta: {
            title: 'Menú',
            titleModule: 'Menú del restaurante',
            description: 'Gestión de platos y categorías del menú',
            showBackButton: false,
        },
    },
];

export default menuRoutes;
