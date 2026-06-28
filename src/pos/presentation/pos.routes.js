const posTerminal   = () => import('./views/pos-terminal.vue');
const posTableFloor = () => import('./views/pos-table-floor.vue');
const posOrder        = () => import('./views/pos-order.vue');
const posPayment      = () => import('./views/pos-payment.vue');

const posRoutes = [
    {
        path: '',
        name: 'pos-terminal',
        component: posTerminal,
        meta: {
            title: 'Punto de Venta',
            titleModule: 'Punto de venta',
            description: 'Resumen operativo, órdenes activas y alertas del turno',
            showBackButton: false,
        },
    },
    {
        path: 'tables',
        name: 'pos-tables',
        component: posTableFloor,
        meta: {
            title: 'Seleccionar mesa',
            titleModule: 'Punto de venta',
            description: 'Elija la mesa para tomar la orden',
            showBackButton: true,
            backLabel: 'Volver al punto de venta',
            backRoute: { name: 'pos-terminal' },
        },
    },
    {
        path: 'select-zone',
        redirect: { name: 'pos-tables' },
    },
    {
        path: 'select-zone/:zoneId',
        redirect: (to) => ({
            name: 'pos-tables',
            query: { zone: to.params.zoneId },
        }),
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
