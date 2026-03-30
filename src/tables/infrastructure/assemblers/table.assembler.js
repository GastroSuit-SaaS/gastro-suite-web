import { Table, TABLE_STATUS, TABLE_SHAPE } from '../../domain/models/table.entity.js';

/**
 * Tables Infrastructure - Table Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class TableAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Table.
     * Soporta snake_case y camelCase.
     * @param {Object} r - Recurso crudo del API.
     * @returns {Table}
     */
    static toEntityFromResource(r) {
        return new Table({
            id:            r.id            ?? null,
            number:        r.number        ?? r.table_number   ?? null,
            capacity:      r.capacity      ?? 0,
            shape:         r.shape         ?? TABLE_SHAPE.SQUARE,
            status:        r.status        ?? TABLE_STATUS.AVAILABLE,
            zoneId:        r.zoneId        ?? r.zone_id        ?? null,
            zone:          r.zone          ?? r.zone_name      ?? '',
            seatedGuests:  r.seatedGuests  ?? r.seated_guests  ?? 0,
            orderId:       r.orderId       ?? r.order_id       ?? null,
            orderAmount:   r.orderAmount   ?? r.order_amount   ?? 0,
            occupiedSince: r.occupiedSince ?? r.occupied_since ?? null,
            reservationId: r.reservationId ?? r.reservation_id ?? null,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la coleccion de recursos en entidades.
     * @param {Object} response - Respuesta Axios.
     * @returns {Table[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const list = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(list)) return [];
        return list.map(r => TableAssembler.toEntityFromResource(r));
    }

    /**
     * Serializa una entidad Table a DTO para el backend.
     * @param {Table} table
     * @returns {Object}
     */
    static toResourceFromEntity(table) {
        return {
            number:   table.number,
            capacity: table.capacity,
            shape:    table.shape,
            zoneId:   table.zoneId,
        };
    }
}
