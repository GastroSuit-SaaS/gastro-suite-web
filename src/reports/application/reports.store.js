import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ReportsApi } from '../infrastructure/api/reports.api.js';
import { ReportAssembler } from '../infrastructure/assemblers/report.assembler.js';

const api = new ReportsApi();

export const useReportsStore = defineStore('reports', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const reports        = ref([]);
    const selectedReport = ref(null);
    const isLoading      = ref(false);
    const error          = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const hasReports = computed(() => reports.value.length > 0);

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getAll();
            reports.value = ReportAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = e;
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
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    async function generate(reportData) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.generate(reportData);
            const report = ReportAssembler.toEntityFromResponse(response);
            if (report) {
                reports.value.unshift(report);
                selectedReport.value = report;
            }
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    return { reports, selectedReport, isLoading, error, hasReports, fetchAll, fetchById, generate };
});
