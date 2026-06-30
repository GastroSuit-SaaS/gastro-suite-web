import { TICKET_STATUS } from '../domain/models/station-ticket.entity.js';

const HISTORY_STATUS_META = {
    direct: { label: 'Entrega directa', color: '#0d9488', bg: '#ccfbf1' },
    pending: { label: 'Sin enviar', color: '#6b7280', bg: '#f3f4f6' },
    sent: { label: 'Enviado', color: '#64748b', bg: '#f1f5f9' },
    mixed: { label: 'Estados mixtos', color: '#8b5cf6', bg: '#ede9fe' },
    received: { label: 'Recibido', color: '#3b82f6', bg: '#dbeafe' },
    preparing: { label: 'En Preparación', color: '#f59e0b', bg: '#fef3c7' },
    ready: { label: 'Listo para recoger', color: '#10b981', bg: '#d1fae5' },
    delivered: { label: 'Entregado', color: '#6366f1', bg: '#ede9fe' },
    cancelled: { label: 'Cancelado en cocina', color: '#ef4444', bg: '#fee2e2' },
};

/** Código legible de comanda (p. ej. 42-1) o fallback corto. */
export function ticketDisplayRef(ticket) {
    if (ticket?.displayCode) return ticket.displayCode;
    if (ticket?.saleDisplayNumber != null && ticket?.ticketRoundNumber != null) {
        return `${ticket.saleDisplayNumber}-${ticket.ticketRoundNumber}`;
    }
    const id = ticket?.id;
    if (!id) return '—';
    return String(id).replace(/-/g, '').slice(-8);
}

export function ticketTableLabel(ticket) {
    const n = ticket?.tableNumber;
    if (n == null || n === '') return '—';
    if (typeof n === 'number') return `Mesa ${n}`;
    return String(n).toLowerCase().startsWith('mesa') ? String(n) : `Mesa ${n}`;
}

export function ticketOrderRef(ticket) {
    if (ticket?.saleDisplayNumber != null) return `Orden #${ticket.saleDisplayNumber}`;
    return 'Orden —';
}

/** Texto corto para tablas (columna Orden). */
export function ticketOrderRefShort(ticket) {
    if (ticket?.saleDisplayNumber != null) return `#${ticket.saleDisplayNumber}`;
    return '—';
}

export function ticketItemsSummary(ticket) {
    const items = ticket?.items ?? [];
    if (items.length === 0) return '—';
    const parts = items.slice(0, 3).map(i => `${i.quantity}× ${i.menuItemName}`);
    const extra = items.length > 3 ? ` +${items.length - 3}` : '';
    return parts.join(', ') + extra;
}

export function ticketItemCount(ticket) {
    return (ticket?.items ?? []).reduce((sum, i) => sum + (i.quantity ?? 0), 0);
}

export function ticketClosedAt(ticket) {
    return ticket?.deliveredAt
        ?? ticket?.cancelledAt
        ?? ticket?.readyAt
        ?? ticket?.startedAt
        ?? ticket?.createdAt
        ?? null;
}

export function formatHistoryDateTime(value) {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function startOfLocalDay(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isOnSpecificDay(ticket, day) {
    if (!day) return true;
    const ref = ticketClosedAt(ticket) ?? ticket?.createdAt;
    if (!ref) return false;
    const d = ref instanceof Date ? ref : new Date(ref);
    if (Number.isNaN(d.getTime())) return false;
    const target = startOfLocalDay(day instanceof Date ? day : new Date(day));
    return startOfLocalDay(d).getTime() === target.getTime();
}

export function isWithinDateRange(ticket, rangeKey) {
    if (!rangeKey || rangeKey === 'all' || rangeKey === 'day') return true;
    const ref = ticketClosedAt(ticket) ?? ticket?.createdAt;
    if (!ref) return true;
    const d = ref instanceof Date ? ref : new Date(ref);
    if (Number.isNaN(d.getTime())) return true;

    const today = startOfLocalDay();
    const ticketDay = startOfLocalDay(d);

    if (rangeKey === 'today') {
        return ticketDay.getTime() === today.getTime();
    }
    const daysAgo = rangeKey === '7d' ? 7 : rangeKey === '30d' ? 30 : 0;
    if (!daysAgo) return true;
    const from = new Date(today);
    from.setDate(from.getDate() - (daysAgo - 1));
    return ticketDay.getTime() >= from.getTime() && ticketDay.getTime() <= today.getTime();
}

function matchesDateFilter(ticket, dateRange, specificDate) {
    if (!dateRange || dateRange === 'all') return true;
    if (dateRange === 'day') {
        return isOnSpecificDay(ticket, specificDate);
    }
    return isWithinDateRange(ticket, dateRange);
}

/** Fila plana para DataTable + referencia al ticket original. */
export function toHistoryTableRow(ticket) {
    const statusCfg = HISTORY_STATUS_META[ticket.status] ?? {};
    return {
        id: ticket.id,
        ticket,
        displayRef: ticketDisplayRef(ticket),
        orderRef: ticketOrderRefShort(ticket),
        tableLabel: ticketTableLabel(ticket),
        stationName: ticket.stationName || '—',
        itemsSummary: ticketItemsSummary(ticket),
        itemCount: ticketItemCount(ticket),
        status: ticket.status,
        statusLabel: statusCfg.label ?? ticket.status,
        statusColor: statusCfg.color ?? '#6b7280',
        statusBg: statusCfg.bg ?? '#f3f4f6',
        createdAtLabel: formatHistoryDateTime(ticket.createdAt),
        closedAtLabel: formatHistoryDateTime(ticketClosedAt(ticket)),
        createdAt: ticket.createdAt,
        closedAt: ticketClosedAt(ticket),
        searchText: [
            ticketDisplayRef(ticket),
            ticketOrderRef(ticket),
            ticketTableLabel(ticket),
            ticket.stationName,
            ticketItemsSummary(ticket),
            ticket.status,
        ].join(' ').toLowerCase(),
    };
}

export function filterHistoryTickets(tickets, { status, stationId, dateRange, specificDate, search }) {
    let list = [...tickets];

    if (status) {
        list = list.filter(t => t.status === status);
    }
    if (stationId) {
        list = list.filter(t => String(t.stationId) === String(stationId));
    }
    if (dateRange) {
        list = list.filter(t => matchesDateFilter(t, dateRange, specificDate));
    }
    const q = (search ?? '').trim().toLowerCase();
    if (q) {
        list = list.filter(t => toHistoryTableRow(t).searchText.includes(q));
    }

    return list
        .sort((a, b) => {
            const ta = ticketClosedAt(a)?.getTime?.() ?? 0;
            const tb = ticketClosedAt(b)?.getTime?.() ?? 0;
            return tb - ta;
        })
        .map(toHistoryTableRow);
}

export function historySummaryStats(tickets) {
    const delivered = tickets.filter(t => t.status === TICKET_STATUS.DELIVERED).length;
    const cancelled = tickets.filter(t => t.status === TICKET_STATUS.CANCELLED).length;
    const items = tickets.reduce((sum, t) => sum + ticketItemCount(t), 0);
    return { total: tickets.length, delivered, cancelled, items };
}
