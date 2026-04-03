/**
 * Cash Register Domain - CashMovement Entity
 *
 * Representa un movimiento individual de efectivo (ingreso o egreso)
 * asociado a una sesión de caja (turno).
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */

export const MOVEMENT_TYPE = Object.freeze({
    INCOME:  'income',
    EXPENSE: 'expense',
});

export const MOVEMENT_CATEGORY = Object.freeze({
    APERTURA:      'apertura',
    VENTA:         'venta',
    VENTA_DIGITAL: 'venta_digital',
    REEMBOLSO:     'reembolso',
    COMPRA:        'compra',
    RETIRO:        'retiro',
    DEPOSITO:      'deposito',
    CIERRE:        'cierre',
    OTRO:          'otro',
});

export class CashMovement {
    constructor({
        id          = null,
        type        = '',
        amount      = 0,
        description = '',
        sessionId   = null,
        registerId  = null,
        userId      = null,
        userName    = '',
        category    = MOVEMENT_CATEGORY.OTRO,
        createdAt   = null,
        sucursalId  = null,
        paymentId   = null,
    } = {}) {
        this.id          = id;
        this.type        = type;
        this.amount      = amount;
        this.description = description;
        this.sessionId   = sessionId;
        this.registerId  = registerId;
        this.userId      = userId;
        this.userName    = userName;
        this.category    = category;
        this.createdAt   = createdAt;
        this.sucursalId  = sucursalId;
        this.paymentId   = paymentId;
    }

    get isIncome()  { return this.type === MOVEMENT_TYPE.INCOME;  }
    get isExpense() { return this.type === MOVEMENT_TYPE.EXPENSE; }

    /** true si es un movimiento de efectivo físico (no digital) */
    get isCashPhysical() {
        return this.category !== MOVEMENT_CATEGORY.VENTA_DIGITAL;
    }
}
