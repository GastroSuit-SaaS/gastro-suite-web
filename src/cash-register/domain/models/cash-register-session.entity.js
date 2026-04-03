/**
 * Cash Register Domain - CashRegisterSession Entity
 *
 * Representa un turno de caja (apertura y cierre).
 * Cada sesión tiene un cajero, un monto inicial, y se cierra con un monto final.
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */

export const SESSION_STATUS = Object.freeze({
    OPEN:   'open',
    CLOSED: 'closed',
});

export class CashRegisterSession {
    constructor({
        id              = null,
        shiftName       = '',
        openedAt        = null,
        closedAt        = null,
        openedBy        = null,
        closedBy        = null,
        initialAmount   = 0,
        finalAmount     = null,
        status          = SESSION_STATUS.OPEN,
        sucursalId      = null,
        notes           = '',
        // ── Resumen de ventas (calculado al cerrar) ───────────────────
        totalSales      = 0,
        totalRevenue    = 0,
        cashRevenue     = 0,
        digitalRevenue  = 0,
        // ── Rendición de caja ─────────────────────────────────────────
        expectedCash    = 0,
        countedAmount   = null,
        difference      = 0,
    } = {}) {
        this.id              = id;
        this.shiftName       = shiftName;
        this.openedAt        = openedAt;
        this.closedAt        = closedAt;
        this.openedBy        = openedBy;
        this.closedBy        = closedBy;
        this.initialAmount   = initialAmount;
        this.finalAmount     = finalAmount;
        this.status          = status;
        this.sucursalId      = sucursalId;
        this.notes           = notes;
        this.totalSales      = totalSales;
        this.totalRevenue    = totalRevenue;
        this.cashRevenue     = cashRevenue;
        this.digitalRevenue  = digitalRevenue;
        this.expectedCash    = expectedCash;
        this.countedAmount   = countedAmount;
        this.difference      = difference;
    }

    get isOpen() {
        return this.status === SESSION_STATUS.OPEN;
    }

    get isClosed() {
        return this.status === SESSION_STATUS.CLOSED;
    }

    get duration() {
        if (!this.openedAt) return null;
        const end = this.closedAt ? new Date(this.closedAt) : new Date();
        return end - new Date(this.openedAt);
    }

    /** ¿Hubo faltante de efectivo al cerrar? */
    get hasCashShortage() {
        return this.isClosed && this.countedAmount !== null && this.difference < 0;
    }

    /** ¿Hubo sobrante de efectivo al cerrar? */
    get hasCashSurplus() {
        return this.isClosed && this.countedAmount !== null && this.difference > 0;
    }
}
