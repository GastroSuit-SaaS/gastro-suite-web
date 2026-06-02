/** Contrato de eventos operativos (schema v1) — alineado con backend. */
export const OPERATIONAL_SCHEMA_VERSION = 1;

export const OPERATIONAL_EVENT = Object.freeze({
    KITCHEN_TICKET_CREATED:   'kitchen.ticket.created',
    KITCHEN_TICKET_UPDATED:   'kitchen.ticket.updated',
    KITCHEN_TICKET_CANCELLED: 'kitchen.ticket.cancelled',
    SALE_UPDATED:             'sale.updated',
    TABLE_STATUS_CHANGED:     'table.status.changed',
    CASH_SESSION_OPENED:      'cash.session.opened',
    CASH_SESSION_CLOSED:      'cash.session.closed',
    CASH_MOVEMENT_CREATED:    'cash.movement.created',
    PAYMENT_COMPLETED:        'payment.completed',
    PAYMENT_REFUNDED:         'payment.refunded',
    RESERVATION_CREATED:      'reservation.created',
    RESERVATION_UPDATED:      'reservation.updated',
    RESERVATION_CANCELLED:    'reservation.cancelled',
});

/** Canales STOMP a los que se suscribe el cliente (sin /ops para evitar duplicados). */
export const OPERATIONAL_CHANNELS = Object.freeze([
    'kitchen',
    'floor',
    'cash',
    'payments',
    'reservations',
]);

/**
 * @param {string} branchId
 * @param {string} channel
 */
export function operationalTopic(branchId, channel) {
    return `/topic/branch/${branchId}/${channel}`;
}

/**
 * @param {unknown} body
 * @returns {import('./operational-events.js').OperationalEventMessage | null}
 */
export function parseOperationalEvent(body) {
    if (!body || typeof body !== 'object') return null;
    const e = /** @type {Record<string, unknown>} */ (body);
    if (!e.type || !e.branchId) return null;
    return {
        schemaVersion: Number(e.schemaVersion ?? 1),
        type: String(e.type),
        branchId: String(e.branchId),
        entityId: e.entityId != null ? String(e.entityId) : null,
        occurredAt: e.occurredAt != null ? String(e.occurredAt) : null,
        payload: e.payload && typeof e.payload === 'object' ? e.payload : {},
    };
}

/**
 * @typedef {Object} OperationalEventMessage
 * @property {number} schemaVersion
 * @property {string} type
 * @property {string} branchId
 * @property {string|null} entityId
 * @property {string|null} occurredAt
 * @property {Record<string, unknown>} payload
 */
