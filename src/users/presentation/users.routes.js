const usersView = () => import('./views/users-view.vue');

const usersRoutes = [
    {
        path: '/users',
        name: 'users',
        component: usersView,
        meta: {
            title: 'Usuarios',
        },
    },
];

export default usersRoutes;
