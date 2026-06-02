export const CASH_REGISTER_ROUTES = {
    HOME: '/cash-register',
};

export const CASH_REGISTER_LABELS = {
    TITLE:            'Caja',
    SUBTITLE:         'Control de caja, turnos y rendición',
    NEW_MOVEMENT:     'Nuevo Movimiento',
    INCOME:           'Ingreso',
    EXPENSE:          'Egreso',
    BALANCE:          'Balance',
    OPEN_SESSION:     'Abrir Turno',
    CLOSE_SESSION:    'Cerrar Turno',
    SESSION_OPEN:     'Turno Abierto',
    SESSION_CLOSED:   'Turno Cerrado',
    NO_SESSION:       'Sin turno abierto',
    INITIAL_AMOUNT:   'Monto Inicial',
    FINAL_AMOUNT:     'Monto Final',
    HISTORY:          'Historial de Turnos',
    MOVEMENTS:        'Movimientos',
    SHIFT_NAME:       'Nombre del Turno',
    COUNTED_AMOUNT:   'Efectivo Contado',
    EXPECTED_CASH:    'Efectivo Esperado',
    DIFFERENCE:       'Diferencia',
    CASH_SALES:       'Ventas Efectivo',
    DIGITAL_SALES:    'Ventas Digitales',
    TOTAL_REVENUE:    'Ventas Totales',
    TOTAL_SALES:      'N° Ventas',
    SUMMARY:          'Resumen del Turno',
    CASH_COUNT:       'Conteo de Caja',
    ORDER:            'Orden',
    PAYMENT_METHOD:   'Método',
    DETAIL:           'Detalle',
    COLLECTED_BY:     'Cobrado por',
    VIEW_PAYMENT:     'Ver pago',
    TIPS:             'Propinas',
    REFUNDS:          'Reembolsos',
    EXPORT_EXCEL:     'Exportar Excel',
    SEARCH:           'Buscar',
    FILTER_CATEGORY:  'CATEGORÍA',
    FILTER_TYPE:      'TIPO',
    FILTER_METHOD:    'MÉTODO',
    CLEAR_FILTERS:    'Limpiar filtros',
    ALL:              'Todos',
    CARD_SALES:       'Tarjeta',
    YAPE_SALES:       'Yape',
    PLIN_SALES:       'Plin',
    SHIFT_SUMMARY:    'Resumen del turno',
    MOVEMENTS_LOG:    'Registro de movimientos',
    DIGITAL_BREAKDOWN:'Desglose digital',
    CASH_IN_DRAWER:   'Efectivo en gaveta',
    NO_OPEN_HINT:     'No hay turno abierto. Abre uno para registrar cobros y movimientos, o revisa el historial.',
    SHOW_SHIFT_DETAIL:'Ver resumen del turno',
    HIDE_SHIFT_DETAIL:'Ocultar resumen',
};

/** Sin opción «todas»; el placeholder del select indica el filtro. */
export const MOVEMENT_FILTER_CATEGORY_OPTIONS = [
    { label: 'Apertura', value: 'apertura' },
    { label: 'Venta efectivo', value: 'venta' },
    { label: 'Venta digital', value: 'venta_digital' },
    { label: 'Propina', value: 'PROPIA' },
    { label: 'Reembolso', value: 'reembolso' },
    { label: 'Depósito', value: 'deposito' },
    { label: 'Retiro', value: 'retiro' },
    { label: 'Compra', value: 'compra' },
    { label: 'Otro', value: 'otro' },
];

export const MOVEMENT_FILTER_TYPE_OPTIONS = [
    { label: 'Ingreso', value: 'income' },
    { label: 'Egreso', value: 'expense' },
];

export const MOVEMENT_FILTER_METHOD_OPTIONS = [
    { label: 'Efectivo', value: 'cash' },
    { label: 'Tarjeta', value: 'card' },
    { label: 'Yape', value: 'yape' },
    { label: 'Plin', value: 'plin' },
];

export const SESSION_STATUS_CONFIG = {
    open:   { label: 'Abierto', icon: 'pi pi-lock-open', severity: 'success' },
    closed: { label: 'Cerrado', icon: 'pi pi-lock',      severity: 'secondary' },
};

export const MOVEMENT_TYPE_CONFIG = {
    income:  { label: 'Ingreso', icon: 'pi pi-arrow-down-left', color: 'text-green-400' },
    expense: { label: 'Egreso',  icon: 'pi pi-arrow-up-right',  color: 'text-red-400' },
};

export const MOVEMENT_CATEGORY_CONFIG = {
    apertura:       { label: 'Apertura',       icon: 'pi pi-lock-open',  color: 'text-blue-400' },
    venta:          { label: 'Venta Efectivo',  icon: 'pi pi-dollar',     color: 'text-green-400' },
    venta_digital:  { label: 'Venta Digital',   icon: 'pi pi-mobile',     color: 'text-purple-400' },
    reembolso:      { label: 'Reembolso',     icon: 'pi pi-undo',       color: 'text-red-400' },
    compra:         { label: 'Compra',          icon: 'pi pi-shopping-cart', color: 'text-orange-400' },
    retiro:         { label: 'Retiro',          icon: 'pi pi-sign-out',   color: 'text-red-400' },
    deposito:       { label: 'Depósito',        icon: 'pi pi-sign-in',    color: 'text-teal-400' },
    cierre:         { label: 'Cierre',          icon: 'pi pi-lock',       color: 'text-gray-400' },
    PROPIA:         { label: 'Propina',         icon: 'pi pi-heart',      color: 'text-pink-400' },
    otro:           { label: 'Otro',            icon: 'pi pi-ellipsis-h', color: 'text-gray-400' },
};

export const MOVEMENT_CATEGORY_OPTIONS = [
    { label: 'Venta',       value: 'venta' },
    { label: 'Compra',      value: 'compra' },
    { label: 'Retiro',      value: 'retiro' },
    { label: 'Depósito',    value: 'deposito' },
    { label: 'Otro',        value: 'otro' },
];

export const SHIFT_NAME_OPTIONS = [
    { label: 'Mañana',   value: 'Mañana' },
    { label: 'Tarde',    value: 'Tarde' },
    { label: 'Noche',    value: 'Noche' },
    { label: 'Completo', value: 'Completo' },
];
