/**
 * Kitchen Domain - Order Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class Order {
    constructor({
        id          = null,
        tableId     = null,
        status      = '',
        items       = [],
        stationId   = null,
        createdAt   = null,
        updatedAt   = null,
    } = {}) {
        this.id        = id;
        this.tableId   = tableId;
        this.status    = status;
        this.items     = items;
        this.stationId = stationId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        // TODO: extend with additional domain fields (priority, notes, assignedTo, etc.)
    }
}
