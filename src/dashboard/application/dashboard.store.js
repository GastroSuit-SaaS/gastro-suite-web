import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { usePaymentsStore } from '../../payments/application/payments.store.js';
import { usePosStore }      from '../../pos/application/pos.store.js';
import { useTablesStore }   from '../../tables/application/tables.store.js';
import { useStationsStore } from '../../stations/application/stations.store.js';
import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';

export const useDashboardStore = defineStore('dashboard', () => {

    // ── Sub-stores ────────────────────────────────────────────────────────
    const paymentsStore = usePaymentsStore();
    const posStore      = usePosStore();
    const tablesStore   = useTablesStore();
    const stationsStore = useStationsStore();
    const cashRegisterStore = useCashRegisterStore();

    // ── State ─────────────────────────────────────────────────────────────
    const isLoading = ref(false);
    const error     = ref(null);

    // ── Aggregated Getters ────────────────────────────────────────────────
    const todayRevenue      = computed(() => paymentsStore.todayTotal);
    const todayPaymentCount = computed(() => paymentsStore.todayCount);
    const todayByMethod     = computed(() => paymentsStore.todayByMethod ?? {});
    const todaysPayments    = computed(() => paymentsStore.todaysPayments);

    const avgTicket = computed(() => {
        const count = todayPaymentCount.value;
        return count > 0 ? todayRevenue.value / count : 0;
    });

    const topItems = computed(() => {
        const counts = {};
        todaysPayments.value.forEach(p => {
            p.items?.forEach(item => {
                counts[item.name] = (counts[item.name] ?? 0) + (item.qty ?? 1);
            });
        });
        return Object.entries(counts)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
    });

    const paymentMethodRows = computed(() => {
        const map = todayByMethod.value;
        return Object.entries(map)
            .filter(([, v]) => v > 0)
            .map(([method, total]) => ({
                method,
                label: method.charAt(0).toUpperCase() + method.slice(1),
                total,
                icon: { cash: 'pi-money-bill', card: 'pi-credit-card', yape: 'pi-mobile', plin: 'pi-mobile' }[method] ?? 'pi-wallet',
            }))
            .sort((a, b) => b.total - a.total);
    });

    // Tables
    const occupiedTablesCount = computed(() => tablesStore.occupiedTables?.length ?? 0);

    // POS
    const activeOrdersCount = computed(() => posStore.activeOrders?.length ?? posStore.totalInProcess ?? 0);

    // Stations / Kitchen
    const readyCount        = computed(() => stationsStore.readyCount);
    const receivedTickets   = computed(() => stationsStore.receivedTickets ?? []);
    const preparingTickets  = computed(() => stationsStore.preparingTickets ?? []);
    const totalToday        = computed(() => stationsStore.totalToday);
    const activeStations    = computed(() => stationsStore.activeStations ?? []);
    const tickets           = computed(() => stationsStore.tickets ?? []);

    // Cash Register
    const hasOpenSession      = computed(() => cashRegisterStore.hasOpenSession);
    const sessionExpectedCash = computed(() => cashRegisterStore.sessionExpectedCash);
    const sessionSalesCount   = computed(() => cashRegisterStore.sessionSalesCount);
    const sessionBalance      = computed(() => cashRegisterStore.sessionBalance);
    const currentShiftName    = computed(() => cashRegisterStore.currentSession?.shiftName ?? '');

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            await Promise.all([
                paymentsStore.fetchAll(),
                tablesStore.fetchAll(),
                posStore.fetchAll(),
                stationsStore.fetchAll(),
                cashRegisterStore.fetchAll(),
            ]);
        } catch (e) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading, error,
        // Payments aggregation
        todayRevenue, todayPaymentCount, todayByMethod, todaysPayments,
        avgTicket, topItems, paymentMethodRows,
        // Tables aggregation
        occupiedTablesCount,
        // POS aggregation
        activeOrdersCount,
        // Kitchen aggregation
        readyCount, receivedTickets, preparingTickets, totalToday,
        activeStations, tickets,
        // Cash register aggregation
        hasOpenSession, sessionExpectedCash, sessionSalesCount, sessionBalance, currentShiftName,
        // Actions
        fetchAll,
    };
});
