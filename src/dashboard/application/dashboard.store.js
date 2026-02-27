import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { DashboardApi } from '../infrastructure/api/dashboard.api.js';
import { DashboardMetricAssembler } from '../infrastructure/assemblers/dashboard-metric.assembler.js';

const api = new DashboardApi();

export const useDashboardStore = defineStore('dashboard', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const metrics   = ref([]);
    const isLoading = ref(false);
    const error     = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const hasMetrics = computed(() => metrics.value.length > 0);

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        // TODO: implement – call api.getAll(), transform via DashboardMetricAssembler
    }

    return { metrics, isLoading, error, hasMetrics, fetchAll };
});
