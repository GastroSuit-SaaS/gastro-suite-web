/**
 * Menu Domain - CashMovement Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */
export class CashMovement {
    constructor({
        id          = null,
        type        = '',
        amount      = 0,
        description = '',
        registerId  = null,
        userId      = null,
        createdAt   = null,
    } = {}) {
        this.id          = id;
        this.type        = type;
        this.amount      = amount;
        this.description = description;
        this.registerId  = registerId;
        this.userId      = userId;
        this.createdAt   = createdAt;
    }
}
