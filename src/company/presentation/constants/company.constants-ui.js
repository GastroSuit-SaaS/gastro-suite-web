export const COMPANY_MESSAGES = Object.freeze({
    SETTINGS_TITLE: 'Datos de la empresa',
    SETTINGS_DESCRIPTION: 'Actualiza la información de contacto visible para tu equipo.',
    SUBSCRIPTION_TITLE: 'Mi plan',
    SUBSCRIPTION_DESCRIPTION: 'Elige el plan que mejor se adapte a tu operación y consulta tu consumo frente a los límites.',
    SUBSCRIPTION_SELF_SERVICE_HINT:
        'Selecciona un plan comercial para activar módulos y límites. Puedes cambiar de plan cuando lo necesites; '
        + 'el cobro automático se habilitará en una fase posterior.',
    SAVE_SUCCESS: 'Datos guardados correctamente.',
    PLAN_CHOOSE_SUCCESS: 'Plan activado correctamente.',
    PLAN_CHOOSE_CONFIRM: '¿Activar este plan para tu empresa?',
    NO_PLANS_CATALOG: 'Aún no hay planes publicados. Contacta a soporte de Metasoft Solutions.',
    GRACE_BANNER:
        'Tu suscripción venció. Tienes 3 días de gracia antes del bloqueo total. '
        + 'Renueva eligiendo un plan o contacta a soporte.',
    NO_SUBSCRIPTION:
        'Aún no tienes un plan activo. Elige uno de los planes disponibles para habilitar módulos y límites.',
    BRANCH_USAGE_HINT: 'Mesas y platos del menú se muestran para la sucursal activa.',
    NO_BRANCH_SELECTED: 'Selecciona una sucursal para ver el uso de mesas y menú.',
    IDENTITY_READONLY: 'Estos datos fiscales provienen del registro inicial y no se editan desde aquí.',
    EDIT_SECTION_TITLE: 'Información editable',
    EDIT_SECTION_HINT: 'Visible para tu equipo en la operación diaria.',
});

export const BILLING_PERIOD_OPTIONS = Object.freeze([
    { value: 'MENSUAL', label: 'Mensual' },
    { value: 'ANUAL', label: 'Anual' },
]);

export const PLAN_MARKETING = Object.freeze({
    'Gastro Local': 'POS, caja y menú simple. Ideal para mostrador.',
    'Gastro Salón': 'Salón completo con cocina, reservas y reportes.',
    'Gastro Control': 'Inventario, comparación dashboard y exportación Excel.',
    'Gastro Cadena': 'Multi-sucursal con límites ampliados para cadenas.',
});

export const ACCESS_STATE_LABELS = Object.freeze({
    ACTIVE: { label: 'Activa', severity: 'success' },
    GRACE: { label: 'Periodo de gracia', severity: 'warn' },
    EXPIRED: { label: 'Vencida', severity: 'danger' },
    NONE: { label: 'Sin plan', severity: 'secondary' },
});

export const SUBSCRIPTION_TYPE_LABELS = Object.freeze({
    DIARIO: 'Diario',
    SEMANAL: 'Semanal',
    MENSUAL: 'Mensual',
    TRIMESTRAL: 'Trimestral',
    SEMESTRAL: 'Semestral',
    ANUAL: 'Anual',
});

export const USAGE_METRICS = Object.freeze([
    { key: 'branches', label: 'Sucursales', limitKey: 'maxBranches', usageKey: 'branches' },
    { key: 'users', label: 'Usuarios', limitKey: 'maxUsers', usageKey: 'users' },
    { key: 'tables', label: 'Mesas (sucursal)', limitKey: 'maxTables', usageKey: 'tablesInBranch' },
    { key: 'menu', label: 'Platos menú (sucursal)', limitKey: 'maxMenuItems', usageKey: 'menuItemsInBranch' },
]);

export const PLAN_FEATURES = Object.freeze([
    { key: 'hasInventory', label: 'Inventario' },
    { key: 'hasReports', label: 'Reportes completos' },
    { key: 'allowDailySalesReport', label: 'Ventas diarias' },
    { key: 'hasReservations', label: 'Reservas' },
    { key: 'hasKitchen', label: 'Cocina y estaciones' },
    { key: 'hasDashboardComparison', label: 'Comparación dashboard' },
    { key: 'hasExcelExport', label: 'Exportación Excel' },
    { key: 'hasPushNotifications', label: 'Notificaciones push' },
]);

/** Indica si un módulo del plan está activo según el objeto `features` del BFF. */
export function isPlanFeatureEnabled(key, features) {
    if (!features) return false;
    if (key === 'hasReports') return features.hasReports === true;
    if (key === 'allowDailySalesReport') {
        return features.allowDailySalesReport === true && features.hasReports !== true;
    }
    return features[key] === true;
}
