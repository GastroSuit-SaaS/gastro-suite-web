/**

 * Variables VITE_* centralizadas (se inyectan en build time con Vite).

 * En producción, definir VITE_PLATFORM_API_URL en Railway/CI antes de `npm run build`.

 */



const DEV_PLATFORM_API = 'http://localhost:8080/api/v1';

/** Fallback si el build CI no inyecta VITE_* (debe preferirse .env.production en el repo). */
const PRODUCTION_API_FALLBACK = 'https://gastro-api-preprod-production-1ece.up.railway.app/api/v1';



/** Valor crudo de VITE_* (sin default). */

function readEnvRaw(key) {

    const value = import.meta.env[key];

    if (value !== undefined && value !== '') return String(value).trim();

    return null;

}



/** Valor de VITE_* o default (paths relativos y desarrollo). */

function readEnv(key, defaultValue = '') {

    return readEnvRaw(key) ?? defaultValue;

}



/**

 * Normaliza la base REST: sin barra final y aviso si falta /api/v1.

 * @param {string} url

 */

function normalizePlatformApiUrl(url) {

    const normalized = url.replace(/\/+$/, '');

    if (import.meta.env.PROD && !normalized.endsWith('/api/v1')) {

        console.warn(

            '[GastroSuite] VITE_PLATFORM_API_URL debería terminar en /api/v1. Valor actual:',

            normalized,

        );

    }

    return normalized;

}



export function getPlatformApiUrl() {

    const configured = readEnvRaw('VITE_PLATFORM_API_URL');



    if (import.meta.env.PROD) {

        if (!configured) {

            console.warn(

                '[GastroSuite] VITE_PLATFORM_API_URL no está en el build. '

                + 'Usa .env.production o variables en Cloudflare Pages. Fallback API preprod.',

            );

            return normalizePlatformApiUrl(PRODUCTION_API_FALLBACK);

        }

        return normalizePlatformApiUrl(configured);

    }



    return normalizePlatformApiUrl(configured ?? DEV_PLATFORM_API);

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


