/**
 * Dashboard — contrato UI alineado con OperationalMetrics (backend BFF).
 */

import {
    PAYMENT_METHOD_KEYS,
    PAYMENT_METHOD_LABELS,
    PAYMENT_METHOD_ICONS,
} from '../../domain/dashboard-payment-methods.js';

export { PAYMENT_METHOD_KEYS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS };

export const DASHBOARD_TIMEZONE = 'America/Lima';

export const DASHBOARD_SECTIONS = Object.freeze({
    SALES: 'Ventas del turno',
    DINING_ROOM: 'Salón y servicio',
    KITCHEN: 'Cocina y bar',
    CASH_REGISTER: 'Caja',
    ALERTS: 'Atención operativa',
});

export const DASHBOARD_KPI_LABELS = Object.freeze({
    REVENUE: 'Ingresos cobrados',
    PAYMENTS: 'Comprobantes cobrados',
    AVG_TICKET: 'Ticket promedio',
    OCCUPIED: 'Mesas ocupadas',
    ACTIVE_ORDERS: 'Comandas abiertas',
    KITCHEN_READY: 'Platos listos',
    RESERVATIONS: 'Reservas del día',
    LOW_STOCK: 'Insumos bajo mínimo',
    CASH_CLOSED: 'Caja cerrada',
    CASH_OPEN: 'Efectivo en caja',
});

export const DASHBOARD_MESSAGES = Object.freeze({
    LOADING: 'Cargando operación del día...',
    ERROR: 'Error al cargar el dashboard',
    NO_PAYMENTS: 'Aún no hay cobros registrados hoy',
    NO_TOP_ITEMS: 'Sin ventas registradas para rankear productos',
    NO_STATIONS: 'Sin estaciones activas',
    SOURCE_API: 'Datos en tiempo real (servidor)',
    SOURCE_CLIENT: 'Datos locales (modo agregado)',
});

export const DASHBOARD_TABLE_STATUS_LABELS = Object.freeze({
    available: 'Libres',
    occupied: 'Ocupadas',
    reserved: 'Reservadas',
    cleaning: 'Limpieza',
});

export function formatBusinessDate(isoDate) {
    if (!isoDate) return 'Hoy';
    try {
        return new Date(`${isoDate}T12:00:00`).toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return isoDate;
    }
}

export function formatDashboardGreeting(firstName) {
    const hour = new Date().getHours();
    let saludo = 'Buen día';
    if (hour >= 19 || hour < 5) saludo = 'Buenas noches';
    else if (hour >= 12) saludo = 'Buenas tardes';
    const name = firstName?.trim();
    return name ? `${saludo}, ${name}` : saludo;
}
