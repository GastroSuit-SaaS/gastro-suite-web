const paymentsView = () => import('./views/payments-view.vue');

const paymentsRoutes = [
    {
        path: '/payments',
        name: 'payments',
        component: paymentsView,
        meta: {
            title: 'Pagos',
        },
    },
];

export default paymentsRoutes;
