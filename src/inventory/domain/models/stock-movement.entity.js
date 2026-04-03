export const MOVEMENT_TYPE = Object.freeze({
    PURCHASE:   'purchase',
    USAGE:      'usage',
    WASTE:      'waste',
    ADJUSTMENT: 'adjustment',
    TRANSFER:   'transfer',
    RETURN:     'return',
});

export const MOVEMENT_DIRECTION = Object.freeze({
    IN:  'in',
    OUT: 'out',
});

export class StockMovement {
    constructor({
        id            = null,
        productId     = null,
        productName   = '',
        productSku    = '',
        type          = MOVEMENT_TYPE.USAGE,
        direction     = MOVEMENT_DIRECTION.OUT,
        quantity      = 0,
        previousStock = 0,
        newStock      = 0,
        reason        = '',
        notes         = '',
        userId        = null,
        userName      = '',
        sucursalId    = null,
        createdAt     = null,
    } = {}) {
        this.id            = id;
        this.productId     = productId;
        this.productName   = productName;
        this.productSku    = productSku;
        this.type          = type;
        this.direction     = direction;
        this.quantity      = quantity;
        this.previousStock = previousStock;
        this.newStock      = newStock;
        this.reason        = reason;
        this.notes         = notes;
        this.userId        = userId;
        this.userName      = userName;
        this.sucursalId    = sucursalId;
        this.createdAt     = createdAt ? new Date(createdAt) : new Date();
    }

    get isEntry() {
        return this.direction === MOVEMENT_DIRECTION.IN;
    }

    get isExit() {
        return this.direction === MOVEMENT_DIRECTION.OUT;
    }

    get signedQuantity() {
        return this.isEntry ? this.quantity : -this.quantity;
    }
}
