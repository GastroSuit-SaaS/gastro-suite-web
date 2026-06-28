<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../../application/dashboard.store.js'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useBranchesStore } from '../../../branches/application/branches.store.js'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'
import DashboardComparisonPanel from '../components/dashboard-comparison-panel.vue'
import { DASHBOARD_COMPARE_OPTIONS, COMPARISON_PERIOD_NONE } from '../../domain/models/dashboard-comparison.entity.js'
import {
    DASHBOARD_MESSAGES,
    formatDashboardGreeting,
} from '../constants/dashboard.constants-ui.js'
import {
    COMPARISON_UI,
    getComparisonTitle,
} from '../constants/dashboard-comparison.constants-ui.js'
import {
    formatDashboardDateShort,
    formatRelativeTime,
    formatReservationTime,
    getOrderStatusMeta,
    getReservationStatusMeta,
} from '../helpers/dashboard-view.helpers.js'
import { useSubscriptionEntitlements } from '../../../shared/composables/use-subscription-entitlements.js'

const store = useDashboardStore()
const route = useRoute()
const router = useRouter()
const iamStore = useIamStore()
const branchesStore = useBranchesStore()
const { entitlements } = useSubscriptionEntitlements()
const ownerViewBootstrapping = ref(false)

const ownerBranchOptions = computed(() => {
    const sorted = [...branchesStore.activeBranches].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER
        if (ta !== tb) return ta - tb
        return String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''))
    })
    return sorted.map((branch) => ({
        label: branch.nombre,
        value: branch.id,
    }))
})

const branchOptions = computed(() =>
    iamStore.isOwner ? ownerBranchOptions.value : [],
)

const selectedBranchId = computed({
    get: () => store.viewBranchId,
    set: (branchId) => {
        if (!branchId || String(branchId) === String(store.viewBranchId)) return
        store.setViewBranchId(branchId)
    },
})

const needsBranchSelection = computed(
    () => iamStore.isOwner && !store.viewBranchId && !ownerViewBootstrapping.value,
)

const pageLoading = computed(() =>
    ownerViewBootstrapping.value
        ? true
        : (needsBranchSelection.value
            ? false
            : (isComparisonMode.value ? store.comparisonLoading : store.isLoading)),
)

const compareOptions = computed(() => {
    if (!entitlements.value.hasDashboardComparison) {
        return DASHBOARD_COMPARE_OPTIONS.filter((o) => o.value === COMPARISON_PERIOD_NONE)
    }
    return DASHBOARD_COMPARE_OPTIONS
})

const isComparisonMode = computed(
    () =>
        Boolean(store.comparisonPeriod)
        && store.comparisonPeriod !== COMPARISON_PERIOD_NONE,
)

const pageError = computed(() =>
    isComparisonMode.value ? store.comparisonError : store.error,
)

function retryLoad() {
    if (isComparisonMode.value) {
        store.fetchComparison()
        return
    }
    store.fetchAll()
}

function applyCompareFromQuery() {
    const compare = route.query.compare
    if (typeof compare !== 'string' || !compare) return
    if (!entitlements.value.hasDashboardComparison) return
    const valid = compareOptions.value.some((option) => option.value === compare)
    if (!valid) return
    store.setComparisonPeriod(compare)
}

async function bootstrapOwnerDashboardView() {
    if (!iamStore.isOwner) return

    ownerViewBootstrapping.value = true
    try {
        if (!branchesStore.items.length) {
            await branchesStore.fetchAll()
        }
        store.initOwnerViewBranch(branchesStore.activeBranches)
    } finally {
        ownerViewBootstrapping.value = false
    }
}

onMounted(async () => {
    if (iamStore.isOwner) {
        await bootstrapOwnerDashboardView()
        if (!store.viewBranchId) return
    } else if (!iamStore.hasBranchSelected) {
        return
    }
    await store.fetchAll()
    applyCompareFromQuery()
})

watch(
    () => store.viewBranchId,
    async (branchId, previous) => {
        if (!branchId || String(branchId) === String(previous)) return
        await store.fetchAll()
        if (store.comparisonPeriod && store.comparisonPeriod !== COMPARISON_PERIOD_NONE) {
            await store.fetchComparison()
        }
    },
)

watch(
    () => entitlements.value.hasDashboardComparison,
    (allowed) => {
        if (!allowed && store.comparisonPeriod !== COMPARISON_PERIOD_NONE) {
            store.setComparisonPeriod(COMPARISON_PERIOD_NONE)
        }
    },
    { immediate: true },
)

watch(
    () => store.comparisonPeriod,
    (period, previous) => {
        if (period === previous) return
        store.fetchComparison(period)
        const nextQuery = { ...route.query }
        if (period && period !== COMPARISON_PERIOD_NONE) nextQuery.compare = period
        else delete nextQuery.compare
        router.replace({ query: nextQuery })
    },
)

const m = computed(() => store.metrics)
const sales = computed(() => m.value?.sales)
const diningRoom = computed(() => m.value?.diningRoom)
const kitchen = computed(() => m.value?.kitchen)

const greeting = computed(() =>
    formatDashboardGreeting(iamStore.currentUser?.nombres || iamStore.currentUser?.username),
)

const dateLabel = computed(() =>
    formatDashboardDateShort(store.comparison?.businessDate ?? m.value?.businessDate),
)

const metricsSourceLabel = computed(() =>
    store.metricsSource === 'api' ? 'Datos del servidor' : 'Estimación local',
)
const metricsSourceIsClient = computed(() => store.metricsSource === 'client')

const formatSoles = (n) => `S/ ${Number(n ?? 0).toFixed(2)}`

const kpiCards = computed(() => [
    {
        key: 'revenue',
        label: 'Ventas totales',
        value: formatSoles(sales.value?.revenue),
        icon: 'pi-dollar',
        tone: 'purple',
    },
    {
        key: 'orders',
        label: 'Pedidos',
        value: String(sales.value?.paymentCount ?? 0),
        icon: 'pi-shopping-bag',
        tone: 'blue',
    },
    {
        key: 'ticket',
        label: 'Ticket promedio',
        value: formatSoles(sales.value?.avgTicket),
        icon: 'pi-chart-line',
        tone: 'green',
    },
    {
        key: 'covers',
        label: 'Comensales est.',
        value: String(store.estimatedCovers),
        icon: 'pi-users',
        tone: 'orange',
    },
])

const salonOps = computed(() => [
    { label: 'Mesas ocupadas', value: `${diningRoom.value?.occupiedTables ?? 0}/${diningRoom.value?.totalTables ?? 0}` },
    { label: 'Ocupación', value: `${diningRoom.value?.occupancyRate ?? 0}%` },
    { label: 'Comandas abiertas', value: diningRoom.value?.activeOrders ?? 0 },
    { label: 'Reservas hoy', value: diningRoom.value?.reservationsToday ?? 0 },
])

const kitchenOps = computed(() => [
    { label: 'Recibidos', value: kitchen.value?.received ?? 0 },
    { label: 'Preparando', value: kitchen.value?.preparing ?? 0 },
    { label: 'Listos', value: kitchen.value?.ready ?? 0 },
    { label: 'Comandas', value: kitchen.value?.totalToday ?? 0 },
])

function goTo(path) {
    router.push(path)
}
</script>

<template>
    <module-state-feedback
        :loading="pageLoading"
        :error="pageError"
        :loading-label="ownerViewBootstrapping ? 'Preparando dashboard…' : (isComparisonMode ? COMPARISON_UI.LOADING : DASHBOARD_MESSAGES.LOADING)"
        @retry="retryLoad()"
    >
        <div v-if="needsBranchSelection" class="dash dash--empty-branch">
            <header class="dash__hero dash__hero--pick">
                <p class="dash__greeting">{{ greeting }}</p>
                <h2 class="dash__pick-title">Sin sucursales activas</h2>
                <p class="dash__pick-sub">
                    Crea al menos una sucursal para ver el dashboard de tu negocio.
                </p>
            </header>
            <pv-button label="Ir a Sucursales" icon="pi pi-building" @click="goTo('/branches')" />
        </div>

        <div v-else-if="m || isComparisonMode" class="dash">

            <!-- Encabezado -->
            <header class="dash__hero">
                <div class="dash__hero-row">
                    <div class="dash__hero-main">
                        <p class="dash__greeting">{{ greeting }}</p>
                        <p v-if="isComparisonMode && store.comparison" class="dash__compare-title">
                            {{ getComparisonTitle(store.comparison.compareWith) }}
                        </p>
                    </div>
                    <div class="dash__hero-actions">
                        <pv-select
                            v-if="iamStore.isOwner && branchOptions.length"
                            v-model="selectedBranchId"
                            :options="branchOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Sucursal"
                            class="dash__branch-select"
                            aria-label="Sucursal del dashboard"
                        />
                        <span
                            class="dash__date-chip"
                            :class="{ 'dash__source-chip--client': metricsSourceIsClient }"
                            :title="metricsSourceIsClient ? 'Dashboard API no disponible; cifras estimadas desde datos locales' : ''"
                        >
                            <i :class="metricsSourceIsClient ? 'pi pi-wifi-off' : 'pi pi-server'"></i>
                            {{ metricsSourceLabel }}
                        </span>
                        <span class="dash__date-chip">
                            <i class="pi pi-calendar"></i>
                            {{ dateLabel }}
                        </span>
                        <pv-select
                            v-model="store.comparisonPeriod"
                            :options="compareOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Sin comparar"
                            class="dash__compare-select"
                            aria-label="Comparar periodo"
                        />
                    </div>
                </div>
            </header>

            <dashboard-comparison-panel v-if="isComparisonMode && store.comparison" />

            <template v-else-if="m">
            <section class="dash__kpis">
                <article
                    v-for="card in kpiCards"
                    :key="card.key"
                    :class="['kpi', `kpi--${card.tone}`]"
                >
                    <div class="kpi__icon"><i :class="['pi', card.icon]"></i></div>
                    <div class="kpi__body">
                        <p class="kpi__label">{{ card.label }}</p>
                        <p class="kpi__value">{{ card.value }}</p>
                    </div>
                </article>
            </section>

            <!-- Gráficos + alertas -->
            <section class="dash__analytics">
                <article class="panel panel--wide">
                    <div class="panel__head">
                        <div>
                            <h2>Ventas</h2>
                            <p>Evolución del día por hora</p>
                        </div>
                        <span class="panel__pill">Ventas totales</span>
                    </div>
                    <div class="chart-area">
                        <svg
                            v-if="store.salesAreaPath"
                            class="chart-area__svg"
                            viewBox="0 0 100 40"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <defs>
                                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#7c5cfc" stop-opacity="0.35" />
                                    <stop offset="100%" stop-color="#7c5cfc" stop-opacity="0.02" />
                                </linearGradient>
                            </defs>
                            <path :d="store.salesAreaPath" fill="url(#salesFill)" />
                            <path
                                :d="store.salesLinePath"
                                fill="none"
                                stroke="#7c5cfc"
                                stroke-width="0.6"
                            />
                        </svg>
                        <div v-else class="panel__empty">Sin cobros registrados para graficar</div>
                        <div class="chart-area__axis">
                            <span>00:00</span>
                            <span>06:00</span>
                            <span>12:00</span>
                            <span>18:00</span>
                            <span>24:00</span>
                        </div>
                    </div>
                </article>

                <div class="dash__side-stack">
                    <article class="panel">
                        <div class="panel__head">
                            <div>
                                <h2>Ventas por canal</h2>
                                <p>Salón vs para llevar</p>
                            </div>
                        </div>
                        <div class="channel">
                            <div class="channel__donut" :style="store.channelDonutStyle">
                                <div class="channel__donut-hole">
                                    <span class="channel__donut-total">{{ formatSoles(sales?.revenue) }}</span>
                                    <span class="channel__donut-label">Total</span>
                                </div>
                            </div>
                            <ul class="channel__legend">
                                <li v-for="row in store.channelBreakdown" :key="row.key">
                                    <span class="channel__dot" :style="{ background: row.color }"></span>
                                    <span class="channel__name">{{ row.label }}</span>
                                    <span class="channel__pct">{{ row.percent.toFixed(0) }}%</span>
                                    <span class="channel__amount">{{ formatSoles(row.amount) }}</span>
                                </li>
                            </ul>
                        </div>
                    </article>

                    <article class="panel">
                        <div class="panel__head">
                            <div>
                                <h2>Alertas</h2>
                                <p>Atención operativa</p>
                            </div>
                        </div>
                        <ul v-if="store.alertCards.length" class="alerts">
                            <li
                                v-for="alert in store.alertCards"
                                :key="alert.key"
                                :class="['alert-item', `alert-item--${alert.tone}`]"
                            >
                                <span class="alert-item__icon"><i :class="['pi', alert.icon]"></i></span>
                                <div>
                                    <p class="alert-item__title">{{ alert.title }}</p>
                                    <p class="alert-item__detail">{{ alert.detail }}</p>
                                </div>
                            </li>
                        </ul>
                        <div v-else class="panel__empty panel__empty--compact">Sin alertas por ahora</div>
                    </article>
                </div>
            </section>

            <!-- Operación salón + cocina -->
            <section class="dash__ops">
                <article class="panel">
                    <div class="panel__head">
                        <div>
                            <h2>Salón</h2>
                            <p>Estado del servicio en piso</p>
                        </div>
                        <button type="button" class="panel__link" @click="goTo('/tables')">Ver mesas</button>
                    </div>
                    <div class="ops-grid">
                        <div v-for="item in salonOps" :key="item.label" class="ops-grid__item">
                            <span class="ops-grid__label">{{ item.label }}</span>
                            <span class="ops-grid__value">{{ item.value }}</span>
                        </div>
                    </div>
                </article>
                <article class="panel">
                    <div class="panel__head">
                        <div>
                            <h2>Cocina</h2>
                            <p>Pipeline del pass</p>
                        </div>
                        <button type="button" class="panel__link" @click="goTo('/stations')">Ver estaciones</button>
                    </div>
                    <div class="ops-grid">
                        <div v-for="item in kitchenOps" :key="item.label" class="ops-grid__item">
                            <span class="ops-grid__label">{{ item.label }}</span>
                            <span class="ops-grid__value">{{ item.value }}</span>
                        </div>
                    </div>
                    <div v-if="kitchen?.stations?.length" class="station-tags">
                        <span
                            v-for="st in kitchen.stations"
                            :key="st.stationId"
                            class="station-tag"
                        >
                            <i :style="{ background: st.stationColor }"></i>
                            {{ st.stationName }} · {{ st.ticketCount }}
                        </span>
                    </div>
                </article>
            </section>

            <!-- Listas inferiores -->
            <section class="dash__lists">
                <article class="panel">
                    <div class="panel__head">
                        <div>
                            <h2>Pedidos recientes</h2>
                            <p>Últimos cobros del día</p>
                        </div>
                        <button type="button" class="panel__link" @click="goTo('/payments')">Ver todos</button>
                    </div>
                    <ul v-if="store.recentOrders.length" class="list-rows">
                        <li v-for="order in store.recentOrders" :key="`${order.id}-${order.processedAt}`" class="list-row">
                            <span class="list-row__avatar"><i class="pi pi-receipt"></i></span>
                            <div class="list-row__main">
                                <p class="list-row__title">#{{ order.id }} · {{ order.customer }}</p>
                                <p class="list-row__sub">{{ order.location }} · {{ formatRelativeTime(order.processedAt) }}</p>
                            </div>
                            <span :class="['badge', `badge--${getOrderStatusMeta(order.status).tone}`]">
                                {{ getOrderStatusMeta(order.status).label }}
                            </span>
                            <span class="list-row__amount">{{ formatSoles(order.amount) }}</span>
                        </li>
                    </ul>
                    <div v-else class="panel__empty panel__empty--compact">Aún no hay pedidos registrados hoy</div>
                </article>

                <article class="panel">
                    <div class="panel__head">
                        <div>
                            <h2>Productos más vendidos</h2>
                            <p>Top del día</p>
                        </div>
                    </div>
                    <ul v-if="store.topProducts.length" class="list-rows">
                        <li v-for="item in store.topProducts" :key="item.itemId ?? item.name" class="list-row list-row--product">
                            <span class="list-row__rank">{{ item.rank }}</span>
                            <div class="list-row__thumb"><i class="pi pi-image"></i></div>
                            <div class="list-row__main">
                                <p class="list-row__title">{{ item.name }}</p>
                                <p class="list-row__sub">{{ item.quantity }} vendidos</p>
                            </div>
                            <span class="list-row__amount">{{ formatSoles(item.revenue) }}</span>
                        </li>
                    </ul>
                    <div v-else class="panel__empty panel__empty--compact">Sin ventas para rankear productos</div>
                </article>

                <article class="panel">
                    <div class="panel__head">
                        <div>
                            <h2>Próximas reservas</h2>
                            <p>Agenda del salón</p>
                        </div>
                        <button type="button" class="panel__link" @click="goTo('/tables/reservations')">Ver agenda</button>
                    </div>
                    <ul v-if="store.upcomingReservations.length" class="list-rows">
                        <li
                            v-for="res in store.upcomingReservations"
                            :key="res.id"
                            class="list-row"
                        >
                            <span class="list-row__avatar list-row__avatar--calendar"><i class="pi pi-calendar"></i></span>
                            <div class="list-row__main">
                                <p class="list-row__title">{{ formatReservationTime(res.reservedAt) }} · {{ res.guestName }}</p>
                                <p class="list-row__sub">
                                    {{ res.partySize }} personas
                                    <template v-if="res.tableNumber"> · Mesa {{ res.tableNumber }}</template>
                                </p>
                            </div>
                            <span :class="['badge', `badge--${getReservationStatusMeta(res.status).tone}`]">
                                {{ getReservationStatusMeta(res.status).label }}
                            </span>
                        </li>
                    </ul>
                    <div v-else class="panel__empty panel__empty--compact">No hay reservas próximas</div>
                </article>
            </section>
            </template>
        </div>
    </module-state-feedback>
</template>

<style scoped>
.dash {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem 1.5rem 2rem;
    background: #f4f6fb;
    min-height: 100%;
}

.dash__hero {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.dash__hero-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.dash__hero-main {
    flex: 1 1 auto;
    min-width: 0;
}

.dash__hero-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65rem;
    flex: 0 0 auto;
    margin-left: auto;
}

.dash__compare-title {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: #6d28d9;
}

.dash__compare-select,
.dash__branch-select {
    min-width: 180px;
}

.dash--empty-branch,
.dash--pick-branch {
    max-width: 32rem;
    margin: 0 auto;
    padding-top: 2.5rem;
    text-align: center;
}

.dash__hero--pick {
    text-align: center;
    margin-bottom: 1.5rem;
}

.dash__pick-title {
    margin: 0.5rem 0 0;
    font-size: 1.35rem;
    font-weight: 800;
    color: #111827;
}

.dash__pick-sub {
    margin: 0.65rem 0 0;
    font-size: 0.9rem;
    color: #6b7280;
    line-height: 1.5;
}

.dash__pick-control {
    background: #fff;
    border: 1px solid #eef0f4;
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.dash__pick-label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: #374151;
}

.dash__pick-hint {
    margin: 0.75rem 0 0;
    font-size: 0.82rem;
    color: #9ca3af;
}

@media (max-width: 768px) {
    .dash__hero-row {
        flex-direction: column;
        align-items: stretch;
    }

    .dash__hero-actions {
        margin-left: 0;
        justify-content: flex-start;
        flex-wrap: wrap;
    }
}

.dash__greeting {
    margin: 0;
    font-size: 1.65rem;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.02em;
}

.dash__date-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    background: #fff;
    border: 1px solid #e5e7eb;
    font-size: 0.82rem;
    font-weight: 600;
    color: #374151;
    white-space: nowrap;
}

.dash__kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
}

.kpi {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.1rem 1.15rem;
    background: #fff;
    border-radius: 16px;
    border: 1px solid #eef0f4;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.kpi__icon {
    width: 3rem;
    height: 3rem;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
}

.kpi--purple .kpi__icon { background: #f3e8ff; color: #7c3aed; }
.kpi--blue .kpi__icon { background: #dbeafe; color: #2563eb; }
.kpi--green .kpi__icon { background: #dcfce7; color: #16a34a; }
.kpi--orange .kpi__icon { background: #ffedd5; color: #ea580c; }

.kpi__label {
    margin: 0;
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 600;
}

.kpi__value {
    margin: 0.15rem 0 0;
    font-size: 1.45rem;
    font-weight: 800;
    color: #111827;
    line-height: 1.1;
}

.dash__analytics {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
    gap: 1rem;
}

.dash__side-stack {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.dash__ops,
.dash__lists {
    display: grid;
    gap: 1rem;
}

.dash__ops {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dash__lists {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.panel {
    background: #fff;
    border: 1px solid #eef0f4;
    border-radius: 18px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    overflow: hidden;
}

.panel--wide { min-height: 320px; }

.panel__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1.15rem 0.75rem;
}

.panel__head h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    color: #111827;
}

.panel__head p {
    margin: 0.2rem 0 0;
    font-size: 0.76rem;
    color: #6b7280;
}

.panel__pill {
    font-size: 0.72rem;
    font-weight: 700;
    color: #6d28d9;
    background: #f5f3ff;
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
}

.panel__link {
    border: none;
    background: transparent;
    color: #6d28d9;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.25rem 0;
}

.panel__link:hover { text-decoration: underline; }

.panel__empty {
    padding: 2rem 1.15rem;
    text-align: center;
    color: #9ca3af;
    font-size: 0.82rem;
}

.panel__empty--compact { padding: 1.25rem 1.15rem; }

.chart-area {
    padding: 0 1.15rem 1rem;
}

.chart-area__svg {
    width: 100%;
    height: 180px;
    display: block;
}

.chart-area__axis {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.68rem;
    color: #9ca3af;
}

.channel {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 0.75rem;
    padding: 0 1.15rem 1.15rem;
    align-items: center;
}

.channel__donut {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
}

.channel__donut-hole {
    width: 74px;
    height: 74px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.channel__donut-total {
    font-size: 0.72rem;
    font-weight: 800;
    color: #111827;
    line-height: 1.1;
}

.channel__donut-label {
    font-size: 0.62rem;
    color: #9ca3af;
}

.channel__legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.channel__legend li {
    display: grid;
    grid-template-columns: 10px 1fr auto auto;
    gap: 0.45rem;
    align-items: center;
    font-size: 0.76rem;
}

.channel__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.channel__name { color: #374151; font-weight: 600; }
.channel__pct { color: #6b7280; font-weight: 700; }
.channel__amount { color: #111827; font-weight: 800; }

.alerts {
    list-style: none;
    margin: 0;
    padding: 0 1.15rem 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.alert-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.8rem 0.85rem;
    border-radius: 12px;
    border: 1px solid transparent;
}

.alert-item--danger { background: #fef2f2; border-color: #fecaca; }
.alert-item--warn { background: #fffbeb; border-color: #fde68a; }
.alert-item--info { background: #eff6ff; border-color: #bfdbfe; }

.alert-item__icon {
    width: 2rem;
    height: 2rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.alert-item__title {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 800;
    color: #111827;
}

.alert-item__detail {
    margin: 0.15rem 0 0;
    font-size: 0.74rem;
    color: #4b5563;
}

.ops-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 0 1.15rem 1.15rem;
}

.ops-grid__item {
    padding: 0.85rem;
    border-radius: 12px;
    background: #f8fafc;
}

.ops-grid__label {
    display: block;
    font-size: 0.72rem;
    color: #6b7280;
    font-weight: 600;
}

.ops-grid__value {
    display: block;
    margin-top: 0.2rem;
    font-size: 1.1rem;
    font-weight: 800;
    color: #111827;
}

.station-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    padding: 0 1.15rem 1.15rem;
}

.station-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    background: #f8fafc;
    font-size: 0.68rem;
    font-weight: 700;
    color: #374151;
}

.station-tag i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.list-rows {
    list-style: none;
    margin: 0;
    padding: 0 0.65rem 0.65rem;
}

.list-row {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #f3f4f6;
}

.list-row:last-child { border-bottom: none; }

.list-row--product {
    grid-template-columns: auto auto 1fr auto;
}

.list-row__avatar,
.list-row__thumb,
.list-row__rank {
    width: 2.35rem;
    height: 2.35rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.list-row__avatar {
    background: #f3e8ff;
    color: #7c3aed;
}

.list-row__avatar--calendar {
    background: #dbeafe;
    color: #2563eb;
}

.list-row__thumb {
    background: #f3f4f6;
    color: #9ca3af;
}

.list-row__rank {
    background: #111827;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 800;
}

.list-row__title {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 700;
    color: #111827;
}

.list-row__sub {
    margin: 0.15rem 0 0;
    font-size: 0.72rem;
    color: #6b7280;
}

.list-row__amount {
    font-size: 0.82rem;
    font-weight: 800;
    color: #111827;
    white-space: nowrap;
}

.badge {
    font-size: 0.64rem;
    font-weight: 800;
    padding: 0.28rem 0.55rem;
    border-radius: 999px;
    white-space: nowrap;
}

.badge--success { background: #dcfce7; color: #15803d; }
.badge--info { background: #dbeafe; color: #1d4ed8; }
.badge--warn { background: #fef3c7; color: #b45309; }
.badge--danger { background: #fee2e2; color: #b91c1c; }

@media (max-width: 1200px) {
    .dash__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dash__analytics { grid-template-columns: 1fr; }
    .dash__lists { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
    .dash { padding: 1rem; }
    .dash__kpis,
    .dash__ops { grid-template-columns: 1fr; }
    .channel { grid-template-columns: 1fr; }
    .list-row,
    .list-row--product {
        grid-template-columns: auto 1fr;
    }
    .list-row__amount,
    .badge { grid-column: 2; justify-self: start; }
}
</style>
