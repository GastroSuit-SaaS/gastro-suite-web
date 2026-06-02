const posTerminal      = () => import('./views/pos-terminal.vue');
const posZoneSelector  = () => import('./views/pos-zone-selector.vue');
const posTableSelector = () => import('./views/pos-table-selector.vue');
const posOrder         = () => import('./views/pos-order.vue');
const posPayment       = () => import('./views/pos-payment.vue');

const posRoutes = [
    {
        path: '',
        name: 'pos-terminal',
        component: posTerminal,
        meta: {
            title: 'Punto de Venta',
            titleModule: 'Punto de venta',
            description: 'Seleccione una mesa u orden para comenzar a tomar pedidos y procesar ventas',
            showBackButton: false,
        },
    },
    {
        path: 'select-zone',
        name: 'pos-select-zone',
        component: posZoneSelector,
        meta: {
            title: 'Seleccionar Mesa para Orden',
            titleModule: 'Punto de venta',
            description: 'Elija la zona y luego la mesa para tomar la orden',
            showBackButton: true,
            backRoute: { name: 'pos-terminal' },
        },
    },
    {
        path: 'select-zone/:zoneId',
        name: 'pos-select-table',
        component: posTableSelector,
        meta: {
            title: 'Seleccionar Mesa para Orden',
            titleModule: 'Punto de venta',
            description: 'Elija la mesa para tomar la orden',
            showBackButton: true,
            backRoute: { name: 'pos-terminal' },
        },
    },
    {
        path: 'order/:saleId',
        name: 'pos-order',
        component: posOrder,
        meta: {
            title: 'Orden',
            titleModule: 'Punto de venta',
            description: 'Agregue productos, envíe a cocina y procese el cobro',
            showBackButton: true,
            backRoute: { name: 'pos-terminal' },
        },
    },
    {
        path: 'payment/:saleId',
        name: 'pos-payment',
        component: posPayment,
        meta: {
            title: 'Procesar Pago',
            titleModule: 'Punto de venta',
            description: 'Seleccione el método de pago y tipo de comprobante',
            showBackButton: true,
        },
    },
];

export default posRoutes;
