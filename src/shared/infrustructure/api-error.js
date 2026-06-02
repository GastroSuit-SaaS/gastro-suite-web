/**
 * Mensaje legible desde respuestas Axios (ProblemDetail RFC 7807).
 * @param {import('axios').AxiosError|Error} err
 * @param {string} fallback
 * @returns {string}
 */
const FIELD_LABELS = {
    companyRuc: 'RUC',
    companyName: 'Razón social',
    companyTradeName: 'Nombre comercial',
    companyAddress: 'Dirección fiscal',
    'company.companyRuc': 'RUC',
    'company.companyName': 'Razón social',
    'company.companyTradeName': 'Nombre comercial',
    'company.companyAddress': 'Dirección fiscal',
    username: 'Nombre de usuario',
    password: 'Contraseña',
    nombres: 'Nombres',
    apellidos: 'Apellidos',
    email: 'Correo electrónico',
    tipoDocumento: 'Tipo de documento',
    numeroDocumento: 'Número de documento',
    telefono: 'Teléfono',
    'user.username': 'Nombre de usuario',
    'user.password': 'Contraseña',
    'user.nombres': 'Nombres',
    'user.apellidos': 'Apellidos',
    'user.email': 'Correo electrónico',
    'user.tipoDocumento': 'Tipo de documento',
    'user.numeroDocumento': 'Número de documento',
    'user.telefono': 'Teléfono',
    branchId: 'Sucursal',
    categoryId: 'Categoría',
    categoryName: 'Nombre de la categoría',
    categoryDescription: 'Descripción de la categoría',
    categoryColor: 'Color de la categoría',
    categorySortOrder: 'Orden de la categoría (debe ser mayor que 0)',
    isActive: 'Estado activo',
    itemName: 'Nombre del producto',
    itemDescription: 'Descripción del producto',
    itemPrice: 'Precio',
    itemPrepTime: 'Tiempo de preparación',
    skuCode: 'SKU',
    stationId: 'Estación',
    tableNumber: 'Identificador de mesa',
    zoneId: 'Zona',
};

function formatValidationErrors(data) {
    const params = data?.invalid_params;
    if (!Array.isArray(params) || params.length === 0) return null;
    return params
        .map((p) => {
            const field = p.field ?? p.name ?? 'Campo';
            const label = FIELD_LABELS[field] ?? field;
            const msg = p.message ?? p.reason ?? 'valor inválido';
            return `${label}: ${msg}`;
        })
        .join('. ');
}

/**
 * Código de negocio del API (ProblemDetail property "code").
 * @param {import('axios').AxiosError|Error} err
 * @returns {string|null}
 */
export function getApiErrorCode(err) {
    const data = err?.response?.data;
    if (!data || typeof data !== 'object') return null;
    return data.code ?? data.errorCode ?? null;
}

/**
 * Paso de negocio del API (p. ej. COMPANY, USER en registro OWNER).
 * @param {import('axios').AxiosError|Error} err
 * @returns {string|null}
 */
export function getApiErrorStep(err) {
    const data = err?.response?.data;
    if (!data || typeof data !== 'object') return null;
    const step = data.step;
    return typeof step === 'string' ? step : null;
}

export function getApiErrorMessage(err, fallback = 'Ocurrió un error. Intenta nuevamente.') {
    const data = err?.response?.data;
    if (!data) return err?.message ?? fallback;
    if (typeof data === 'string') return data;

    const validationMsg = formatValidationErrors(data);
    if (validationMsg) return validationMsg;

    return (
        data.detail
        ?? data.message
        ?? data.title
        ?? (Array.isArray(data.errors) ? data.errors[0] : null)
        ?? fallback
    );
}
