import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { usePaymentsStore } from '../../payments/application/payments.store.js';
import { usePosStore } from '../../pos/application/pos.store.js';
import { useTablesStore } from '../../tables/application/tables.store.js';
import { useStationsStore } from '../../stations/application/stations.store.js';
import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';
import { useInventoryStore } from '../../inventory/application/inventory.store.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { pickOldestActiveBranch } from '../../branches/domain/branch-selection.helpers.js';
import { SESSION_KEYS } from '../../shared/infrastructure/session-storage.js';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error.js';
import { dashboardApi } from '../infrastructure/api/dashboard.api.js';
import { DashboardMetricAssembler } from '../infrastructure/assemblers/dashboard-metric.assembler.js';
import { DashboardComparisonAssembler } from '../infrastructure/assemblers/dashboard-comparison.assembler.js';
import { COMPARISON_PERIOD_NONE } from '../domain/models/dashboard-comparison.entity.js';
import { buildOperationalMetricsFromClientStores } from './dashboard-metrics.builder.js';
import {
    buildOperationalAlerts,
    buildPaymentMethodRows,
} from './dashboard-operational.helpers.js';
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
    formatDashboardDateShort,
    formatRelativeTime,
    formatReservationTime,
    getOrderStatusMeta,
    getReservationStatusMeta,
} from './dashboard-view.helpers.js';
import { useDashboardFacade } from './dashboard.facade.js';

export const useDashboardStore = defineStore('dashboard', () => {
    const paymentsStore = usePaymentsStore();
    const posStore = usePosStore();
    const tablesStore = useTablesStore();
    const stationsStore = useStationsStore();
    const cashRegisterStore = useCashRegisterStore();
    const inventoryStore = useInventoryStore();
    const facade = useDashboardFacade();

    const ownerViewBootstrapping = ref(false);
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

    /**
     * Sucursal cuyas mtricas muestra el dashboard (OWNER).
     * Independiente de iam.activeBranchId usado en POS/caja/etc.
     */
    const viewBranchId = ref(
        sessionStorage.getItem(SESSION_KEYS.DASHBOARD_VIEW_BRANCH) ?? null,
    );

    function effectiveViewBranchId() {
        const iamStore = useIamStore();
        if (iamStore.isOwner && viewBranchId.value) {
            return viewBranchId.value;
        }
        return iamStore.activeBranchId;
    }

    function setViewBranchId(branchId) {
        viewBranchId.value = branchId ?? null;
        if (branchId) {
            sessionStorage.setItem(SESSION_KEYS.DASHBOARD_VIEW_BRANCH, branchId);
        } else {
            sessionStorage.removeItem(SESSION_KEYS.DASHBOARD_VIEW_BRANCH);
        }
    }

    /** OWNER: sucursal ms antigua por defecto si an no hay vista elegida. */
    function initOwnerViewBranch(activeBranches) {
        const iamStore = useIamStore();
        if (!iamStore.isOwner || !activeBranches?.length) return;

        const stillValid = viewBranchId.value
            && activeBranches.some((b) => String(b.id) === String(viewBranchId.value));
        if (stillValid) return;

        const oldest = pickOldestActiveBranch(activeBranches);
        if (oldest) setViewBranchId(oldest.id);
    }

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
        buildUpcomingReservations(tablesStore.activeReservations ?? []),
    );

    const alertCards = computed(() =>
        buildAlertCards(metrics.value, upcomingReservations.value.length),
    );

    async function loadSupplementaryData() {
        const businessDate = metrics.value?.businessDate ?? new Date().toISOString().slice(0, 10);
        await Promise.all([
            paymentsStore.fetchAllSilent(),
            tablesStore.fetchByDateSilent(businessDate),
        ]);
        if (metricsSource.value === 'client') {
            await posStore.fetchAll().catch(() => {});
        }
    }

    async function loadClientMetrics() {
        const iamStore = useIamStore();
        const branchId = effectiveViewBranchId();
        if (iamStore.isOwner && branchId && String(branchId) !== String(iamStore.activeBranchId)) {
            throw new Error('Vista de otra sucursal: use mtricas del servidor');
        }
        requireActiveBranchId();
        const today = new Date().toISOString().slice(0, 10);
        await Promise.all([
            paymentsStore.fetchAll(),
            tablesStore.fetchAll(),
            posStore.fetchAll(),
            stationsStore.fetchAll(),
            cashRegisterStore.fetchAll(),
            inventoryStore.fetchAll?.() ?? Promise.resolve(),
            tablesStore.fetchByDate(today).catch(() => {}),
        ]);
        metrics.value = buildOperationalMetricsFromClientStores({
            paymentsStore,
            posStore,
            tablesStore,
            stationsStore,
            cashRegisterStore,
            inventoryStore,
            reservationsCount: tablesStore.activeReservations?.length ?? 0,
            businessDate: today,
        });
        metricsSource.value = 'client';
    }

    async function loadApiMetrics() {
        const branchId = effectiveViewBranchId();
        if (!branchId) throw new Error('Sin sucursal para el dashboard');
        const response = await dashboardApi.getMetrics(branchId);
        metrics.value = DashboardMetricAssembler.toEntityFromResponse(response);
        metricsSource.value = 'api';
    }

    async function fetchComparison(period = comparisonPeriod.value) {
        if (!period || period === COMPARISON_PERIOD_NONE) {
            comparison.value = null;
            comparisonError.value = null;
            comparisonLoading.value = false;
            return;
        }
        const branchId = effectiveViewBranchId();
        if (!branchId) {
            comparison.value = null;
            comparisonError.value = null;
            comparisonLoading.value = false;
            return;
        }
        comparisonLoading.value = true;
        comparisonError.value = null;
        comparisonPeriod.value = period;
        try {
            const response = await dashboardApi.getComparison(branchId, { compare: period });
            comparison.value = DashboardComparisonAssembler.toEntityFromResponse(response);
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
        const branchId = effectiveViewBranchId();
        if (!branchId) {
            metrics.value = null;
            comparison.value = null;
            error.value = null;
            isLoading.value = false;
            return;
        }

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

    async function bootstrapOwnerView() {
        if (!facade.isOwner.value) {
            return { ready: facade.hasBranchSelected.value };
        }
        ownerViewBootstrapping.value = true;
        try {
            await facade.ensureBranchesLoaded();
            initOwnerViewBranch(facade.activeBranches.value);
            return { ready: !!viewBranchId.value };
        } finally {
            ownerViewBootstrapping.value = false;
        }
    }

    function compareOptionsForEntitlements(entitlements) {
        return facade.compareOptionsForEntitlements(entitlements);
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
        viewBranchId,
        setViewBranchId,
        initOwnerViewBranch,
        fetchAll,
        fetchComparison,
        setComparisonPeriod,
        handleOperationalEvent,
        ownerViewBootstrapping,
        isOwner: facade.isOwner,
        hasBranchSelected: facade.hasBranchSelected,
        userGreetingName: facade.userGreetingName,
        ownerBranchOptions: facade.ownerBranchOptions,
        bootstrapOwnerView,
        compareOptionsForEntitlements,
        comparisonPeriodNone: facade.COMPARISON_PERIOD_NONE,
        formatDashboardDateShort,
        formatRelativeTime,
        formatReservationTime,
        getOrderStatusMeta,
        getReservationStatusMeta,
    };
});
