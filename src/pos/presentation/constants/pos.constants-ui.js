/**
 * POS Presentation - UI Constants
 * 
 * Constantes relacionadas con la presentación del módulo POS.
 * NO contienen lógica de negocio.
 * 
 * Ejemplos:
 * - Labels de botones
 * - Configuración de grid
 * - Mensajes de UI
 */

export const POS_ROUTES = {
    TERMINAL:    '/pos',
    SELECT_ZONE: '/pos/select-zone',
    ORDER:       '/pos/order',
    PAYMENT:     '/pos/payment',
};

/**
 * Helper para construir la ruta de selección de mesa por zona.
 * @param {number} zoneId
 * @returns {string}
 */
export function posSelectTableRoute(zoneId) {
    return `/pos/select-zone/${zoneId}`;
}

/**
 * Helper para construir la ruta de la orden de una mesa.
 * @param {number} tableId
 * @returns {string}
 */
export function posOrderRoute(tableId) {
    return `/pos/order/${tableId}`;
}

export function posPaymentRoute(tableId) {
    return `/pos/payment/${tableId}`;
}

export const PAYMENT_METHODS = [
    { key: 'cash', label: 'Efectivo', icon: 'pi-money-bill',  color: '#059669' },
    { key: 'card', label: 'Tarjeta',  icon: 'pi-credit-card', color: '#2563eb' },
    { key: 'yape', label: 'Yape',     icon: 'pi-mobile',      color: '#7c3aed' },
    { key: 'plin', label: 'Plin',     icon: 'pi-send',        color: '#0891b2' },
];

export const RECEIPT_TYPES = [
    { key: 'nota',    label: 'Nota de Venta',       icon: 'pi-file',        color: '#6b7280' },
    { key: 'boleta',  label: 'Boleta Electrónica',  icon: 'pi-file-export', color: '#2563eb' },
    { key: 'factura', label: 'Factura Electrónica', icon: 'pi-building',    color: '#7c3aed' },
];

export const POS_LABELS = {
  ADD_TO_CART: 'Agregar al Carrito',
  REMOVE_FROM_CART: 'Quitar',
  TOTAL: 'Total',
  SUBTOTAL: 'Subtotal',
  DISCOUNT: 'Descuento',
  PROCESS_SALE: 'Procesar Venta',
};

export const POS_MESSAGES = {
  SALE_SUCCESS: 'Venta procesada correctamente',
  SALE_ERROR: 'Error al procesar la venta',
  CART_EMPTY: 'El carrito está vacío',
};
