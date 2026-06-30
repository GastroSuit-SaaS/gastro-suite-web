import { Table, TABLE_STATUS, TABLE_SHAPE } from '../../domain/models/table.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class TableAssembler {

    static _fromApiStatus(status) {
        if (!status) return TABLE_STATUS.AVAILABLE;
        const key = String(status).toUpperCase();
        const map = {
            AVAILABLE: TABLE_STATUS.AVAILABLE,
            OCCUPIED: TABLE_STATUS.OCCUPIED,
            CLEANING: TABLE_STATUS.CLEANING,
            RESERVED: TABLE_STATUS.RESERVED,
        };
        return map[key] ?? String(status).toLowerCase();
    }

    static _toApiStatus(status) {
        if (!status) return 'AVAILABLE';
        return String(status).toUpperCase();
    }

    static _fromApiShape(shape) {
        if (!shape) return TABLE_SHAPE.SQUARE;
        const key = String(shape).toUpperCase();
        const map = {
            SQUARE: TABLE_SHAPE.SQUARE,
            ROUND: TABLE_SHAPE.ROUND,
            RECTANGLE: TABLE_SHAPE.RECTANGLE,
        };
        return map[key] ?? String(shape).toLowerCase();
    }

    static _toApiShape(shape) {
        if (!shape) return 'SQUARE';
        return String(shape).toUpperCase();
    }

    /** LocalDateTime sin zona (compatible con Jackson → LocalDateTime en API). */
    static _toLocalDateTime(value) {
        if (value == null) return null;
        const d = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    static toEntityFromResource(r) {
        return new Table({
            id:            r.tableId ?? r.id ?? null,
            number:        r.tableNumber != null || r.number != null || r.table_number != null
                ? String(r.tableNumber ?? r.number ?? r.table_number).trim()
                : null,
            capacity:      r.tableCapacity ?? r.capacity ?? r.table_capacity ?? 0,
            shape:         TableAssembler._fromApiShape(r.tableShape ?? r.shape ?? r.table_shape),
            status:        TableAssembler._fromApiStatus(r.tableStatus ?? r.status ?? r.table_status),
            zoneId:        r.zoneId ?? r.zone_id ?? null,
            zone:          r.zoneName ?? r.zone ?? r.zone_name ?? '',
            seatedGuests:  r.tableSeatedGuests ?? r.seatedGuests ?? r.seated_guests ?? 0,
            occupiedSince: r.occupiedSince ?? r.occupied_since ?? null,
            reservationId: r.reservationId ?? r.reservation_id ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, TableAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, TableAssembler.toEntityFromResource);
    }

    static _tableNumberForApi(number) {
        const id = number != null ? String(number).trim() : '';
        return id.length > 0 ? id : null;
    }

    static toCreateResource(table) {
        return {
            zoneId: table.zoneId,
            tableNumber: TableAssembler._tableNumberForApi(table.number),
            tableCapacity: table.capacity,
            tableShape: TableAssembler._toApiShape(table.shape),
        };
    }

    static toUpdateResource(table) {
        return {
            tableNumber: TableAssembler._tableNumberForApi(table.number),
            tableCapacity: table.capacity ?? null,
            tableShape: table.shape != null ? TableAssembler._toApiShape(table.shape) : null,
            tableStatus: table.status != null ? TableAssembler._toApiStatus(table.status) : null,
            tableSeatedGuests: table.seatedGuests ?? null,
            occupiedSince: table.occupiedSince != null
                ? TableAssembler._toLocalDateTime(table.occupiedSince)
                : null,
            tableIsActive: table.isActive ?? null,
        };
    }

    /** PATCH parcial para cambios de estado en piso/POS. */
    static toStatusPatch({ status, seatedGuests, occupiedSince }) {
        const body = {};
        if (status != null) body.tableStatus = TableAssembler._toApiStatus(status);
        if (seatedGuests != null) body.tableSeatedGuests = seatedGuests;
        if (occupiedSince !== undefined) {
            body.occupiedSince = occupiedSince == null
                ? null
                : TableAssembler._toLocalDateTime(occupiedSince);
        }
        return body;
    }
}
