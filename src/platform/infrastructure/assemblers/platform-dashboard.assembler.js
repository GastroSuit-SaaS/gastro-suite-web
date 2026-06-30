import { PlatformDashboard } from '../../domain/models/platform-dashboard.entity.js';
import { entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class PlatformDashboardAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new PlatformDashboard({
            pendingRequestsCount: r.pendingRequestsCount ?? 0,
            activeCompaniesCount: r.activeCompaniesCount ?? 0,
            graceCompaniesCount: r.graceCompaniesCount ?? 0,
            expiredCompaniesCount: r.expiredCompaniesCount ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        const entity = entityFromResponse(response, PlatformDashboardAssembler.toEntityFromResource);
        return entity ? [entity] : [];
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, PlatformDashboardAssembler.toEntityFromResource);
    }
}
