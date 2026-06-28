export const COMPANY_MESSAGES = Object.freeze({
    SETTINGS_TITLE: 'Datos de la empresa',
    SETTINGS_DESCRIPTION: 'Actualiza la información de contacto visible para tu equipo.',
    SUBSCRIPTION_TITLE: 'Mi plan',
    SUBSCRIPTION_DESCRIPTION: 'Elige el plan que mejor se adapte a tu operación y consulta tu consumo frente a los límites.',
    SUBSCRIPTION_SELF_SERVICE_HINT:
        'Para cambiar de plan o renovar, elige uno del catálogo y envía la referencia de pago. Metasoft validará manualmente la operación.',
    SUBSCRIPTION_ACTIVE_BANNER:
        'Tu plan está activo. El equipo de GastroSuite & Metasoft Solutions está disponible para ayudarte con tu operación.',
    SAVE_SUCCESS: 'Datos guardados correctamente.',
    PLAN_CHOOSE_SUCCESS: 'Solicitud enviada. Metasoft validará tu pago antes de activar el plan.',
    PLAN_RENEW_SUCCESS: 'Solicitud de renovación enviada. Metasoft validará tu pago antes de extender la suscripción.',
    PLAN_CHOOSE_CONFIRM: '¿Enviar solicitud de contrato para este plan?',
    PLAN_RENEW_CONFIRM: '¿Enviar solicitud de renovación para este plan?',
    PAYMENT_REFERENCE_LABEL: 'Referencia de pago',
    PAYMENT_REFERENCE_HINT: 'Número de operación, voucher o transferencia (obligatorio).',
    OWNER_NOTES_LABEL: 'Comentarios (opcional)',
    PENDING_REQUEST_BANNER:
        'Tienes una solicitud pendiente de validación por Metasoft. No puedes enviar otra hasta que sea aprobada o rechazada.',
    PENDING_REQUEST_DETAIL: 'Plan solicitado',
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
