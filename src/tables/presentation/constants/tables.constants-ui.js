/**
 * Tables Presentation - UI Constants
 * 
 * Constantes relacionadas con la presentación del módulo Tables.
 * NO contienen lógica de negocio.
 * 
 * Ejemplos:
 * - Labels de estados de mesa
 * - Colores de estados
 * - Configuración de layout
 */

export const TABLES_ROUTES = {
  LAYOUT: '/tables/layout',
  RESERVATIONS: '/tables/reservations',
};

export const TABLE_STATUS_LABELS = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  RESERVED: 'Reservada',
  CLEANING: 'En Limpieza',
};

export const TABLE_STATUS_COLORS = {
  AVAILABLE: '#00CC66',
  OCCUPIED: '#CC0000',
  RESERVED: '#FFA500',
  CLEANING: '#0066CC',
};

export const TABLES_MESSAGES = {
  ASSIGN_SUCCESS: 'Mesa asignada correctamente',
  RELEASE_SUCCESS: 'Mesa liberada correctamente',
  RESERVE_SUCCESS: 'Reserva creada correctamente',
};
