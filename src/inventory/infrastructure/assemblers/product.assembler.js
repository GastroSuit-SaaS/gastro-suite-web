import { Product } from '../../domain/models/product.entity.js';

/**
 * Inventory Infrastructure - Product Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class ProductAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Product.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {Product}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to Product constructor parameters
        return new Product({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {Product[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => ProductAssembler.toEntityFromResource(r));
    }
}
