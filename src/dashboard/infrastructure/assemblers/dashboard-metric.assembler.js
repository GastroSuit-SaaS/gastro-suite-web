import { DashboardMetric } from '../../domain/models/dashboard-metric.entity.js';

/**
 * Dashboard Infrastructure - DashboardMetric Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
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
        if (response.status !== 200) return [];
        const data = response.data?.items ?? response.data?.data ?? response.data;
        return Array.isArray(data) ? data.map(r => DashboardMetricAssembler.toEntityFromResource(r)) : [];
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        return DashboardMetricAssembler.toEntityFromResource(data);
    }
}
