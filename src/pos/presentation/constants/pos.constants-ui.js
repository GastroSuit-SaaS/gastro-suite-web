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
    ORDER:       '/pos/order',
    PAYMENT:     '/pos/payment',
};

/**
 * Helper para construir la ruta de la orden de una venta.
 * @param {number|string} saleId
 * @returns {string}
 */
export function posOrderRoute(saleId) {
    return `/pos/order/${saleId}`;
}

export function posPaymentRoute(saleId) {
    return `/pos/payment/${saleId}`;
}

/** Plano de mesas dentro del flujo POS (`/pos/tables`). */
export function posTablesRoute({ zoneId = null } = {}) {
    const query = {};
    if (zoneId != null && zoneId !== '' && zoneId !== '__all__') {
        query.zone = String(zoneId);
    }
    return { name: 'pos-tables', query };
}

export { formatTableLabel } from '../../../tables/presentation/constants/tables.constants-ui.js';

export const PAYMENT_METHODS = [
    { key: 'cash', label: 'Efectivo', icon: 'pi-money-bill',  color: '#059669' },
    { key: 'card', label: 'Tarjeta',  icon: 'pi-credit-card', color: '#2563eb' },
    { key: 'yape', label: 'Yape',     icon: 'pi-mobile',      color: '#7c3aed' },
    { key: 'plin', label: 'Plin',     icon: 'pi-send',        color: '#0891b2' },
];

export const RECEIPT_TYPES = [
    { key: 'nota',    label: 'Ticket interno',       icon: 'pi-file',        color: '#6b7280' },
    { key: 'boleta',  label: 'Pre-cuenta (referencia)', icon: 'pi-file-export', color: '#2563eb' },
    { key: 'factura', label: 'Datos cliente (referencia)', icon: 'pi-building',    color: '#7c3aed' },
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
