import { Reservation, RESERVATION_STATUS } from '../../domain/models/reservation.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

const STATUS_FROM_API = Object.freeze({
    CONFIRMED: RESERVATION_STATUS.CONFIRMED,
    SEATED:    RESERVATION_STATUS.SEATED,
    CANCELLED: RESERVATION_STATUS.CANCELLED,
    NO_SHOW:   RESERVATION_STATUS.NO_SHOW,
});

export class ReservationAssembler {
    static toEntityFromResource(r) {
        const statusKey = String(r.reservationStatus ?? r.status ?? 'CONFIRMED').toUpperCase();
        return new Reservation({
            id: r.reservationId ?? r.id ?? null,
            branchId: r.branchId ?? r.branch_id ?? null,
            tableId: r.tableId ?? r.table_id ?? null,
            tableNumber: r.tableNumber ?? r.table_number ?? null,
            guestName: r.guestName ?? r.guest_name ?? '',
            guestPhone: r.guestPhone ?? r.guest_phone ?? '',
            partySize: Number(r.partySize ?? r.party_size ?? 2),
            reservedAt: r.reservedAt ?? r.reserved_at ?? null,
            notes: r.notes ?? '',
            status: STATUS_FROM_API[statusKey] ?? RESERVATION_STATUS.CONFIRMED,
        });
    }

    static toCreateBody(entity) {
        return {
            tableId: entity.tableId || undefined,
            guestName: entity.guestName,
            guestPhone: entity.guestPhone || undefined,
            partySize: entity.partySize,
            reservedAt: entity.reservedAt instanceof Date
                ? entity.reservedAt.toISOString()
                : entity.reservedAt,
            notes: entity.notes || undefined,
        };
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, ReservationAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, ReservationAssembler.toEntityFromResource);
    }

    /** Respuesta de check-in: `{ reservation, tableId }`. */
    static tableIdFromCheckInResponse(response) {
        if (!response || response.status !== 200) return null;
        const raw = entityFromResponse(response, (r) => r);
        if (!raw || typeof raw !== 'object') return null;
        return raw.tableId ?? raw.table_id ?? null;
    }
}
