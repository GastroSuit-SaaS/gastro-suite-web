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
    PROPIA:        'PROPIA',
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
        saleDisplayNumber = null,
        saleId      = null,
        paymentMethod = null,
        collectedByDisplayName = null,
        tableNumber = null,
        zoneName    = null,
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
        this.saleDisplayNumber = saleDisplayNumber;
        this.saleId      = saleId;
        this.paymentMethod = paymentMethod;
        this.collectedByDisplayName = collectedByDisplayName;
        this.tableNumber = tableNumber;
        this.zoneName    = zoneName;
    }

    get isLinkedToPayment() {
        return Boolean(this.paymentId);
    }

    get isIncome()  { return this.type === MOVEMENT_TYPE.INCOME;  }
    get isExpense() { return this.type === MOVEMENT_TYPE.EXPENSE; }

    /** true si es un movimiento de efectivo físico (no digital) */
    get isCashPhysical() {
        return this.category !== MOVEMENT_CATEGORY.VENTA_DIGITAL;
    }
}
