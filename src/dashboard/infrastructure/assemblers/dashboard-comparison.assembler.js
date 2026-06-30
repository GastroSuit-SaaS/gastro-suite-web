import { DashboardComparison } from '../../domain/models/dashboard-comparison.entity.js';
import { entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class DashboardComparisonAssembler {
    static toEntityFromResource(raw) {
        if (!raw) return null;
        return new DashboardComparison({
            businessDate: raw.businessDate ?? null,
            compareWith: raw.compareWith ?? 'yesterday',
            compareDate: raw.compareDate ?? null,
            timezone: raw.timezone ?? 'America/Lima',
            revenue: raw.revenue,
            paymentCount: raw.paymentCount,
            avgTicket: raw.avgTicket,
            covers: raw.covers,
            cancellations: raw.cancellations,
            hourlyCurrent: raw.hourlyCurrent ?? [],
            hourlyPrevious: raw.hourlyPrevious ?? [],
            channels: raw.channels ?? [],
            topItems: raw.topItems ?? [],
            summary: raw.summary ?? {},
        });
    }

    static toEntitiesFromResponse(response) {
        const entity = DashboardComparisonAssembler.toEntityFromResponse(response);
        return entity ? [entity] : [];
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, DashboardComparisonAssembler.toEntityFromResource);
    }

    /** @deprecated use toEntityFromResponse */
    static fromApiResponse(raw) {
        if (!raw) return null;
        return DashboardComparisonAssembler.toEntityFromResource(
            raw?.data && typeof raw.data === 'object' ? raw.data : raw,
        );
    }
}
