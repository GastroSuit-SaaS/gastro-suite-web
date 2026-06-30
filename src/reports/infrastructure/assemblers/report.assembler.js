import { Report } from '../../domain/models/report.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

function _normalizeType(value) {
    if (!value) return '';
    return String(value).toLowerCase().replace(/-/g, '_');
}

function _normalizeStatus(value) {
    if (!value) return 'pending';
    return String(value).toLowerCase();
}

function _toApiReportType(type) {
    if (!type) return 'DAILY_SALES';
    return String(type).toUpperCase().replace(/-/g, '_');
}

function _startOfDayIso(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function _endOfDayIso(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
}

/**
 * Reports Infrastructure - Report Assembler
 */
export class ReportAssembler {

    static toEntityFromResource(resource) {
        const r = resource ?? {};
        return new Report({
            id:           r.reportId ?? r.id ?? null,
            type:         _normalizeType(r.reportType ?? r.type),
            title:        r.reportTitle ?? r.title ?? '',
            status:       _normalizeStatus(r.reportStatus ?? r.status),
            period:       r.reportPeriod ?? r.period ?? null,
            dateFrom:     r.reportDateFrom ?? r.dateFrom ?? r.date_from ?? null,
            dateTo:       r.reportDateTo ?? r.dateTo ?? r.date_to ?? null,
            filters:      r.reportFilters ?? r.filters ?? {},
            exportFormat: (r.reportExportFormat ?? r.exportFormat ?? r.export_format ?? 'excel').toLowerCase(),
            generatedBy:  r.employeeId ?? r.generatedBy ?? r.generated_by ?? null,
            generatedAt:  r.createdAt ?? r.generatedAt ?? r.generated_at ?? null,
            data:         r.reportData ?? r.data ?? null,
            sucursalId:   r.branchId ?? r.sucursalId ?? r.sucursal_id ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, ReportAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, ReportAssembler.toEntityFromResource);
    }

    /**
     * @param {Report} report
     * @param {{ branchId: string, employeeId: string }} context
     */
    static toResourceFromEntity(report, { branchId, employeeId }) {
        const dateFrom = report.dateFrom ?? _startOfDayIso();
        const dateTo = report.dateTo ?? _endOfDayIso();

        return {
            branchId,
            employeeId,
            reportType: _toApiReportType(report.type),
            reportTitle: report.title?.trim() || 'Reporte',
            reportPeriod: 'DAILY',
            reportDateFrom: dateFrom,
            reportDateTo: dateTo,
            reportFilters: report.filters ?? {},
        };
    }
}
