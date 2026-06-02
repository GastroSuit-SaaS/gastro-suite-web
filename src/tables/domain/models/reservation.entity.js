export const RESERVATION_STATUS = Object.freeze({
    CONFIRMED: 'confirmed',
    SEATED:    'seated',
    CANCELLED: 'cancelled',
    NO_SHOW:   'no_show',
});

export class Reservation {
    constructor({
        id = null,
        branchId = null,
        tableId = null,
        tableNumber = null,
        guestName = '',
        guestPhone = '',
        partySize = 2,
        reservedAt = null,
        notes = '',
        status = RESERVATION_STATUS.CONFIRMED,
    } = {}) {
        this.id = id;
        this.branchId = branchId;
        this.tableId = tableId;
        this.tableNumber = tableNumber;
        this.guestName = guestName;
        this.guestPhone = guestPhone;
        this.partySize = partySize;
        this.reservedAt = reservedAt ?? new Date();
        this.notes = notes;
        this.status = status;
    }

    get isActive() {
        return this.status === RESERVATION_STATUS.CONFIRMED;
    }
}
