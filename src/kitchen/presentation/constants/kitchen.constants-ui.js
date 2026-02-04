/**
 * Kitchen Presentation - UI Constants
 * 
 * Constantes relacionadas con la presentación del módulo Kitchen.
 * NO contienen lógica de negocio.
 * 
 * Ejemplos:
 * - Labels de estados de orden
 * - Colores de UI
 * - Configuración de componentes
 */

export const KITCHEN_ROUTES = {
  ORDERS: '/kitchen/orders',
  STATIONS: '/kitchen/stations',
};

export const KITCHEN_ORDER_STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Preparación',
  READY: 'Listo',
  DELIVERED: 'Entregado',
};

export const KITCHEN_ORDER_STATUS_COLORS = {
  PENDING: '#FFA500',
  IN_PROGRESS: '#0066CC',
  READY: '#00CC66',
  DELIVERED: '#666666',
};
