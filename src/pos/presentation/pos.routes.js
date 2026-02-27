const posTerminal = () => import('./views/pos-terminal.vue');

const posRoutes = [
    {
        path: '',
        name: 'pos-terminal',
        component: posTerminal,
        meta: {
            title: 'Punto de Venta',
        },
    },
];

export default posRoutes;
