import { Report } from '../../domain/models/report.entity.js';

/**
 * Reports Infrastructure - Report Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class ReportAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Report.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {Report}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to Report constructor parameters
        return new Report({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {Report[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => ReportAssembler.toEntityFromResource(r));
    }
}
