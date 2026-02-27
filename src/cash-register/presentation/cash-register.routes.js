const cashRegisterHome = () => import('./views/cash-register-home.vue');

const cashRegisterRoutes = [
    {
        path: '',
        name: 'cash-register-home',
        component: cashRegisterHome,
        meta: {
            title: 'Caja',
        },
    },
];

export default cashRegisterRoutes;
