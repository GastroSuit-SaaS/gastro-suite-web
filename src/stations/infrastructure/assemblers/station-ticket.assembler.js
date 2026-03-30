import { StationTicket, StationTicketItem, TICKET_STATUS } from '../../domain/models/station-ticket.entity.js';

/**
 * Kitchen Infrastructure - StationTicket Assembler
 *
 * Transforma recursos crudos del API en entidades StationTicket y viceversa.
 */
export class StationTicketAssembler {

    static toEntityFromResource(r) {
        return new StationTicket({
            id:           r.id           ?? null,
            stationId:    r.stationId    ?? r.station_id    ?? null,
            stationName:  r.stationName  ?? r.station_name  ?? '',
            saleId:       r.saleId       ?? r.sale_id       ?? null,
            tableNumber:  r.tableNumber  ?? r.table_number  ?? null,
            items:        (r.items ?? []).map(i => new StationTicketItem(i)),
            status:       r.status       ?? TICKET_STATUS.RECEIVED,
            createdAt:    r.createdAt    ?? r.created_at    ?? null,
            startedAt:    r.startedAt    ?? r.started_at    ?? null,
            readyAt:      r.readyAt      ?? r.ready_at      ?? null,
            deliveredAt:  r.deliveredAt  ?? r.delivered_at  ?? null,
            cancelledAt:  r.cancelledAt  ?? r.cancelled_at  ?? null,
            cancelReason: r.cancelReason ?? r.cancel_reason ?? '',
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const list = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(list)) return [];
        return list.map(r => StationTicketAssembler.toEntityFromResource(r));
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        if (!data) return null;
        return StationTicketAssembler.toEntityFromResource(data);
    }

    /**
     * Serializa un StationTicket a DTO para el backend.
     */
    static toResourceFromEntity(ticket) {
        return {
            stationId:   ticket.stationId,
            saleId:      ticket.saleId,
            tableNumber: ticket.tableNumber,
            items:       ticket.items.map(i => ({
                menuItemId:   i.menuItemId,
                menuItemName: i.menuItemName,
                quantity:     i.quantity,
                note:         i.note,
            })),
        };
    }
}
