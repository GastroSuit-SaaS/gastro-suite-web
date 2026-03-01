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

export const TABLE_STATUS_CONFIG = {
    available: { label: 'Disponible', color: '#059669', bg: 'rgba(16,185,129,0.08)', border: null,      icon: 'pi-check-circle'       },
    occupied:  { label: 'Ocupada',    color: '#dc2626', bg: 'rgba(239,68,68,0.08)',  border: '#ef4444', icon: 'pi-exclamation-circle'  },
    cleaning:  { label: 'Limpieza',   color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', icon: 'pi-refresh'             },
    reserved:  { label: 'Reservada',  color: '#7c3aed', bg: 'rgba(139,92,246,0.08)', border: '#8b5cf6', icon: 'pi-calendar'            },
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
