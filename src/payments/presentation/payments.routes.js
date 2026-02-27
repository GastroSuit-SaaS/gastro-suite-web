const paymentsManagement = () => import('./views/payments-management.vue');

const paymentsRoutes = [
    {
        path: '',
        name: 'payments-management',
        component: paymentsManagement,
        meta: {
            title: 'Pagos',
        },
    },
];

export default paymentsRoutes;
