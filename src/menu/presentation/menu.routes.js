const menuManagement = () => import('./views/menu-management.vue');

const menuRoutes = [
    {
        path: '',
        name: 'menu-management',
        component: menuManagement,
        meta: {
            title: 'Menú',
            titleModule: 'Menú del restaurante',
            description: 'Administre categorías y productos de la carta',
            showBackButton: false,
        },
    },
];

export default menuRoutes;
