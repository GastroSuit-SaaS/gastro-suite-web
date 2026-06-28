import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { usePaymentsStore } from '../../payments/application/payments.store.js';
import { usePosStore } from '../../pos/application/pos.store.js';
import { useTablesStore } from '../../tables/application/tables.store.js';
import { useStationsStore } from '../../stations/application/stations.store.js';
import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';
import { useInventoryStore } from '../../inventory/application/inventory.store.js';
import { useReservationsStore } from '../../tables/application/reservations.store.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';
import { dashboardApi } from '../infrastructure/api/dashboard.api.js';
import { DashboardMetricAssembler } from '../infrastructure/assemblers/dashboard-metric.assembler.js';
import { DashboardComparisonAssembler } from '../infrastructure/assemblers/dashboard-comparison.assembler.js';
import { COMPARISON_PERIOD_NONE } from '../domain/models/dashboard-comparison.entity.js';
import { buildOperationalMetricsFromClientStores } from './dashboard-metrics.builder.js';
import {
    buildOperationalAlerts,
    buildPaymentMethodRows,
} from '../presentation/constants/dashboard.constants-ui.js';
import {
    buildAlertCards,
    buildChannelBreakdown,
    buildDonutGradient,
    buildHourlySalesSeries,
    buildRecentOrdersFromPayments,
    buildRecentOrdersFromSales,
    buildTopProductsWithRevenue,
    buildUpcomingReservations,
    buildAreaChartPath,
    buildAreaChartLinePath,
    estimateCovers,
} from '../presentation/helpers/dashboard-view.helpers.js';

export const useDashboardStore = defineStore('dashboard', () => {
    const paymentsStore = usePaymentsStore();
    const posStore = usePosStore();
    const tablesStore = useTablesStore();
    const stationsStore = useStationsStore();
    const cashRegisterStore = useCashRegisterStore();
    const inventoryStore = useInventoryStore();
    const reservationsStore = useReservationsStore();

    const isLoading = ref(false);
    const error = ref(null);
    /** api | client */
    const metricsSource = ref('client');
    /** @type {import('../domain/models/dashboard-metric.entity.js').OperationalMetrics|null} */
    const metrics = ref(null);

    const comparisonLoading = ref(false);
    const comparisonError = ref(null);
    const comparisonPeriod = ref(COMPARISON_PERIOD_NONE);
    /** @type {import('../domain/models/dashboard-comparison.entity.js').DashboardComparison|null} */
    const comparison = ref(null);

    const paymentMethodRows = computed(() =>
        buildPaymentMethodRows(metrics.value?.sales?.byMethod, metrics.value?.sales?.revenue ?? 0),
    );

    const operationalAlerts = computed(() => buildOperationalAlerts(metrics.value));

    const estimatedCovers = computed(() => estimateCovers(metrics.value?.diningRoom));

    const hourlySalesSeries = computed(() =>
        buildHourlySalesSeries(paymentsStore.todaysPayments ?? []),
    );

    const salesAreaPath = computed(() => buildAreaChartPath(hourlySalesSeries.value));

    const salesLinePath = computed(() => buildAreaChartLinePath(hourlySalesSeries.value));

    const channelBreakdown = computed(() =>
        buildChannelBreakdown(
            paymentsStore.todaysPayments ?? [],
            metrics.value?.sales?.revenue ?? 0,
        ),
    );

    const channelDonutStyle = computed(() => ({
        background: buildDonutGradient(channelBreakdown.value),
    }));

    const topProducts = computed(() =>
        buildTopProductsWithRevenue(
            metrics.value?.sales?.topItems ?? [],
            metrics.value?.sales?.revenue ?? 0,
        ),
    );

    const recentOrders = computed(() => {
        const fromPayments = buildRecentOrdersFromPayments(paymentsStore.todaysPayments ?? []);
        if (fromPayments.length) return fromPayments;
        return buildRecentOrdersFromSales(posStore.sales ?? []);
    });

    const upcomingReservations = computed(() =>
        buildUpcomingReservations(reservationsStore.activeReservations ?? []),
    );

    const alertCards = computed(() =>
        buildAlertCards(metrics.value, upcomingReservations.value.length),
    );

    async function loadSupplementaryData() {
        const businessDate = metrics.value?.businessDate ?? new Date().toISOString().slice(0, 10);
        await Promise.all([
            paymentsStore.fetchAllSilent(),
            reservationsStore.fetchByDateSilent(businessDate),
        ]);
        if (metricsSource.value === 'client') {
            await posStore.fetchAll().catch(() => {});
        }
    }

    async function loadClientMetrics() {
        const today = new Date().toISOString().slice(0, 10);
        await Promise.all([
            paymentsStore.fetchAll(),
            tablesStore.fetchAll(),
            posStore.fetchAll(),
            stationsStore.fetchAll(),
            cashRegisterStore.fetchAll(),
            inventoryStore.fetchAll?.() ?? Promise.resolve(),
            reservationsStore.fetchByDate(today).catch(() => {}),
        ]);
        metrics.value = buildOperationalMetricsFromClientStores({
            paymentsStore,
            posStore,
            tablesStore,
            stationsStore,
            cashRegisterStore,
            inventoryStore,
            reservationsCount: reservationsStore.activeReservations?.length ?? 0,
            businessDate: today,
        });
        metricsSource.value = 'client';
    }

    async function loadApiMetrics() {
        const branchId = requireActiveBranchId();
        const response = await dashboardApi.getMetrics(branchId);
        metrics.value = DashboardMetricAssembler.fromApiResponse(response);
        metricsSource.value = 'api';
    }

    async function fetchComparison(period = comparisonPeriod.value) {
        if (!period || period === COMPARISON_PERIOD_NONE) {
            comparison.value = null;
            comparisonError.value = null;
            comparisonLoading.value = false;
            return;
        }
        comparisonLoading.value = true;
        comparisonError.value = null;
        comparisonPeriod.value = period;
        try {
            const branchId = requireActiveBranchId();
            const response = await dashboardApi.getComparison(branchId, { compare: period });
            comparison.value = DashboardComparisonAssembler.fromApiResponse(response);
        } catch (e) {
            comparisonError.value = getApiErrorMessage(e, 'Error al cargar la comparativa');
        } finally {
            comparisonLoading.value = false;
        }
    }

    function setComparisonPeriod(period) {
        comparisonPeriod.value =
            period === '' || period == null ? COMPARISON_PERIOD_NONE : period;
    }

    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            try {
                await loadApiMetrics();
            } catch {
                await loadClientMetrics();
            }
            await loadSupplementaryData();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar el dashboard');
        } finally {
            isLoading.value = false;
        }
    }

    async function handleOperationalEvent() {
        try {
            if (metricsSource.value === 'api') {
                await loadApiMetrics();
            } else {
                await loadClientMetrics();
            }
        } catch { /* tolera fallos parciales en refresh */ }
    }

    return {
        isLoading,
        error,
        metricsSource,
        metrics,
        paymentMethodRows,
        operationalAlerts,
        estimatedCovers,
        hourlySalesSeries,
        salesAreaPath,
        salesLinePath,
        channelBreakdown,
        channelDonutStyle,
        topProducts,
        recentOrders,
        upcomingReservations,
        alertCards,
        comparisonLoading,
        comparisonError,
        comparisonPeriod,
        comparison,
        fetchAll,
        fetchComparison,
        setComparisonPeriod,
        handleOperationalEvent,
    };
});
