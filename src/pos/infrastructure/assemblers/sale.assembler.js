import { Sale } from '../../domain/models/sale.entity.js';

/**
 * POS Infrastructure - Sale Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class SaleAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Sale.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {Sale}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to Sale constructor parameters
        return new Sale({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {Sale[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => SaleAssembler.toEntityFromResource(r));
    }
}
