/**
 * Inventory Presentation - UI Constants
 * 
 * Constantes relacionadas con la presentación del módulo Inventory.
 * NO contienen lógica de negocio.
 * 
 * Ejemplos:
 * - Labels de columnas
 * - Estados de stock (visuales)
 * - Mensajes de UI
 */

export const INVENTORY_ROUTES = {
  PRODUCTS: '/inventory/products',
  CATEGORIES: '/inventory/categories',
  SUPPLIERS: '/inventory/suppliers',
  STOCK_MOVEMENTS: '/inventory/movements',
};

export const INVENTORY_LABELS = {
  PRODUCT_NAME: 'Nombre del Producto',
  SKU: 'SKU',
  STOCK: 'Stock',
  PRICE: 'Precio',
  CATEGORY: 'Categoría',
  SUPPLIER: 'Proveedor',
  ADD_PRODUCT: 'Agregar Producto',
  EDIT_PRODUCT: 'Editar Producto',
  DELETE_PRODUCT: 'Eliminar Producto',
};

export const STOCK_STATUS_LABELS = {
  IN_STOCK: 'En Stock',
  LOW_STOCK: 'Stock Bajo',
  OUT_OF_STOCK: 'Sin Stock',
};

export const STOCK_STATUS_COLORS = {
  IN_STOCK: '#00CC66',
  LOW_STOCK: '#FFA500',
  OUT_OF_STOCK: '#CC0000',
};

export const INVENTORY_MESSAGES = {
  PRODUCT_CREATED: 'Producto creado correctamente',
  PRODUCT_UPDATED: 'Producto actualizado correctamente',
  PRODUCT_DELETED: 'Producto eliminado correctamente',
  STOCK_UPDATED: 'Stock actualizado correctamente',
  ERROR_LOADING: 'Error al cargar productos',
};
