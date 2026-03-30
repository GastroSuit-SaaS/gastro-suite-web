import { StationTicket, StationTicketItem, TICKET_STATUS } from '../../domain/models/station-ticket.entity.js';

/**
 * Kitchen Infrastructure - StationTicket Assembler
 *
 * Transforma recursos crudos del API en entidades StationTicket y viceversa.
 */
export class StationTicketAssembler {

    static toEntityFromResource(resource) {
        return new StationTicket({
            id:          resource.id,
            stationId:   resource.stationId   ?? null,
            stationName: resource.stationName ?? '',
            saleId:      resource.saleId      ?? null,
            tableNumber: resource.tableNumber ?? null,
            items:       (resource.items ?? []).map(i => new StationTicketItem(i)),
            status:      resource.status      ?? TICKET_STATUS.RECEIVED,
            createdAt:   resource.createdAt   ?? null,
            startedAt:   resource.startedAt   ?? null,
            readyAt:     resource.readyAt     ?? null,
        });
    }

    static toEntitiesFromResponse(data) {
        if (!Array.isArray(data)) return [];
        return data.map(r => StationTicketAssembler.toEntityFromResource(r));
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        return StationTicketAssembler.toEntityFromResource(response.data);
    }
}
