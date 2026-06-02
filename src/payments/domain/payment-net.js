import { PAYMENT_STATUS } from './models/payment.entity.js';

/** Estados de pago que representan cobro efectivo (incl. reembolsos parciales/totales). */
export const SETTLED_PAYMENT_STATUSES = Object.freeze([
    PAYMENT_STATUS.COMPLETED,
    PAYMENT_STATUS.PARTIALLY_REFUNDED,
    PAYMENT_STATUS.REFUNDED,
]);

/**
 * Monto neto cobrado tras reembolsos (total − reembolsado).
 * @param {{ total?: number, refundedAmount?: number, refundableBalance?: number }} payment
 */
export function paymentNetCollected(payment) {
    if (!payment) return 0;
    const total = Number(payment.total ?? 0);
    const refunded = Number(payment.refundedAmount ?? 0);
    return Math.max(0, total - refunded);
}
