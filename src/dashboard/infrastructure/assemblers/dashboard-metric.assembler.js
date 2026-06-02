import { DashboardMetric } from '../../domain/models/dashboard-metric.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

/**
 * Dashboard Infrastructure - DashboardMetric Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 *
 * NOTA: Actualmente NO se usa — el dashboard agrega datos de sub-stores.
 * Reservada para cuando el backend provea un endpoint dedicado de métricas.
 */
export class DashboardMetricAssembler {

    static toEntityFromResource(resource) {
        return new DashboardMetric({
            id:     resource.id,
            label:  resource.label  ?? '',
            value:  resource.value  ?? 0,
            unit:   resource.unit   ?? '',
            period: resource.period ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, DashboardMetricAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, DashboardMetricAssembler.toEntityFromResource);
    }
}
