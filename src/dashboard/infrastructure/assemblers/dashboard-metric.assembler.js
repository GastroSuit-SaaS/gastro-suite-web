import { OperationalMetrics } from '../../domain/models/dashboard-metric.entity.js';
import { entityFromResponse } from '../../../shared/infrustructure/api-response.js';

/**
 * Mapeo 1:1 del contrato API → dominio frontend.
 */
export class DashboardMetricAssembler {
    static fromApiResource(resource) {
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

    static fromApiResponse(response) {
        return entityFromResponse(response, DashboardMetricAssembler.fromApiResource);
    }
}
