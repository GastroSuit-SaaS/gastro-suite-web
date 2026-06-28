/**
 * Dashboard — contrato UI alineado con OperationalMetrics (backend BFF).
 */

export const DASHBOARD_TIMEZONE = 'America/Lima';

export const PAYMENT_METHOD_KEYS = Object.freeze(['cash', 'card', 'yape', 'plin']);

export const PAYMENT_METHOD_LABELS = Object.freeze({
    cash: 'Efectivo',
    card: 'Tarjeta',
    yape: 'Yape',
    plin: 'Plin',
});

export const PAYMENT_METHOD_ICONS = Object.freeze({
    cash: 'pi-money-bill',
    card: 'pi-credit-card',
    yape: 'pi-mobile',
    plin: 'pi-mobile',
});

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

export function buildPaymentMethodRows(byMethod, revenue) {
    return PAYMENT_METHOD_KEYS
        .map((method) => ({
            method,
            label: PAYMENT_METHOD_LABELS[method] ?? method,
            icon: PAYMENT_METHOD_ICONS[method] ?? 'pi-wallet',
            total: Number(byMethod?.[method] ?? 0),
        }))
        .filter((row) => row.total > 0)
        .sort((a, b) => b.total - a.total)
        .map((row) => ({
            ...row,
            share: revenue > 0 ? (row.total / revenue) * 100 : 0,
        }));
}

export function buildOperationalAlerts(metrics) {
    if (!metrics) return [];
    const alerts = [];
    if (!metrics.cashRegister.open) {
        alerts.push({
            severity: 'warn',
            icon: 'pi-wallet',
            message: 'No hay turno de caja abierto. Abre caja antes de cobrar en efectivo.',
        });
    }
    if (metrics.inventory.lowStockCount > 0) {
        alerts.push({
            severity: 'error',
            icon: 'pi-exclamation-triangle',
            message: `${metrics.inventory.lowStockCount} producto(s) de inventario en o bajo stock mínimo.`,
        });
    }
    if (metrics.kitchen.ready > 3) {
        alerts.push({
            severity: 'info',
            icon: 'pi-bell',
            message: `${metrics.kitchen.ready} pedido(s) listos en pass — priorizar entrega a mesa.`,
        });
    }
    if (metrics.diningRoom.activeOrders > 0 && metrics.kitchen.received + metrics.kitchen.preparing === 0) {
        alerts.push({
            severity: 'info',
            icon: 'pi-send',
            message: 'Hay comandas abiertas sin tickets en cocina. Revisa despacho al pass.',
        });
    }
    return alerts;
}
