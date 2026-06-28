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
  MANAGEMENT: '/tables',
  RESERVATIONS: '/tables/reservations',
};

/** Evita duplicar prefijo "Mesa" cuando number ya lo incluye. */
export function formatTableLabel(number) {
    if (number == null || number === '') return '—';
    const value = String(number).trim();
    return /^mesa\b/i.test(value) ? value : `Mesa ${value}`;
}

// Re-exportado desde shared para mantener compatibilidad y consistencia entre módulos
export { TABLE_STATUS_CONFIG } from '../../../shared/presentation/constants/table-status.constants.js';

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
