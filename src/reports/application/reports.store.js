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
        // TODO: call api.getAll(), transform via ReportAssembler.toEntitiesFromResponse
    }

    async function fetchById(id) {
        // TODO: call api.getById(id), transform via ReportAssembler.toEntityFromResource
    }

    async function generate(reportData) {
        // TODO: call api.create(reportData), set as selectedReport
    }

    return { reports, selectedReport, isLoading, error, hasReports, fetchAll, fetchById, generate };
});
