/**
 * Payments Domain - Payment Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class Payment {
    constructor({
        id          = null,
        orderId     = null,
        amount      = 0,
        method      = '',
        status      = '',
        reference   = '',
        processedAt = null,
    } = {}) {
        this.id          = id;
        this.orderId     = orderId;
        this.amount      = amount;
        this.method      = method;
        this.status      = status;
        this.reference   = reference;
        this.processedAt = processedAt;
        // TODO: extend with additional domain fields (currency, tip, discount, etc.)
    }
}
