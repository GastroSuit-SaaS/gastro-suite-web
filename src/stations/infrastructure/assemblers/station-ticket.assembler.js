import { StationTicket, StationTicketItem, TICKET_STATUS } from '../../domain/models/station-ticket.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class StationTicketAssembler {

    static _normalizeStatus(status) {
        if (!status) return TICKET_STATUS.RECEIVED;
        const key = String(status).toUpperCase();
        const map = {
            RECEIVED: TICKET_STATUS.RECEIVED,
            PREPARING: TICKET_STATUS.PREPARING,
            READY: TICKET_STATUS.READY,
            DELIVERED: TICKET_STATUS.DELIVERED,
            CANCELLED: TICKET_STATUS.CANCELLED,
        };
        return map[key] ?? String(status).toLowerCase();
    }

    /** Dominio (preparing) → API (PREPARING). */
    static _statusToApi(status) {
        if (!status) return null;
        const key = String(status).toLowerCase();
        const map = {
            [TICKET_STATUS.RECEIVED]:   'RECEIVED',
            [TICKET_STATUS.PREPARING]:  'PREPARING',
            [TICKET_STATUS.READY]:      'READY',
            [TICKET_STATUS.DELIVERED]:  'DELIVERED',
            [TICKET_STATUS.CANCELLED]:  'CANCELLED',
        };
        return map[key] ?? String(status).toUpperCase();
    }

    static toEntityFromResource(r) {
        return new StationTicket({
            id:           r.ticketId ?? r.id ?? null,
            stationId:    r.stationId ?? r.station_id ?? null,
            stationName:  r.stationName ?? r.station_name ?? '',
            saleId:       r.saleId ?? r.sale_id ?? null,
            tableNumber:  r.tableNumber ?? r.table_number ?? null,
            saleDisplayNumber:  r.saleDisplayNumber ?? r.sale_display_number ?? null,
            ticketRoundNumber:  r.ticketRoundNumber ?? r.ticket_round_number ?? null,
            displayCode:        r.ticketDisplayCode ?? r.ticket_display_code ?? null,
            dispatchedSaleItemIds: r.dispatchedSaleItemIds ?? r.dispatched_sale_item_ids ?? [],
            items:        (r.items ?? []).map((i) => new StationTicketItem({
                menuItemId:   i.menuItemId ?? i.menu_item_id ?? i.itemId ?? i.item_id,
                menuItemName: i.menuItemName ?? i.menu_item_name ?? i.itemName ?? i.item_name ?? i.name ?? '',
                quantity:     i.quantity ?? 1,
                note:         i.note ?? '',
            })),
            status:       StationTicketAssembler._normalizeStatus(r.ticketStatus ?? r.status),
            createdAt:    r.createdAt ?? r.created_at ?? null,
            startedAt:    r.startedAt ?? r.started_at ?? null,
            readyAt:      r.readyAt ?? r.ready_at ?? null,
            deliveredAt:  r.deliveredAt ?? r.delivered_at ?? null,
            cancelledAt:  r.cancelledAt ?? r.cancelled_at ?? null,
            cancelReason: r.cancelReason ?? r.cancel_reason ?? '',
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, StationTicketAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, StationTicketAssembler.toEntityFromResource);
    }

    /** Body para POST /api/v1/pos/tickets (CreateTicketBffRequest). */
    static toCreateBffResource({ saleId, stationId, ticketStatus = 'RECEIVED' }) {
        const body = {
            saleId,
            ticketStatus,
            createdAt: new Date().toISOString(),
            startedAt: null,
        };
        if (stationId) body.stationId = stationId;
        return body;
    }

    /** Body para PATCH /api/v1/pos/tickets/{ticketId} (UpdateTicketBffRequest). */
    static toUpdateBffResource({ status, ticketStatus, cancelReason } = {}) {
        const raw = ticketStatus ?? status;
        const apiStatus = StationTicketAssembler._statusToApi(raw);
        const body = {};
        if (apiStatus) body.ticketStatus = apiStatus;
        if (cancelReason != null && String(cancelReason).trim() !== '') {
            body.cancelReason = String(cancelReason).trim();
        }
        return body;
    }

    /** @deprecated Usar toCreateBffResource. */
    static toResourceFromEntity(ticket) {
        return StationTicketAssembler.toCreateBffResource({
            saleId:      ticket.saleId,
            stationId:   ticket.stationId,
            ticketStatus: 'RECEIVED',
        });
    }
}
