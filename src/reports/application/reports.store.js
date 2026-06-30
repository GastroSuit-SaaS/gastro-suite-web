import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ReportsApi } from '../infrastructure/api/reports.api.js';
import { ReportAssembler } from '../infrastructure/assemblers/report.assembler.js';
import { Report, REPORT_TYPE, REPORT_STATUS } from '../domain/models/report.entity.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error.js';
import { useReportsFacade } from './reports.facade.js';
import { storeFailure, storeFailureMessage, storeSuccess } from '../../shared/application/store-result.js';
import {
    exportCollectorSalesReportExcel,
    exportSalesByPaymentMethodReportCsv,
    exportSalesByPaymentMethodReportExcel,
} from './reports-excel.js';

const api = new ReportsApi();

export const useReportsStore = defineStore('reports', () => {
    const facade = useReportsFacade();
    // ── State ─────────────────────────────────────────────────────────────
    const reports        = ref([]);
    const selectedReport = ref(null);
    const isLoading      = ref(false);
    const error          = ref(null);
    const filterType     = ref(null);   // null | REPORT_TYPE value
    const filterStatus   = ref(null);   // null | REPORT_STATUS value
    const searchQuery    = ref('');

    // ── Getters ───────────────────────────────────────────────────────────
    const hasReports     = computed(() => reports.value.length > 0);
    const totalReports   = computed(() => reports.value.length);
    const generatedCount = computed(() => reports.value.filter(r => r.isGenerated).length);
    const pendingCount   = computed(() => reports.value.filter(r => r.status === REPORT_STATUS.PENDING).length);
    const failedCount    = computed(() => reports.value.filter(r => r.isFailed).length);

    const reportTypes = computed(() => {
        const set = new Set();
        reports.value.forEach(r => { if (r.type) set.add(r.type); });
        return [...set].sort();
    });

    const filteredReports = computed(() => {
        let list = reports.value;
        if (filterType.value) {
            list = list.filter(r => r.type === filterType.value);
        }
        if (filterStatus.value) {
            list = list.filter(r => r.status === filterStatus.value);
        }
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase();
            list = list.filter(r => r.title.toLowerCase().includes(q));
        }
        return list;
    });

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const branchId = requireActiveBranchId();
            const response = await api.listByBranch(branchId);
            reports.value = ReportAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar reportes');
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedReport.value = ReportAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al obtener el reporte');
        } finally {
            isLoading.value = false;
        }
    }

    async function generate(reportData) {
        isLoading.value = true;
        error.value = null;
        try {
            const branchId = requireActiveBranchId();
            const { employeeId, errorMessage } = await facade.resolveEmployeeIdForReport();
            if (!employeeId) {
                error.value = errorMessage;
                return storeFailureMessage(error.value);
            }

            const dateFrom = reportData.dateFrom ?? new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
            const dateTo = reportData.dateTo ?? new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

            const payload = {
                ...reportData,
                dateFrom,
                dateTo,
                status: REPORT_STATUS.PENDING,
            };

            const response = await api.create(
                ReportAssembler.toResourceFromEntity(new Report(payload), { branchId, employeeId }),
            );

            if (response) {
                const serverReport = ReportAssembler.toEntityFromResponse(response);
                if (serverReport) {
                    const idx = reports.value.findIndex(r => r.id === serverReport.id);
                    if (idx >= 0) {
                        reports.value[idx] = serverReport;
                    } else {
                        reports.value.unshift(serverReport);
                    }
                    selectedReport.value = serverReport;
                    return storeSuccess({ report: serverReport });
                }
            }
            return storeFailureMessage('No se pudo generar el reporte');
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al generar el reporte');
            return storeFailure(e, 'Error al generar el reporte');
        } finally {
            isLoading.value = false;
        }
    }

    async function remove(id) {
        isLoading.value = true;
        error.value = null;
        const backup = [...reports.value];
        reports.value = reports.value.filter(r => r.id !== id);
        try {
            await api.delete(id);
            return storeSuccess();
        } catch (e) {
            reports.value = backup;
            error.value = getApiErrorMessage(e, 'Error al eliminar el reporte');
            return storeFailure(e, 'Error al eliminar el reporte');
        } finally {
            isLoading.value = false;
        }
    }

    function exportCollectorReportExcel(report, options = {}) {
        exportCollectorSalesReportExcel(report, options);
    }

    function exportPaymentMethodReportExcel(report, options = {}) {
        exportSalesByPaymentMethodReportExcel(report, options);
    }

    function exportPaymentMethodReportCsv(report, options = {}) {
        exportSalesByPaymentMethodReportCsv(report, options);
    }

    return {
        reports, selectedReport, isLoading, error,
        filterType, filterStatus, searchQuery,
        hasReports, totalReports, generatedCount, pendingCount, failedCount,
        reportTypes, filteredReports,
        fetchAll, fetchById, generate, remove,
        exportCollectorReportExcel,
        exportPaymentMethodReportExcel,
        exportPaymentMethodReportCsv,
        hasEmployeeLink: facade.hasEmployeeLink,
        ensureEmployeeLink: facade.ensureEmployeeLink,
    };
});
