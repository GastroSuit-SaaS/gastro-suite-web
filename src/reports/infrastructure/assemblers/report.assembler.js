import { Report } from '../../domain/models/report.entity.js';

/**
 * Reports Infrastructure - Report Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class ReportAssembler {

    static toEntityFromResource(resource) {
        return new Report({
            id:          resource.id,
            type:        resource.type        ?? '',
            title:       resource.title       ?? '',
            period:      resource.period      ?? null,
            generatedAt: resource.generatedAt ?? resource.generated_at ?? null,
            data:        resource.data        ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const data = response.data?.items ?? response.data?.data ?? response.data;
        return Array.isArray(data) ? data.map(r => ReportAssembler.toEntityFromResource(r)) : [];
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        return ReportAssembler.toEntityFromResource(data);
    }
}
