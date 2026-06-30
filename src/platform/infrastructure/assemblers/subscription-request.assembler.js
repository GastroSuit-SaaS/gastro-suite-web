import { SubscriptionRequest } from '../../domain/models/subscription-request.entity.js';
import { entitiesFromResponse } from '../../../shared/infrastructure/api-response.js';

export class SubscriptionRequestAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new SubscriptionRequest({
            requestId: r.requestId ?? r.id ?? null,
            companyId: r.companyId ?? null,
            companyName: r.companyName ?? '',
            companyRuc: r.companyRuc ?? '',
            requestType: r.requestType ?? '',
            planName: r.planName ?? '',
            subscriptionType: r.subscriptionType ?? '',
            paymentReference: r.paymentReference ?? '',
            submittedAt: r.submittedAt ?? null,
            status: r.status ?? '',
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, SubscriptionRequestAssembler.toEntityFromResource);
    }
}
