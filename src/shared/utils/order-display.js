/**
 * Etiquetas de orden para UI (nunca mostrar UUID de venta al usuario).
 */

export function formatSaleOrderLabel(saleDisplayNumber, _saleId = null) {
    if (saleDisplayNumber != null && saleDisplayNumber !== '') {
        return `Orden #${saleDisplayNumber}`;
    }
    return 'Orden —';
}

export function formatSaleOrderHash(saleDisplayNumber, _saleId = null) {
    if (saleDisplayNumber != null && saleDisplayNumber !== '') {
        return `#${saleDisplayNumber}`;
    }
    return '—';
}
