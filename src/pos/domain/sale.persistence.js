/** Reglas de persistencia de identificadores de venta (sin dependencias de capas externas). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @param {string|number|null|undefined} id */
export function isPersistedSaleId(id) {
    if (id == null) return false;
    if (typeof id === 'number' && id < 0) return false;
    return UUID_RE.test(String(id).trim());
}
