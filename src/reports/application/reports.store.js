import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ReportsApi } from '../infrastructure/api/reports.api.js';
import { ReportAssembler } from '../infrastructure/assemblers/report.assembler.js';
import { Report, REPORT_TYPE, REPORT_STATUS } from '../domain/models/report.entity.js';
import { MOCK_REPORTS } from '../infrastructure/reports.mock.js';
import { withMockFallback, withMockMutation } from '../../shared/infrustructure/mock-fallback.js';

const api = new ReportsApi();

export const useReportsStore = defineStore('reports', () => {

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
            const response = await withMockFallback(
                () => api.getAll(),
                () => ({ status: 200, data: [...MOCK_REPORTS] }),
            );
            reports.value = ReportAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar reportes';
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await withMockFallback(
                () => api.getById(id),
                () => {
                    const found = MOCK_REPORTS.find(r => r.id === id);
                    return found ? { status: 200, data: found } : { status: 404, data: null };
                },
            );
            selectedReport.value = ReportAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al obtener el reporte';
        } finally {
            isLoading.value = false;
        }
    }

    async function generate(reportData) {
        isLoading.value = true;
        error.value = null;
        try {
            const newReport = new Report({
                ...reportData,
                id: `rpt-${Date.now()}`,
                status: REPORT_STATUS.PENDING,
                generatedAt: new Date().toISOString(),
            });

            reports.value.unshift(newReport);

            const response = await withMockMutation(
                () => api.generate(ReportAssembler.toResourceFromEntity(newReport)),
            );

            if (response) {
                const serverReport = ReportAssembler.toEntityFromResponse(response);
                if (serverReport) {
                    const idx = reports.value.findIndex(r => r.id === newReport.id);
                    if (idx !== -1) reports.value[idx] = serverReport;
                    selectedReport.value = serverReport;
                    return;
                }
            }
            selectedReport.value = newReport;
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al generar el reporte';
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
            await withMockMutation(() => api.delete(id));
        } catch (e) {
            reports.value = backup;
            error.value = e?.response?.data?.message ?? 'Error al eliminar el reporte';
        } finally {
            isLoading.value = false;
        }
    }

    return {
        reports, selectedReport, isLoading, error,
        filterType, filterStatus, searchQuery,
        hasReports, totalReports, generatedCount, pendingCount, failedCount,
        reportTypes, filteredReports,
        fetchAll, fetchById, generate, remove,
    };
});
