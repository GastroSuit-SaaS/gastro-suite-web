/**
 * Payments Domain - Payment Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */

export const PAYMENT_STATUS = Object.freeze({
    COMPLETED: 'completed',
    PARTIALLY_REFUNDED: 'partially_refunded',
    CANCELLED: 'cancelled',
    REFUNDED:  'refunded',
});

export const PAYMENT_METHOD = Object.freeze({
    CASH: 'cash',
    CARD: 'card',
    YAPE: 'yape',
    PLIN: 'plin',
});

export const RECEIPT_TYPE = Object.freeze({
    NOTA:    'nota',
    BOLETA:  'boleta',
    FACTURA: 'factura',
});

export class Payment {
    constructor({
        id             = null,
        saleId         = null,
        saleDisplayNumber = null,
        sessionId      = null,
        tableNumber    = null,
        zoneName       = null,
        items          = [],        // snapshot [{name, qty, subtotal}]
        subtotal       = 0,
        tax            = 0,
        discount       = 0,
        total          = 0,
        method         = PAYMENT_METHOD.CASH,
        amountReceived = 0,
        change         = 0,
        receiptType    = RECEIPT_TYPE.NOTA,
        receiptData    = {},        // { dni, nombre } | { ruc, razonSocial, direccion }
        status         = PAYMENT_STATUS.COMPLETED,
        cashierId      = null,
        collectedByDisplayName = null,
        processedAt    = null,
        pendingSync    = false,
        sucursalId     = null,
        note           = '',
        splitGroupId   = null,      // UUID compartido por todos los splits de una misma división
        isSplit        = false,
        splitIndex     = null,      // 0-based index dentro del grupo
        splitCount     = null,      // total de splits en el grupo
        tipType        = 'none',
        tipValue       = 0,
        tipAmount      = 0,
        refundedAmount = 0,
        refundableBalance = null,
    } = {}) {
        this.id             = id;
        this.saleId         = saleId;
        this.saleDisplayNumber = saleDisplayNumber;
        this.sessionId      = sessionId;
        this.tableNumber    = tableNumber;
        this.zoneName       = zoneName;
        this.items          = items;
        this.subtotal       = subtotal;
        this.tax            = tax;
        this.discount       = discount;
        this.total          = total;
        this.method         = method;
        this.amountReceived = amountReceived;
        this.change         = change;
        this.receiptType    = receiptType;
        this.receiptData    = receiptData;
        this.status         = status;
        this.cashierId      = cashierId;
        this.collectedByDisplayName = collectedByDisplayName;
        this.processedAt    = processedAt ?? new Date();
        this.pendingSync    = pendingSync;
        this.sucursalId     = sucursalId;
        this.note           = note;
        this.splitGroupId   = splitGroupId;
        this.isSplit        = isSplit;
        this.splitIndex     = splitIndex;
        this.splitCount     = splitCount;
        this.tipType        = tipType;
        this.tipValue       = tipValue;
        this.tipAmount      = tipAmount;
        this.refundedAmount = refundedAmount;
        this.refundableBalance = refundableBalance ?? Math.max(0, total - refundedAmount);
    }

    /** Monto neto cobrado (total − reembolsado). */
    get netCollected() {
        return Math.max(0, (this.total ?? 0) - (this.refundedAmount ?? 0));
    }

    get isRefundable() {
        return (this.status === PAYMENT_STATUS.COMPLETED
            || this.status === PAYMENT_STATUS.PARTIALLY_REFUNDED)
            && this.refundableBalance > 0;
    }

    /** Devuelve true si el pago fue procesado hoy (fecha local). */
    get isToday() {
        const d = new Date(this.processedAt);
        const n = new Date();
        return d.getFullYear() === n.getFullYear()
            && d.getMonth()    === n.getMonth()
            && d.getDate()     === n.getDate();
    }
}
