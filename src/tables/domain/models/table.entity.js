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
        this.occupiedSince = occupiedSince;
        this.reservationId = reservationId;
    }

    get isOccupied()  { return this.status === TABLE_STATUS.OCCUPIED; }
    get isAvailable() { return this.status === TABLE_STATUS.AVAILABLE; }

    get occupiedMinutes() {
        if (!this.occupiedSince) return 0;
        return Math.floor((Date.now() - new Date(this.occupiedSince)) / 60000);
    }

    get urgencyLevel() {
        if (!this.isOccupied || !this.occupiedSince) return 'ok';
        const m = this.occupiedMinutes;
        if (m >= 90) return 'critical';
        if (m >= 60) return 'warning';
        return 'ok';
    }
}
