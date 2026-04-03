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
};

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
    compra:         { label: 'Compra',          icon: 'pi pi-shopping-cart', color: 'text-orange-400' },
    retiro:         { label: 'Retiro',          icon: 'pi pi-sign-out',   color: 'text-red-400' },
    deposito:       { label: 'Depósito',        icon: 'pi pi-sign-in',    color: 'text-teal-400' },
    cierre:         { label: 'Cierre',          icon: 'pi pi-lock',       color: 'text-gray-400' },
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
