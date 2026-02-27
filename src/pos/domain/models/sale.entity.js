/**
 * POS Domain - Sale Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class Sale {
    constructor({
        id        = null,
        tableId   = null,
        items     = [],
        subtotal  = 0,
        tax       = 0,
        total     = 0,
        status    = '',
        createdAt = null,
    } = {}) {
        this.id        = id;
        this.tableId   = tableId;
        this.items     = items;
        this.subtotal  = subtotal;
        this.tax       = tax;
        this.total     = total;
        this.status    = status;
        this.createdAt = createdAt;
        // TODO: extend with additional domain fields (discount, cashierId, etc.)
    }
}
