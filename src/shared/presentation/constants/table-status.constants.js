/**
 * Shared Presentation - Table Status UI Constants
 *
 * Configuración visual de los estados de mesa.
 * Compartida entre los módulos Tables y POS.
 * NO contiene lógica de negocio.
 */
export const TABLE_STATUS_CONFIG = {
    available: { label: 'Disponible', color: '#059669', bg: 'rgba(16,185,129,0.08)', border: null,      icon: 'pi-check-circle'      },
    occupied:  { label: 'Ocupada',    color: '#dc2626', bg: 'rgba(239,68,68,0.08)',  border: '#ef4444', icon: 'pi-exclamation-circle' },
    cleaning:  { label: 'Limpieza',   color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', icon: 'pi-refresh'            },
    reserved:  { label: 'Reservada',  color: '#7c3aed', bg: 'rgba(139,92,246,0.08)', border: '#8b5cf6', icon: 'pi-calendar'           },
};
