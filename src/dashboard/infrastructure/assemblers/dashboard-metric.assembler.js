import { OperationalMetrics } from '../../domain/models/dashboard-metric.entity.js';
import { entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class DashboardMetricAssembler {
    static toEntityFromResource(resource) {
        if (!resource) return null;
        return new OperationalMetrics({
            businessDate: resource.businessDate ?? null,
            timezone: resource.timezone,
            sales: resource.sales,
            diningRoom: resource.diningRoom,
            kitchen: resource.kitchen,
            cashRegister: resource.cashRegister,
            inventory: resource.inventory,
        });
    }

    static toEntitiesFromResponse(response) {
        const entity = DashboardMetricAssembler.toEntityFromResponse(response);
        return entity ? [entity] : [];
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, DashboardMetricAssembler.toEntityFromResource);
    }

    /** @deprecated use toEntityFromResource */
    static fromApiResource(resource) {
        return DashboardMetricAssembler.toEntityFromResource(resource);
    }

    /** @deprecated use toEntityFromResponse */
    static fromApiResponse(response) {
        return DashboardMetricAssembler.toEntityFromResponse(response);
    }
}
