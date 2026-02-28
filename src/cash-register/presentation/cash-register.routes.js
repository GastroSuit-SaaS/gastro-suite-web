const cashRegisterHome = () => import('./views/cash-register-home.vue');

const cashRegisterRoutes = [
    {
        path: '',
        name: 'cash-register-home',
        component: cashRegisterHome,
        meta: {
            title: 'Caja',
            titleModule: 'Control de caja',
            description: 'Control de caja y movimientos de efectivo',
            showBackButton: false,
        },
    },
];

export default cashRegisterRoutes;
