const posTerminal = () => import('./views/pos-terminal.vue');

const posRoutes = [
    {
        path: '',
        name: 'pos-terminal',
        component: posTerminal,
        meta: {
            title: 'Punto de Venta',
            titleModule: 'Terminal de ventas',
            description: 'Terminal de ventas y gestión de pedidos',
            showBackButton: false,
        },
    },
];

export default posRoutes;
