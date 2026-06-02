/**
 * Variables VITE_* centralizadas (se inyectan en build time con Vite).
 * En producción, definir todas en el servicio de deploy (Railway, etc.) antes de `npm run build`.
 */

const DEV_PLATFORM_API = 'http://localhost:8080/api/v1';

function readEnv(key, devFallback = '') {
    const value = import.meta.env[key];
    if (value !== undefined && value !== '') return value;
    if (import.meta.env.DEV) return devFallback;
    return '';
}

export function getPlatformApiUrl() {
    const url = readEnv('VITE_PLATFORM_API_URL', DEV_PLATFORM_API);
    if (!url && import.meta.env.PROD) {
        console.error(
            '[GastroSuite] Falta VITE_PLATFORM_API_URL en el build de producción. '
            + 'Configúrala en Railway/CI antes de ejecutar npm run build.',
        );
    }
    return url || DEV_PLATFORM_API;
}

export const apiEnv = Object.freeze({
    platformApiUrl: getPlatformApiUrl(),

    /** Auth IAM: sign-in, sign-up, ensure-employee (único prefijo público). */
    iam: readEnv('VITE_IAM_ENDPOINT', '/auth'),
    companies: readEnv('VITE_COMPANIES_ENDPOINT', '/companies'),

    branches: readEnv('VITE_BRANCHES_ENDPOINT', '/branches'),
    tables: readEnv('VITE_TABLES_ENDPOINT', '/tables'),
    zones: readEnv('VITE_ZONES_ENDPOINT', '/zones'),
    reservations: readEnv('VITE_RESERVATIONS_ENDPOINT', '/reservations'),

    menuItems: readEnv('VITE_MENU_ENDPOINT', '/menu-items'),
    menuCategories: readEnv('VITE_CATEGORIES_ENDPOINT', '/menu-categories'),

    posSales: readEnv('VITE_POS_ENDPOINT', '/pos/sales'),
    posTickets: readEnv('VITE_TICKETS_ENDPOINT', '/pos/tickets'),
    posOperationsConfig: readEnv('VITE_POS_OPERATIONS_CONFIG_ENDPOINT', '/pos/operations-config'),

    stations: readEnv('VITE_STATIONS_ENDPOINT', '/stations'),
    payments: readEnv('VITE_PAYMENTS_ENDPOINT', '/payments'),

    cashMovements: readEnv('VITE_CASH_REGISTER_ENDPOINT', '/cash-register/movements'),
    cashSessions: readEnv('VITE_CASH_REGISTER_SESSIONS_ENDPOINT', '/cash-register/sessions'),

    inventoryProducts: readEnv('VITE_INVENTORY_ENDPOINT', '/inventory/products'),
    inventoryCategories: readEnv('VITE_INVENTORY_CATEGORIES_ENDPOINT', '/inventory/categories'),
    inventoryMovements: readEnv('VITE_INVENTORY_MOVEMENTS_ENDPOINT', '/inventory/movements'),

    employees: readEnv('VITE_USERS_ENDPOINT', '/employees'),
    reports: readEnv('VITE_REPORTS_ENDPOINT', '/reports'),
    dashboard: readEnv('VITE_DASHBOARD_ENDPOINT', '/dashboard'),

    wsOperationalUrl: readEnv('VITE_WS_OPERATIONAL_URL', ''),
    posBillableRequiresSent: import.meta.env.VITE_POS_BILLABLE_REQUIRES_SENT !== 'false',
});
