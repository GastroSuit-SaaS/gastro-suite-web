const paymentsManagement = () => import('./views/payments-management.vue');

const paymentsRoutes = [
    {
        path: '',
        name: 'payments-management',
        component: paymentsManagement,
        meta: {
            title: 'Pagos',
            titleModule: 'Gestión de pagos',
            description: 'Gestión de pagos y transacciones',
            showBackButton: false,
        },
    },
];

export default paymentsRoutes;
