import { Sale, SALE_STATUS, SALE_TYPE } from '../../domain/models/sale.entity.js';
import { SaleItem } from '../../domain/models/sale-item.entity.js';
import { entitiesFromResponse, entityFromResponse, extractResource } from '../../../shared/infrustructure/api-response.js';
import { requireActiveBranchId } from '../../../shared/application/tenant-context.js';
import { PaymentAssembler } from '../../../payments/infrastructure/assemblers/payment.assembler.js';

const API_STATUS = Object.freeze({
    [SALE_STATUS.ACTIVE]:    'ACTIVE',
    [SALE_STATUS.PAID]:      'PAID',
    [SALE_STATUS.CANCELLED]: 'CANCELLED',
    [SALE_STATUS.PENDING]:   'PENDING',
});

const DOMAIN_STATUS = Object.freeze({
    ACTIVE:    SALE_STATUS.ACTIVE,
    PAID:      SALE_STATUS.PAID,
    CANCELLED: SALE_STATUS.CANCELLED,
    PENDING:   SALE_STATUS.PENDING,
});

/** RFC 4122 (v1–v8); el API usa UUID v7 time-ordered. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @param {string|number|null|undefined} id */
export function isPersistedSaleId(id) {
    if (id == null) return false;
    if (typeof id === 'number' && id < 0) return false;
    return UUID_RE.test(String(id).trim());
}

/**
 * POS Infrastructure - Sale Assembler
 *
 * Transforma recursos del BFF /api/v1/pos/sales ↔ entidades de dominio.
 */
export class SaleAssembler {

    static _toApiStatus(status) {
        if (!status) return 'ACTIVE';
        const key = String(status).toLowerCase();
        return API_STATUS[key] ?? String(status).toUpperCase();
    }

    static _fromApiStatus(status) {
        if (!status) return SALE_STATUS.ACTIVE;
        const key = String(status).toUpperCase();
        return DOMAIN_STATUS[key] ?? String(status).toLowerCase();
    }

    static _discountTypeFromApi(value) {
        if (!value) return 'none';
        const key = String(value).toUpperCase();
        if (key === 'FIXED') return 'fixed';
        if (key === 'PCT' || key === 'PERCENT') return 'pct';
        return 'none';
    }

    static _discountTypeToApi(value) {
        if (value === 'fixed') return 'FIXED';
        if (value === 'pct') return 'PCT';
        return 'NONE';
    }

    static toEntityFromResource(r) {
        const items = (r.items ?? []).map(i => new SaleItem({
            id:           i.saleItemId    ?? i.sale_item_id   ?? i.id ?? null,
            menuItemId:   i.itemId        ?? i.item_id        ?? i.menuItemId ?? i.menu_item_id ?? null,
            menuItemName: i.itemName      ?? i.item_name      ?? i.menuItemName ?? i.menu_item_name ?? '',
            quantity:     i.quantity      ?? 1,
            unitPrice:    i.itemPrice     ?? i.item_price     ?? i.unitPrice ?? i.unit_price ?? 0,
            note:         i.note          ?? '',
            discountType: SaleAssembler._discountTypeFromApi(i.discountType ?? i.discount_type) === 'none'
                ? 'pct'
                : SaleAssembler._discountTypeFromApi(i.discountType ?? i.discount_type),
            discountValue:i.discountValue ?? i.discount_value ?? 0,
            stationId:    i.stationId     ?? i.station_id     ?? null,
            stationName:  i.stationName   ?? i.station_name   ?? null,
            isSent:       i.isSent        ?? i.is_sent        ?? false,
            billable:     i.billable      ?? i.is_billable    ?? true,
        }));

        const orderDiscountType = SaleAssembler._discountTypeFromApi(
            r.orderDiscountType ?? r.order_discount_type
        );

        return new Sale({
            id:        r.saleId     ?? r.sale_id    ?? r.id ?? null,
            tableId:   r.tableId    ?? r.table_id   ?? null,
            zoneId:    r.zoneId     ?? r.zone_id    ?? null,
            saleType:  r.saleType   ?? r.sale_type  ?? SALE_TYPE.DINE_IN,
            customerName: r.customerName ?? r.customer_name ?? '',
            saleDisplayNumber: r.saleDisplayNumber ?? r.sale_display_number ?? null,
            ticketNumber: r.saleDisplayNumber ?? r.sale_display_number ?? r.ticketNumber ?? r.ticket_number ?? null,
            items,
            subtotal:  r.subtotal   ?? 0,
            tax:       r.tax        ?? 0,
            discount:  r.discountAmount ?? r.discount_amount ?? r.discount ?? 0,
            orderDiscountType,
            orderDiscountValue: Number(r.orderDiscountValue ?? r.order_discount_value ?? 0),
            total:     r.total      ?? 0,
            status:    SaleAssembler._fromApiStatus(r.saleStatus ?? r.sale_status ?? r.status),
            cashierId: r.cashierId  ?? r.cashier_id  ?? null,
            sucursalId: r.branchId  ?? r.branch_id   ?? r.sucursalId ?? r.sucursal_id ?? null,
            createdAt: r.createdAt  ?? r.created_at  ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, SaleAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, SaleAssembler.toEntityFromResource);
    }

    static _normalizeItemNote(note) {
        const trimmed = note != null ? String(note).trim() : '';
        return trimmed.length > 0 ? trimmed : null;
    }

    static _itemsToApi(items) {
        return (items ?? [])
            .filter(i => i.menuItemId)
            .map(i => {
                const row = {
                    itemId:   i.menuItemId,
                    quantity: i.quantity ?? 1,
                    note:     SaleAssembler._normalizeItemNote(i.note),
                    isSent:   i.isSent ?? false,
                };
                if (isPersistedSaleId(i.id)) {
                    row.saleItemId = i.id;
                }
                // Siempre enviar descuento de línea para poder limpiar (0) en el servidor
                row.discountType = SaleAssembler._discountTypeToApi(i.discountType ?? 'pct');
                row.discountValue = i.discountValue ?? 0;
                return row;
            });
    }

    /** Body para POST /pos/sales (CreateSaleBffRequest). */
    static toCreateResource(sale) {
        return {
            branchId: requireActiveBranchId(),
            zoneId:   sale.zoneId,
            tableId:  sale.tableId,
            items:    SaleAssembler._itemsToApi(sale.items),
        };
    }

    /**
     * Body para PATCH /pos/sales/{saleId} (UpdateSaleBffRequest).
     * @param {Sale} sale
     * @param {{ zoneId?: string|null, tableId?: string|null, saleStatus?: string, includeItems?: boolean }} [opts]
     */
    static toUpdateResource(sale, opts = {}) {
        const body = {};

        if (opts.zoneId !== undefined) body.zoneId = opts.zoneId;
        if (opts.tableId !== undefined) body.tableId = opts.tableId;

        const status = opts.saleStatus ?? (opts.includeItems ? sale.status : undefined);
        if (status !== undefined) {
            body.saleStatus = SaleAssembler._toApiStatus(status);
        }

        if (opts.includeItems) {
            body.items = SaleAssembler._itemsToApi(sale.items);
            body.orderDiscountType = SaleAssembler._discountTypeToApi(sale.orderDiscountType ?? 'none');
            body.orderDiscountValue = sale.orderDiscountValue ?? 0;
        }

        return body;
    }

    /**
     * Respuesta de POST /pos/sales/{id}/checkout.
     * @param {import('axios').AxiosResponse} response
     */
    static fromCheckoutResponse(response) {
        const raw = extractResource(response?.data);
        if (!raw) {
            return { payment: null, sale: null };
        }
        return {
            payment: raw.payment ? PaymentAssembler.toEntityFromResource(raw.payment) : null,
            sale: raw.sale ? SaleAssembler.toEntityFromResource(raw.sale) : null,
        };
    }

    static fromSplitCheckoutResponse(response) {
        const raw = extractResource(response?.data);
        if (!raw) {
            return { payments: [], sale: null };
        }
        const payments = (raw.payments ?? []).map(p => PaymentAssembler.toEntityFromResource(p));
        return {
            payments,
            sale: raw.sale ? SaleAssembler.toEntityFromResource(raw.sale) : null,
        };
    }

    /**
     * Respuesta de POST /pos/sales/{id}/dispatch-to-stations.
     * @param {import('axios').AxiosResponse} response
     */
    static fromDispatchResponse(response) {
        const raw = extractResource(response?.data);
        if (!raw) {
            return { sale: null, itemsDispatched: 0, tickets: [] };
        }
        return {
            sale: raw.sale ? SaleAssembler.toEntityFromResource(raw.sale) : null,
            itemsDispatched: raw.itemsDispatched ?? 0,
            tickets: raw.tickets ?? [],
        };
    }

    /** @deprecated Usar toCreateResource / toUpdateResource. */
    static toResourceFromEntity(sale) {
        return SaleAssembler.toUpdateResource(sale, { includeItems: true, saleStatus: sale.status });
    }
}
