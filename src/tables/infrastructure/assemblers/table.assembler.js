import { Table } from '../../domain/models/table.entity.js';

/**
 * Tables Infrastructure - Table Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class TableAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Table.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {Table}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to Table constructor parameters
        return new Table({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {Table[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => TableAssembler.toEntityFromResource(r));
    }
}
