/**
 * Stations Domain - StationTicket Entity
 *
 * Representa un comando/pedido enviado a una estación de preparación desde el POS.
 * Objeto de dominio puro — sin dependencias Vue, sin HTTP.
 */

export const TICKET_STATUS = Object.freeze({
    RECEIVED:   'received',
    PREPARING:  'preparing',
    READY:      'ready',
    DELIVERED:  'delivered',
    CANCELLED:  'cancelled',
});

export class StationTicketItem {
    constructor({
        menuItemId   = null,
        menuItemName = '',
        quantity     = 1,
        note         = '',
    } = {}) {
        this.menuItemId   = menuItemId;
        this.menuItemName = menuItemName;
        this.quantity     = quantity;
        this.note         = note;
    }
}

export class StationTicket {
    constructor({
        id           = null,
        stationId    = null,
        stationName  = '',
        saleId       = null,
        tableNumber  = null,
        items        = [],
        status       = TICKET_STATUS.RECEIVED,
        createdAt    = null,
        startedAt    = null,
        readyAt      = null,
        deliveredAt  = null,
        cancelledAt  = null,
        cancelReason = '',
    } = {}) {
        this.id           = id;
        this.stationId    = stationId;
        this.stationName  = stationName;
        this.saleId       = saleId;
        this.tableNumber  = tableNumber;
        this.items        = items.map(i => i instanceof StationTicketItem ? i : new StationTicketItem(i));
        this.status       = status;
        this.createdAt    = createdAt   ? new Date(createdAt)   : new Date();
        this.startedAt    = startedAt   ? new Date(startedAt)   : null;
        this.readyAt      = readyAt     ? new Date(readyAt)     : null;
        this.deliveredAt  = deliveredAt ? new Date(deliveredAt) : null;
        this.cancelledAt  = cancelledAt ? new Date(cancelledAt) : null;
        this.cancelReason = cancelReason;
    }

    get elapsedMinutes() {
        if (!this.createdAt) return 0;
        return Math.floor((Date.now() - new Date(this.createdAt)) / 60000);
    }

    get urgencyLevel() {
        if (this.status === TICKET_STATUS.DELIVERED || this.status === TICKET_STATUS.CANCELLED) return 'ok';
        const m = this.elapsedMinutes;
        if (m < 15) return 'ok';
        if (m < 30) return 'warn';
        return 'critical';
    }
}
