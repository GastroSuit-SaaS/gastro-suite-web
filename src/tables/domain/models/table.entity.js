/**
 * Tables Domain - Table Entity
 * Modelo de datos puro. Sin lógica, sin dependencias.
 */
export const TABLE_STATUS = Object.freeze({
    AVAILABLE: 'available',
    OCCUPIED:  'occupied',
    CLEANING:  'cleaning',
    RESERVED:  'reserved',
});

export const TABLE_SHAPE = Object.freeze({
    SQUARE:    'square',
    ROUND:     'round',
    RECTANGLE: 'rectangle',
});

export class Table {
    constructor({
        id            = null,
        number        = null,
        capacity      = 0,
        shape         = TABLE_SHAPE.SQUARE,
        status        = TABLE_STATUS.AVAILABLE,
        zoneId        = null,
        zone          = '',
        seatedGuests  = 0,
        orderId       = null,
        orderAmount   = 0,
        occupiedSince = null,
        reservationId = null,
    } = {}) {
        this.id            = id;
        this.number        = number;
        this.capacity      = capacity;
        this.shape         = shape;
        this.status        = status;
        this.zoneId        = zoneId;
        this.zone          = zone;
        this.seatedGuests  = seatedGuests;
        this.orderId       = orderId;
        this.orderAmount   = orderAmount;
        this.occupiedSince = occupiedSince;
        this.reservationId = reservationId;
    }
}
