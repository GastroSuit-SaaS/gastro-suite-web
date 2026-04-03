import { Payment, PAYMENT_STATUS, PAYMENT_METHOD, RECEIPT_TYPE } from '../../domain/models/payment.entity.js';

/**
 * Payments Infrastructure - Payment Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class PaymentAssembler {

    static toEntityFromResource(r) {
        return new Payment({
            id:             r.id             ?? null,
            saleId:         r.saleId         ?? r.sale_id         ?? null,
            sessionId:      r.sessionId      ?? r.session_id      ?? null,
            tableNumber:    r.tableNumber     ?? r.table_number    ?? null,
            zoneName:       r.zoneName        ?? r.zone_name       ?? null,
            items:          r.items           ?? [],
            subtotal:       r.subtotal        ?? 0,
            tax:            r.tax             ?? 0,
            discount:       r.discount        ?? 0,
            total:          r.total           ?? 0,
            method:         r.method          ?? PAYMENT_METHOD.CASH,
            amountReceived: r.amountReceived  ?? r.amount_received ?? r.total ?? 0,
            change:         r.change          ?? 0,
            receiptType:    r.receiptType     ?? r.receipt_type    ?? RECEIPT_TYPE.NOTA,
            receiptData:    r.receiptData     ?? r.receipt_data    ?? {},
            status:         r.status          ?? PAYMENT_STATUS.COMPLETED,
            cashierId:      r.cashierId       ?? r.cashier_id      ?? null,
            processedAt:    r.processedAt     ?? r.processed_at    ?? null,
            note:           r.note            ?? '',
            splitGroupId:   r.splitGroupId    ?? r.split_group_id  ?? null,
            isSplit:        r.isSplit         ?? r.is_split        ?? false,
            splitIndex:     r.splitIndex      ?? r.split_index     ?? null,
            splitCount:     r.splitCount      ?? r.split_count     ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const list = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(list)) return [];
        return list.map(r => PaymentAssembler.toEntityFromResource(r));
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        if (!data) return null;
        return PaymentAssembler.toEntityFromResource(data);
    }

    static toResourceFromEntity(payment) {
        return {
            saleId:         payment.saleId,
            sessionId:      payment.sessionId,
            tableNumber:    payment.tableNumber,
            zoneName:       payment.zoneName,
            items:          payment.items,
            subtotal:       payment.subtotal,
            tax:            payment.tax,
            discount:       payment.discount,
            total:          payment.total,
            method:         payment.method,
            amountReceived: payment.amountReceived,
            change:         payment.change,
            receiptType:    payment.receiptType,
            receiptData:    payment.receiptData,
            status:         payment.status,
            cashierId:      payment.cashierId,
            note:           payment.note           || undefined,
            splitGroupId:   payment.splitGroupId   || undefined,
            isSplit:        payment.isSplit         || undefined,
            splitIndex:     payment.splitIndex      ?? undefined,
            splitCount:     payment.splitCount      ?? undefined,
        };
    }
}
