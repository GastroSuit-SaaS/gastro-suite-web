const usersManagement = () => import('./views/users-management.vue');

const usersRoutes = [
    {
        path: '',
        name: 'users-management',
        component: usersManagement,
        meta: {
            title: 'Usuarios',
        },
    },
];

export default usersRoutes;
