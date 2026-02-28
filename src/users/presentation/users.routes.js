const usersManagement = () => import('./views/users-management.vue');

const usersRoutes = [
    {
        path: '',
        name: 'users-management',
        component: usersManagement,
        meta: {
            title: 'Usuarios',
            titleModule: 'Gestión de usuarios',
            description: 'Gestión de usuarios y roles del sistema',
            showBackButton: false,
        },
    },
];

export default usersRoutes;
