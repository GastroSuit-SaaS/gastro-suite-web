/**
 * Payments Domain - Payment Entity
 *
 * Objeto de dominio puro.
 * Sin dependencias Vue, sin HTTP, sin imports de otras capas.
 */

export const PAYMENT_STATUS = Object.freeze({
    COMPLETED: 'completed',
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
        processedAt    = null,
        pendingSync    = false,
        sucursalId     = null,
        note           = '',
        splitGroupId   = null,      // UUID compartido por todos los splits de una misma división
        isSplit        = false,
        splitIndex     = null,      // 0-based index dentro del grupo
        splitCount     = null,      // total de splits en el grupo
    } = {}) {
        this.id             = id;
        this.saleId         = saleId;
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
        this.processedAt    = processedAt ?? new Date();
        this.pendingSync    = pendingSync;
        this.sucursalId     = sucursalId;
        this.note           = note;
        this.splitGroupId   = splitGroupId;
        this.isSplit        = isSplit;
        this.splitIndex     = splitIndex;
        this.splitCount     = splitCount;
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
