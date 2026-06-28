import { paymentNetCollected } from '../../../payments/domain/payment-net.js';
import { SALE_STATUS } from '../../../pos/domain/models/sale.entity.js';

export const CHANNEL_KEYS = Object.freeze({
    SALON: 'salon',
    TAKEAWAY: 'takeaway',
    DELIVERY: 'delivery',
});

export const CHANNEL_META = Object.freeze({
    [CHANNEL_KEYS.SALON]: { label: 'Salón', color: '#7c5cfc' },
    [CHANNEL_KEYS.TAKEAWAY]: { label: 'Para llevar', color: '#22c55e' },
    [CHANNEL_KEYS.DELIVERY]: { label: 'Delivery', color: '#f59e0b' },
});

export function formatDashboardDateShort(isoDate) {
    if (!isoDate) {
        return new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
    }
    try {
        const d = new Date(`${isoDate}T12:00:00`);
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        const label = d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
        return isToday ? `Hoy, ${label}` : label;
    } catch {
        return isoDate;
    }
}

export function estimateCovers(diningRoom) {
    if (!diningRoom) return 0;
    const occupied = Number(diningRoom.occupiedTables ?? 0);
    const reserved = Number(diningRoom.reservedTables ?? 0);
    return occupied * 2 + reserved * 2;
}

export function buildHourlySalesSeries(payments = []) {
    const points = Array.from({ length: 24 }, (_, hour) => ({ hour, amount: 0 }));
    payments.forEach((payment) => {
        const date = payment.processedAt ? new Date(payment.processedAt) : null;
        if (!date || Number.isNaN(date.getTime())) return;
        points[date.getHours()].amount += paymentNetCollected(payment);
    });
    const max = Math.max(...points.map((p) => p.amount), 1);
    return points.map((p) => ({
        ...p,
        label: `${String(p.hour).padStart(2, '0')}:00`,
        normalized: p.amount / max,
    }));
}

export function buildChannelBreakdown(payments = [], revenue = 0) {
    const totals = {
        [CHANNEL_KEYS.SALON]: 0,
        [CHANNEL_KEYS.TAKEAWAY]: 0,
        [CHANNEL_KEYS.DELIVERY]: 0,
    };

    payments.forEach((payment) => {
        const amount = paymentNetCollected(payment);
        const zoneName = payment.zoneName ?? payment.zone_name ?? '';
        if (zoneName === 'Delivery') {
            totals[CHANNEL_KEYS.DELIVERY] += amount;
        } else if (payment.tableNumber != null && payment.tableNumber !== '') {
            totals[CHANNEL_KEYS.SALON] += amount;
        } else {
            totals[CHANNEL_KEYS.TAKEAWAY] += amount;
        }
    });

    const total = revenue > 0 ? revenue : Object.values(totals).reduce((s, v) => s + v, 0);

    return Object.entries(totals).map(([key, amount]) => ({
        key,
        label: CHANNEL_META[key].label,
        color: CHANNEL_META[key].color,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
    }));
}

export function buildDonutGradient(segments) {
    const active = segments.filter((s) => s.percent > 0);
    if (!active.length) return '#e5e7eb';
    let cursor = 0;
    const stops = active.map((segment) => {
        const start = cursor;
        cursor += segment.percent;
        return `${segment.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
}

export function buildTopProductsWithRevenue(topItems = [], revenue = 0) {
    const totalQty = topItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    return topItems.slice(0, 4).map((item, index) => {
        const quantity = Number(item.quantity ?? 0);
        const share = totalQty > 0 ? quantity / totalQty : 0;
        return {
            rank: index + 1,
            itemId: item.itemId,
            name: item.name ?? 'Producto',
            quantity,
            revenue: revenue > 0 ? revenue * share : 0,
        };
    });
}

export function buildRecentOrdersFromPayments(payments = [], limit = 4) {
    return [...payments]
        .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt))
        .slice(0, limit)
        .map((payment) => ({
            id: payment.saleDisplayNumber ?? payment.id,
            customer: payment.receiptData?.nombre
                || payment.receiptData?.razonSocial
                || payment.collectedByDisplayName
                || 'Cliente',
            status: 'completed',
            amount: paymentNetCollected(payment),
            location: payment.tableNumber != null
                ? `Salón ${payment.tableNumber}`
                : 'Para llevar',
            processedAt: payment.processedAt,
        }));
}

export function buildRecentOrdersFromSales(sales = [], limit = 4) {
    return [...sales]
        .filter((sale) => sale.status === SALE_STATUS.ACTIVE || sale.status === SALE_STATUS.PAID)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .map((sale) => ({
            id: sale.saleDisplayNumber ?? sale.id,
            customer: sale.customerName || 'Cliente',
            status: sale.status === SALE_STATUS.PAID ? 'completed' : 'preparing',
            amount: sale.total ?? 0,
            location: sale.tableId ? `Mesa ${sale.tableId}` : 'Para llevar',
            processedAt: sale.createdAt,
        }));
}

export function buildUpcomingReservations(reservations = [], limit = 4) {
    const now = Date.now();
    return [...reservations]
        .filter((r) => r.isActive)
        .sort((a, b) => new Date(a.reservedAt) - new Date(b.reservedAt))
        .filter((r) => new Date(r.reservedAt).getTime() >= now - 30 * 60 * 1000)
        .slice(0, limit)
        .map((r) => ({
            id: r.id,
            guestName: r.guestName || 'Reserva',
            partySize: r.partySize ?? 2,
            tableNumber: r.tableNumber,
            reservedAt: r.reservedAt,
            status: r.status,
        }));
}

export function buildAlertCards(metrics, upcomingReservationCount = 0) {
    if (!metrics) return [];
    const cards = [];

    if (metrics.inventory.lowStockCount > 0) {
        cards.push({
            key: 'stock',
            icon: 'pi-box',
            tone: 'danger',
            title: 'Stock bajo',
            detail: `${metrics.inventory.lowStockCount} productos con inventario bajo el mínimo.`,
        });
    }

    if (upcomingReservationCount > 0) {
        cards.push({
            key: 'reservations',
            icon: 'pi-calendar',
            tone: 'info',
            title: 'Reservas próximas',
            detail: `${upcomingReservationCount} reservas en las próximas horas.`,
        });
    }

    const pendingPayments = metrics.diningRoom?.activeOrders ?? 0;
    if (pendingPayments > 0) {
        cards.push({
            key: 'pending',
            icon: 'pi-clock',
            tone: 'warn',
            title: 'Pagos pendientes',
            detail: `${pendingPayments} comanda(s) abiertas sin cerrar.`,
        });
    }

    if (!metrics.cashRegister.open) {
        cards.push({
            key: 'cash',
            icon: 'pi-wallet',
            tone: 'warn',
            title: 'Caja cerrada',
            detail: 'Abre turno de caja antes de registrar cobros en efectivo.',
        });
    }

    if (metrics.kitchen?.ready > 0) {
        cards.push({
            key: 'kitchen',
            icon: 'pi-bell',
            tone: 'info',
            title: 'Pass de cocina',
            detail: `${metrics.kitchen.ready} pedido(s) listos para servir.`,
        });
    }

    return cards.slice(0, 4);
}

export function formatRelativeTime(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function formatReservationTime(dateInput) {
    if (!dateInput) return '--:--';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function buildAreaChartPath(series) {
    if (!series.length) return '';
    const width = 100;
    const height = 40;
    const step = width / Math.max(series.length - 1, 1);

    const coords = series.map((point, index) => {
        const x = index * step;
        const y = height - point.normalized * height;
        return [x, y];
    });

    const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    return area;
}

export function buildAreaChartLinePath(series) {
    if (!series.length) return '';
    const width = 100;
    const height = 40;
    const step = width / Math.max(series.length - 1, 1);

    return series.map((point, index) => {
        const x = index * step;
        const y = height - point.normalized * height;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}

export function getOrderStatusMeta(status) {
    const map = {
        completed: { label: 'Completado', tone: 'success' },
        preparing: { label: 'En preparación', tone: 'info' },
        pending: { label: 'Pendiente', tone: 'warn' },
    };
    return map[status] ?? map.pending;
}

export function getReservationStatusMeta(status) {
    const map = {
        confirmed: { label: 'Confirmada', tone: 'success' },
        seated: { label: 'Sentada', tone: 'info' },
        cancelled: { label: 'Cancelada', tone: 'danger' },
        no_show: { label: 'No show', tone: 'warn' },
    };
    return map[status] ?? map.confirmed;
}
