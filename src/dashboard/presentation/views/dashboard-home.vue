<script setup>
import { computed, onMounted } from 'vue'
import { usePaymentsStore }  from '../../../payments/application/payments.store.js'
import { usePosStore }       from '../../../pos/application/pos.store.js'
import { useTablesStore }    from '../../../tables/application/tables.store.js'
import { useStationsStore }  from '../../../stations/application/stations.store.js'

const paymentsStore = usePaymentsStore()
const posStore      = usePosStore()
const tablesStore   = useTablesStore()
const stationsStore = useStationsStore()

onMounted(() => {
    paymentsStore.fetchAll()
    tablesStore.fetchAll()
    posStore.fetchAll()
})

const formatSoles = (n) => `S/ ${Number(n ?? 0).toFixed(2)}`

const methodIcons = {
    cash: 'pi-money-bill',
    card: 'pi-credit-card',
    yape: 'pi-mobile',
    plin: 'pi-mobile',
}

const paymentMethodRows = computed(() => {
    const map = paymentsStore.todayByMethod ?? {}
    return Object.entries(map)
        .filter(([, v]) => v > 0)
        .map(([method, total]) => ({
            method,
            label: method.charAt(0).toUpperCase() + method.slice(1),
            total,
            icon: methodIcons[method] ?? 'pi-wallet',
        }))
        .sort((a, b) => b.total - a.total)
})

const avgTicket = computed(() => {
    const count = paymentsStore.todayCount
    return count > 0 ? paymentsStore.todayTotal / count : 0
})

// Top-selling items from today's payments
const topItems = computed(() => {
    const counts = {}
    paymentsStore.todaysPayments.forEach(p => {
        p.items?.forEach(item => {
            counts[item.name] = (counts[item.name] ?? 0) + (item.qty ?? 1)
        })
    })
    return Object.entries(counts)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)
})
</script>

<template>
    <div class="dash-layout">

        <!-- Header -->
        <div class="dash-header">
            <div>
                <h1 class="dash-header__title">Dashboard</h1>
                <p class="dash-header__sub">Resumen operacional del día</p>
            </div>
        </div>

        <!-- ── Row 1: KPI cards ──────────────────────────────────── -->
        <div class="kpi-row">
            <div class="kpi-card kpi-card--green">
                <div class="kpi-card__icon"><i class="pi pi-dollar"></i></div>
                <div class="kpi-card__body">
                    <div class="kpi-card__value">{{ formatSoles(paymentsStore.todayTotal) }}</div>
                    <div class="kpi-card__label">Ingresos del día</div>
                </div>
            </div>

            <div class="kpi-card kpi-card--blue">
                <div class="kpi-card__icon"><i class="pi pi-receipt"></i></div>
                <div class="kpi-card__body">
                    <div class="kpi-card__value">{{ paymentsStore.todayCount }}</div>
                    <div class="kpi-card__label">Cobros realizados</div>
                </div>
            </div>

            <div class="kpi-card kpi-card--purple">
                <div class="kpi-card__icon"><i class="pi pi-chart-bar"></i></div>
                <div class="kpi-card__body">
                    <div class="kpi-card__value">{{ formatSoles(avgTicket) }}</div>
                    <div class="kpi-card__label">Ticket promedio</div>
                </div>
            </div>

            <div class="kpi-card kpi-card--orange">
                <div class="kpi-card__icon"><i class="pi pi-table"></i></div>
                <div class="kpi-card__body">
                    <div class="kpi-card__value">{{ tablesStore.occupiedTables?.length ?? 0 }}</div>
                    <div class="kpi-card__label">Mesas ocupadas</div>
                </div>
            </div>

            <div class="kpi-card kpi-card--yellow">
                <div class="kpi-card__icon"><i class="pi pi-bolt"></i></div>
                <div class="kpi-card__body">
                    <div class="kpi-card__value">{{ posStore.activeOrders?.length ?? posStore.totalInProcess ?? 0 }}</div>
                    <div class="kpi-card__label">Órdenes activas</div>
                </div>
            </div>

            <div class="kpi-card kpi-card--teal">
                <div class="kpi-card__icon"><i class="pi pi-check-circle"></i></div>
                <div class="kpi-card__body">
                    <div class="kpi-card__value">{{ stationsStore.readyCount }}</div>
                    <div class="kpi-card__label">Listos para recoger</div>
                </div>
            </div>
        </div>

        <!-- ── Row 2: Methods + Top items ───────────────────────── -->
        <div class="dash-row-2">

            <!-- Payment methods breakdown -->
            <div class="dash-card">
                <div class="dash-card__header">
                    <i class="pi pi-wallet"></i>
                    <span>Métodos de pago hoy</span>
                </div>
                <div v-if="paymentMethodRows.length === 0" class="dash-card__empty">
                    Sin cobros registrados hoy
                </div>
                <div v-else class="method-list">
                    <div v-for="row in paymentMethodRows" :key="row.method" class="method-row">
                        <div class="method-row__left">
                            <i :class="['pi', row.icon, 'method-row__icon']"></i>
                            <span class="method-row__label">{{ row.label }}</span>
                        </div>
                        <div class="method-row__right">
                            <div
                                class="method-row__bar"
                                :style="{ width: ((row.total / paymentsStore.todayTotal) * 100).toFixed(1) + '%' }"
                            ></div>
                            <span class="method-row__val">{{ formatSoles(row.total) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top products -->
            <div class="dash-card">
                <div class="dash-card__header">
                    <i class="pi pi-star"></i>
                    <span>Productos más vendidos</span>
                </div>
                <div v-if="topItems.length === 0" class="dash-card__empty">
                    Sin datos disponibles
                </div>
                <div v-else class="top-list">
                    <div v-for="(item, idx) in topItems" :key="item.name" class="top-row">
                        <span class="top-row__rank" :class="`top-row__rank--${idx + 1}`">{{ idx + 1 }}</span>
                        <span class="top-row__name">{{ item.name }}</span>
                        <span class="top-row__qty">× {{ item.qty }}</span>
                    </div>
                </div>
            </div>

            <!-- Kitchen status -->
            <div class="dash-card">
                <div class="dash-card__header">
                    <i class="pi pi-inbox"></i>
                    <span>Estado de cocina</span>
                </div>
                <div class="kitchen-stats">
                    <div class="kitchen-stat">
                        <span class="kitchen-stat__num" style="color:#3b82f6">{{ stationsStore.receivedTickets?.length ?? 0 }}</span>
                        <span class="kitchen-stat__lbl">Recibidos</span>
                    </div>
                    <div class="kitchen-stat__sep"></div>
                    <div class="kitchen-stat">
                        <span class="kitchen-stat__num" style="color:#f59e0b">{{ stationsStore.preparingTickets?.length ?? 0 }}</span>
                        <span class="kitchen-stat__lbl">En Preparación</span>
                    </div>
                    <div class="kitchen-stat__sep"></div>
                    <div class="kitchen-stat">
                        <span class="kitchen-stat__num" style="color:#10b981">{{ stationsStore.readyCount }}</span>
                        <span class="kitchen-stat__lbl">Listos</span>
                    </div>
                    <div class="kitchen-stat__sep"></div>
                    <div class="kitchen-stat">
                        <span class="kitchen-stat__num" style="color:#6366f1">{{ stationsStore.totalToday }}</span>
                        <span class="kitchen-stat__lbl">Total hoy</span>
                    </div>
                </div>

                <!-- Per-station breakdown -->
                <div class="station-breakdown">
                    <div
                        v-for="st in stationsStore.activeStations"
                        :key="st.id"
                        class="station-breakdown-row"
                    >
                        <span class="station-breakdown-row__dot" :style="{ background: st.color }"></span>
                        <span class="station-breakdown-row__name">{{ st.name }}</span>
                        <span class="station-breakdown-row__count">
                            {{ stationsStore.tickets.filter(t => t.stationId === st.id).length }} tickets
                        </span>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.dash-layout {
    display: flex; flex-direction: column; gap: 1.5rem;
    padding: 1.5rem; min-height: 0;
    background: #f9fafb;
}

.dash-header { margin-bottom: 0.25rem; }
.dash-header__title { font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0; }
.dash-header__sub   { font-size: 0.82rem; color: #6b7280; margin: 0.2rem 0 0; }

/* ── KPI row ─────────────────────────────────────────────────────── */
.kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
}

.kpi-card {
    display: flex; align-items: center; gap: 1rem;
    padding: 1.2rem 1.25rem;
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.kpi-card__icon {
    width: 2.8rem; height: 2.8rem; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.15rem; flex-shrink: 0;
}
.kpi-card--green  .kpi-card__icon { background: #d1fae5; color: #059669; }
.kpi-card--blue   .kpi-card__icon { background: #dbeafe; color: #2563eb; }
.kpi-card--purple .kpi-card__icon { background: #ede9fe; color: #7c3aed; }
.kpi-card--orange .kpi-card__icon { background: #ffedd5; color: #ea580c; }
.kpi-card--yellow .kpi-card__icon { background: #fef9c3; color: #ca8a04; }
.kpi-card--teal   .kpi-card__icon { background: #ccfbf1; color: #0d9488; }

.kpi-card__value {
    font-size: 1.4rem; font-weight: 800; color: #111827; line-height: 1;
}
.kpi-card__label {
    font-size: 0.72rem; font-weight: 500; color: #6b7280; margin-top: 0.2rem;
}

/* ── Row 2 ───────────────────────────────────────────────────────── */
.dash-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
}
@media (max-width: 900px) { .dash-row-2 { grid-template-columns: 1fr; } }

.dash-card {
    background: #fff; border-radius: 14px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    overflow: hidden;
}

.dash-card__header {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.85rem 1.1rem;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.88rem; font-weight: 700; color: #374151;
}
.dash-card__header .pi { color: #6366f1; }

.dash-card__empty {
    padding: 2rem; text-align: center;
    font-size: 0.82rem; color: #9ca3af;
}

/* Methods */
.method-list { display: flex; flex-direction: column; padding: 0.75rem 1.1rem; gap: 0.75rem; }
.method-row  { display: flex; align-items: center; gap: 0.75rem; }

.method-row__left  { display: flex; align-items: center; gap: 0.5rem; min-width: 80px; }
.method-row__icon  { color: #6b7280; font-size: 0.9rem; }
.method-row__label { font-size: 0.82rem; font-weight: 600; color: #374151; }

.method-row__right { display: flex; align-items: center; gap: 0.6rem; flex: 1; }

.method-row__bar {
    height: 8px; border-radius: 999px;
    background: linear-gradient(90deg, #6366f1, #818cf8);
    transition: width 0.4s ease; min-width: 4px;
}

.method-row__val { font-size: 0.82rem; font-weight: 700; color: #111827; white-space: nowrap; margin-left: auto; }

/* Top items */
.top-list { display: flex; flex-direction: column; padding: 0.75rem 1.1rem; gap: 0.6rem; }

.top-row {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.4rem 0.6rem; border-radius: 8px; background: #f9fafb;
}

.top-row__rank {
    width: 1.5rem; height: 1.5rem;
    border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 800; flex-shrink: 0;
    background: #e5e7eb; color: #6b7280;
}
.top-row__rank--1 { background: #fef9c3; color: #ca8a04; }
.top-row__rank--2 { background: #f3f4f6; color: #6b7280; }
.top-row__rank--3 { background: #ffedd5; color: #ea580c; }

.top-row__name { flex: 1; font-size: 0.82rem; color: #111827; font-weight: 500; }
.top-row__qty  { font-size: 0.78rem; font-weight: 700; color: #6366f1; }

/* Kitchen stats */
.kitchen-stats {
    display: flex; align-items: stretch;
    border-bottom: 1px solid #f3f4f6;
}
.kitchen-stat {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 0.2rem; padding: 0.85rem 0.5rem;
}
.kitchen-stat__num { font-size: 1.5rem; font-weight: 800; line-height: 1; }
.kitchen-stat__lbl { font-size: 0.62rem; color: #6b7280; font-weight: 500; text-align: center; }
.kitchen-stat__sep { width: 1px; background: #f3f4f6; flex-shrink: 0; }

.station-breakdown {
    display: flex; flex-direction: column; gap: 0;
    padding: 0.5rem 1.1rem 0.85rem;
}
.station-breakdown-row {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.35rem 0; border-bottom: 1px solid #f9fafb;
    font-size: 0.8rem;
}
.station-breakdown-row:last-child { border-bottom: none; }
.station-breakdown-row__dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.station-breakdown-row__name { flex: 1; color: #374151; font-weight: 500; }
.station-breakdown-row__count { font-size: 0.75rem; color: #9ca3af; font-weight: 600; }
</style>
