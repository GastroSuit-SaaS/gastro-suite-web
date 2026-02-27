import { DashboardMetric } from '../../domain/models/dashboard-metric.entity.js';

/**
 * Dashboard Infrastructure - DashboardMetric Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class DashboardMetricAssembler {

    /**
     * Transforma un recurso individual del API en una entidad DashboardMetric.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {DashboardMetric}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to DashboardMetric constructor parameters
        return new DashboardMetric({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {DashboardMetric[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => DashboardMetricAssembler.toEntityFromResource(r));
    }
}
