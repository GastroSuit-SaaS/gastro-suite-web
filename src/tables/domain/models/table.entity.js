/**
 * Tables Domain - Table Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class Table {
    constructor({
        id       = null,
        number   = null,
        capacity = 0,
        status   = '',
        zoneId   = null,
        zone     = null,
    } = {}) {
        this.id       = id;
        this.number   = number;
        this.capacity = capacity;
        this.status   = status;
        this.zoneId   = zoneId;
        this.zone     = zone;
        // TODO: extend with additional domain fields (currentOrderId, reservationId, etc.)
    }
}
