import { PlatformCompanyOverview } from '../../domain/models/platform-company-overview.entity.js';
import { entitiesFromResponse } from '../../../shared/infrastructure/api-response.js';

export class PlatformCompanyOverviewAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new PlatformCompanyOverview({
            companyId: r.companyId ?? r.id ?? null,
            companyName: r.companyName ?? '',
            companyRuc: r.companyRuc ?? '',
            subscriptionId: r.subscriptionId ?? null,
            planName: r.planName ?? '',
            subscriptionType: r.subscriptionType ?? '',
            accessState: r.accessState ?? 'NONE',
            endDate: r.endDate ?? null,
            pendingRequestId: r.pendingRequestId ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, PlatformCompanyOverviewAssembler.toEntityFromResource);
    }
}
