import { Sale, SALE_STATUS } from '../../domain/models/sale.entity.js';
import { SaleItem } from '../../domain/models/sale-item.entity.js';

/**
 * POS Infrastructure - Sale Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class SaleAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Sale.
     * Soporta snake_case y camelCase.
     * @param {Object} r - Recurso crudo del API.
     * @returns {Sale}
     */
    static toEntityFromResource(r) {
        const items = (r.items ?? []).map(i => new SaleItem({
            id:           i.id            ?? null,
            menuItemId:   i.menuItemId    ?? i.menu_item_id   ?? null,
            menuItemName: i.menuItemName  ?? i.menu_item_name ?? '',
            quantity:     i.quantity      ?? 1,
            unitPrice:    i.unitPrice     ?? i.unit_price     ?? 0,
            note:         i.note          ?? '',
            discountType: i.discountType  ?? i.discount_type  ?? 'pct',
            discountValue:i.discountValue ?? i.discount_value ?? 0,
            stationId:    i.stationId     ?? i.station_id     ?? null,
            stationName:  i.stationName   ?? i.station_name   ?? null,
            isSent:       i.isSent        ?? i.is_sent        ?? true,
        }));

        return new Sale({
            id:        r.id         ?? null,
            tableId:   r.tableId    ?? r.table_id    ?? null,
            zoneId:    r.zoneId     ?? r.zone_id     ?? null,
            items,
            subtotal:  r.subtotal   ?? 0,
            tax:       r.tax        ?? 0,
            discount:  r.discount   ?? 0,
            total:     r.total      ?? 0,
            status:    r.status     ?? SALE_STATUS.ACTIVE,
            cashierId: r.cashierId  ?? r.cashier_id  ?? null,
            createdAt: r.createdAt  ?? r.created_at  ?? null,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la coleccion en entidades.
     * @param {Object} response - Respuesta Axios.
     * @returns {Sale[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const list = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(list)) return [];
        return list.map(r => SaleAssembler.toEntityFromResource(r));
    }

    /**
     * Respuesta de un solo recurso (POST/GET by id).
     * @param {Object} response - Respuesta Axios.
     * @returns {Sale|null}
     */
    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        if (!data) return null;
        return SaleAssembler.toEntityFromResource(data);
    }

    /**
     * Serializa una Sale a DTO para el backend.
     * @param {Sale} sale
     * @returns {Object}
     */
    static toResourceFromEntity(sale) {
        return {
            id:        sale.id,
            tableId:   sale.tableId,
            zoneId:    sale.zoneId,
            status:    sale.status,
            subtotal:  sale.subtotal,
            tax:       sale.tax,
            discount:  sale.discount,
            total:     sale.total,
            cashierId: sale.cashierId,
            items: sale.items.map(i => ({
                id:            i.id,
                menuItemId:    i.menuItemId,
                menuItemName:  i.menuItemName,
                quantity:      i.quantity,
                unitPrice:     i.unitPrice,
                note:          i.note,
                discountType:  i.discountType,
                discountValue: i.discountValue,
                stationId:     i.stationId,
                isSent:        i.isSent,
            })),
        };
    }
}
