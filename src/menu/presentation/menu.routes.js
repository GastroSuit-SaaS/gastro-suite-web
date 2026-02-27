const menuManagement = () => import('./views/menu-management.vue');

const menuRoutes = [
    {
        path: '',
        name: 'menu-management',
        component: menuManagement,
        meta: {
            title: 'Menú',
        },
    },
];

export default menuRoutes;
