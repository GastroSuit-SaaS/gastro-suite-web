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
  SALES: '/pos/sales',
  PRODUCTS: '/pos/products',
  CART: '/pos/cart',
};

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
