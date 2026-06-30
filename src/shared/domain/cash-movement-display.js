/**
 * Normaliza descripciones de movimientos de caja para UI (oculta UUIDs legacy).
 */

const UUID =
    '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/**
 * @param {string|null|undefined} description
 * @returns {string}
 */
export function formatCashMovementDescription(description) {
    if (!description) return ''
    let text = String(description)

    text = text.replace(new RegExp(`Venta\\s+${UUID}`, 'gi'), 'Venta')
    text = text.replace(/Venta\s+Orden\s+#(\d+)/gi, 'Venta Orden #$1')
    text = text.replace(new RegExp(`Propina\\s+Venta\\s+${UUID}`, 'gi'), 'Propina — Venta')
    text = text.replace(new RegExp(`Reembolso pago\\s+${UUID}`, 'gi'), 'Reembolso')
    text = text.replace(/\bVenta\s+—/g, 'Venta —')
    text = text.replace(/\bPropina\s+—\s+Venta\b/g, 'Propina — Venta')

    return text.trim()
}
