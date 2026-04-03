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
            id:           resource.id,
            type:         resource.type         ?? '',
            title:        resource.title        ?? '',
            status:       resource.status       ?? 'pending',
            period:       resource.period       ?? null,
            dateFrom:     resource.dateFrom     ?? resource.date_from     ?? null,
            dateTo:       resource.dateTo       ?? resource.date_to       ?? null,
            filters:      resource.filters      ?? {},
            exportFormat: resource.exportFormat  ?? resource.export_format ?? 'pdf',
            generatedBy:  resource.generatedBy  ?? resource.generated_by  ?? null,
            generatedAt:  resource.generatedAt  ?? resource.generated_at  ?? null,
            data:         resource.data         ?? null,
            sucursalId:   resource.sucursalId   ?? resource.sucursal_id   ?? null,
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
        if (!data) return null;
        return ReportAssembler.toEntityFromResource(data);
    }

    static toResourceFromEntity(report) {
        return {
            type:          report.type,
            title:         report.title,
            date_from:     report.dateFrom,
            date_to:       report.dateTo,
            filters:       report.filters,
            export_format: report.exportFormat,
        };
    }
}
