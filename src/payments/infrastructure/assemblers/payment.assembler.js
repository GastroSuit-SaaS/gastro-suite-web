import { Payment, PAYMENT_STATUS, PAYMENT_METHOD, RECEIPT_TYPE } from '../../domain/models/payment.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';
import { requireActiveBranchId } from '../../../shared/application/tenant-context.js';

const METHOD_TO_API = Object.freeze({
    [PAYMENT_METHOD.CASH]: 'CASH',
    [PAYMENT_METHOD.CARD]: 'CARD',
    [PAYMENT_METHOD.YAPE]: 'YAPE',
    [PAYMENT_METHOD.PLIN]: 'PLIN',
});

const METHOD_FROM_API = Object.freeze({
    CASH: PAYMENT_METHOD.CASH,
    CARD: PAYMENT_METHOD.CARD,
    YAPE: PAYMENT_METHOD.YAPE,
    PLIN: PAYMENT_METHOD.PLIN,
});

const RECEIPT_TO_API = Object.freeze({
    [RECEIPT_TYPE.NOTA]:   'NOTA',
    [RECEIPT_TYPE.BOLETA]: 'BOLETA',
    [RECEIPT_TYPE.FACTURA]: 'FACTURA',
});

const RECEIPT_FROM_API = Object.freeze({
    NOTA:    RECEIPT_TYPE.NOTA,
    BOLETA:  RECEIPT_TYPE.BOLETA,
    FACTURA: RECEIPT_TYPE.FACTURA,
});

const STATUS_FROM_API = Object.freeze({
    COMPLETED: PAYMENT_STATUS.COMPLETED,
    PARTIALLY_REFUNDED: PAYMENT_STATUS.PARTIALLY_REFUNDED,
    CANCELLED: PAYMENT_STATUS.CANCELLED,
    REFUNDED:  PAYMENT_STATUS.REFUNDED,
});

/**
 * Payments Infrastructure - Payment Assembler (BFF /api/v1/payments)
 */
export class PaymentAssembler {

    static _mapReceiptDataFromDomain(data) {
        if (!data || typeof data !== 'object') return null;
        const dni = data.dni ?? '';
        const fullName = data.nombre ?? data.fullName ?? data.full_name ?? '';
        const ruc = data.ruc ?? '';
        const companyName = data.razonSocial ?? data.companyName ?? data.company_name ?? '';
        const address = data.direccion ?? data.address ?? '';
        if (!dni && !fullName && !ruc && !companyName && !address) return null;
        return { dni, fullName, ruc, companyName, address };
    }

    static toEntityFromResource(r) {
        const methodKey = String(r.paymentMethod ?? r.method ?? 'CASH').toUpperCase();
        const receiptKey = String(r.paymentReceiptType ?? r.receiptType ?? r.receipt_type ?? 'NOTA').toUpperCase();
        const statusKey = String(r.paymentStatus ?? r.status ?? 'COMPLETED').toUpperCase();

        return new Payment({
            id:             r.paymentId ?? r.payment_id ?? r.id ?? null,
            saleId:         r.saleId ?? r.sale_id ?? null,
            saleDisplayNumber: r.saleDisplayNumber ?? r.sale_display_number ?? null,
            sessionId:      r.sessionId ?? r.session_id ?? r.cashRegisterSessionId ?? r.cash_register_session_id ?? null,
            tableNumber:    r.tableNumber ?? r.table_number ?? null,
            zoneName:       r.zoneName ?? r.zone_name ?? null,
            items:          (r.items ?? []).map(i => ({
                saleItemId: i.saleItemId ?? i.sale_item_id ?? null,
                name: i.itemName ?? i.name ?? '',
                qty: i.quantity ?? i.qty ?? 0,
                quantityRefunded: i.quantityRefunded ?? i.quantity_refunded ?? 0,
                quantityRefundable: i.quantityRefundable ?? i.quantity_refundable ?? 0,
                subtotal: i.subtotal ?? 0,
            })),
            subtotal:       Number(r.paymentSubTotal ?? r.subtotal ?? 0),
            tax:            Number(r.paymentTax ?? r.tax ?? 0),
            discount:       Number(r.discountAmount ?? r.discount ?? 0),
            total:          Number(r.paymentTotal ?? r.total ?? 0),
            tipType:        String(r.tipType ?? r.tip_type ?? 'none').toLowerCase(),
            tipValue:       Number(r.tipValue ?? r.tip_value ?? 0),
            tipAmount:      Number(r.tipAmount ?? r.tip_amount ?? 0),
            method:         METHOD_FROM_API[methodKey] ?? PAYMENT_METHOD.CASH,
            amountReceived: Number(r.paymentAmountReceived ?? r.amount_received ?? r.amountReceived ?? 0),
            change:         Number(r.paymentChange ?? r.change ?? 0),
            receiptType:    RECEIPT_FROM_API[receiptKey] ?? RECEIPT_TYPE.NOTA,
            receiptData:    r.paymentReceiptData ?? r.receiptData ?? r.receipt_data ?? {},
            status:         STATUS_FROM_API[statusKey] ?? PAYMENT_STATUS.COMPLETED,
            cashierId:      r.cashierId ?? r.cashier_id ?? null,
            collectedByDisplayName: r.collectedByDisplayName ?? r.collected_by_display_name ?? null,
            processedAt:    r.processedAt ?? r.processed_at ?? null,
            note:           r.paymentNote ?? r.note ?? '',
            splitGroupId:   r.splitGroupId ?? r.split_group_id ?? null,
            isSplit:        r.splitIsSplit ?? r.is_split ?? false,
            splitIndex:     r.splitIndex ?? r.split_index ?? null,
            splitCount:     r.splitCount ?? r.split_count ?? null,
            refundedAmount: Number(r.refundedAmount ?? r.refunded_amount ?? 0),
            refundableBalance: Number(
                r.refundableBalance ?? r.refundable_balance
                ?? Math.max(0, Number(r.paymentTotal ?? r.total ?? 0) - Number(r.refundedAmount ?? r.refunded_amount ?? 0)),
            ),
        });
    }

    static paymentFromRefundResponse(response) {
        const payment = response?.payment ?? response?.data?.payment ?? response;
        return PaymentAssembler.toEntityFromResource(payment);
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, PaymentAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, PaymentAssembler.toEntityFromResource);
    }

    static _tipTypeToApi(tipType) {
        const key = String(tipType ?? 'none').toLowerCase();
        if (key === 'percent') return 'PERCENT';
        if (key === 'fixed') return 'FIXED';
        return 'NONE';
    }

    /** Body para POST /api/v1/payments (CreatePaymentBffRequest). */
    static toCreateBffResource(payment) {
        const receipt = PaymentAssembler._mapReceiptDataFromDomain(payment.receiptData);
        const tipTypeApi = PaymentAssembler._tipTypeToApi(payment.tipType);
        return {
            saleId: String(payment.saleId),
            branchId: String(payment.sucursalId ?? requireActiveBranchId()),
            paymentSubTotal: payment.subtotal,
            paymentTax: payment.tax,
            paymentTotal: payment.total,
            paymentMethod: METHOD_TO_API[payment.method] ?? String(payment.method).toUpperCase(),
            paymentAmountReceived: payment.amountReceived,
            paymentChange: payment.change ?? 0,
            paymentReceiptType: RECEIPT_TO_API[payment.receiptType] ?? 'NOTA',
            paymentReceiptData: receipt,
            paymentStatus: 'COMPLETED',
            processedAt: payment.processedAt instanceof Date
                ? payment.processedAt.toISOString()
                : (payment.processedAt ?? new Date().toISOString()),
            paymentNote: payment.note || undefined,
            splitIsSplit: payment.isSplit || undefined,
            splitIndex: payment.splitIndex ?? undefined,
            splitCount: payment.splitCount ?? undefined,
            tipType: tipTypeApi,
            tipValue: payment.tipValue ?? 0,
            tipAmount: payment.tipAmount ?? 0,
            discountAmount: payment.discount ?? 0,
            cashRegisterSessionId: payment.sessionId ? String(payment.sessionId) : undefined,
        };
    }

    static toResourceFromEntity(payment) {
        return PaymentAssembler.toCreateBffResource(payment);
    }
}
