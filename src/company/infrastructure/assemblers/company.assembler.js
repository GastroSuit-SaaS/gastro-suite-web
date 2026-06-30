import { Company } from '../../domain/models/company.entity.js';
import { entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class CompanyAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new Company({
            id: r.companyId ?? r.id ?? null,
            companyRuc: r.companyRuc ?? '',
            companyName: r.companyName ?? '',
            companyTradeName: r.companyTradeName ?? '',
            companyAddress: r.companyAddress ?? '',
            companyPhone: r.companyPhone ?? '',
            companyEmail: r.companyEmail ?? '',
            isActive: r.isActive ?? true,
        });
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, CompanyAssembler.toEntityFromResource);
    }

    static toUpdateRequest(payload) {
        return {
            companyTradeName: payload.companyTradeName ?? null,
            companyAddress: payload.companyAddress ?? null,
            companyPhone: payload.companyPhone ?? null,
            companyEmail: payload.companyEmail ?? null,
            isActive: payload.isActive,
        };
    }
}
