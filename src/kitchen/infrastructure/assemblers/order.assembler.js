import { Order } from '../../domain/models/order.entity.js';

/**
 * Kitchen Infrastructure - Order Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class OrderAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Order.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {Order}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to Order constructor parameters
        return new Order({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {Order[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => OrderAssembler.toEntityFromResource(r));
    }
}
