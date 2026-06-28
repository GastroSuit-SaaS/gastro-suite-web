/** Rutas premium y la feature del plan que las habilita (SAAS-PRICING-STRATEGY). */
export const SUBSCRIPTION_ROUTE_FEATURES = Object.freeze([
    { prefix: '/inventory', feature: 'hasInventory' },
    { prefix: '/stations', feature: 'hasKitchen' },
    { prefix: '/reports', feature: 'canAccessReports' },
    { prefix: '/tables/reservations', feature: 'hasReservations' },
]);

/** Entitlements restrictivos: sin plan cargado o sin módulo contratado. */
export const RESTRICTED_ENTITLEMENTS = Object.freeze({
    hasInventory: false,
    hasReports: false,
    allowDailySalesReport: false,
    hasReservations: false,
    hasKitchen: false,
    hasDashboardComparison: false,
    hasExcelExport: false,
    hasPushNotifications: false,
    canAccessReports: false,
});

/** Solo para entornos sin resumen de suscripción (evitar bloquear todo antes del fetch). */
export const DEFAULT_ENTITLEMENTS = Object.freeze({
    hasInventory: true,
    hasReports: true,
    allowDailySalesReport: true,
    hasReservations: true,
    hasKitchen: true,
    hasDashboardComparison: true,
    hasExcelExport: true,
    hasPushNotifications: true,
    canAccessReports: true,
});

export function normalizeEntitlements(raw) {
    if (raw == null) return { ...RESTRICTED_ENTITLEMENTS };
    const hasReports = raw.hasReports === true;
    const allowDaily = raw.allowDailySalesReport === true;
    return {
        hasInventory: raw.hasInventory === true,
        hasReports,
        allowDailySalesReport: allowDaily,
        hasReservations: raw.hasReservations === true,
        hasKitchen: raw.hasKitchen === true,
        hasDashboardComparison: raw.hasDashboardComparison === true,
        hasExcelExport: raw.hasExcelExport === true,
        hasPushNotifications: raw.hasPushNotifications === true,
        canAccessReports: hasReports || allowDaily,
    };
}

/**
 * Entitlements efectivos según si el resumen de suscripción ya se cargó.
 * Antes del fetch → restrictivo; después → flags del plan activo (o sin plan).
 */
export function resolvePlanEntitlements(subscriptionSummary, features) {
    if (!subscriptionSummary) return { ...RESTRICTED_ENTITLEMENTS };
    return normalizeEntitlements(features);
}

export function isRouteAllowedByPlan(path, entitlements) {
    const e = entitlements ?? RESTRICTED_ENTITLEMENTS;
    for (const rule of SUBSCRIPTION_ROUTE_FEATURES) {
        if (path.startsWith(rule.prefix) && !e[rule.feature]) {
            return false;
        }
    }
    return true;
}

export function normalizeReportTypeKey(type) {
    return String(type ?? '').toUpperCase().replace(/-/g, '_');
}

export function isReportTypeAllowed(type, entitlements) {
    const e = entitlements ?? RESTRICTED_ENTITLEMENTS;
    const key = normalizeReportTypeKey(type);
    if (key === 'DAILY_SALES') return e.allowDailySalesReport || e.hasReports;
    if (key === 'INVENTORY_STATUS') return e.hasInventory && e.hasReports;
    return e.hasReports;
}
