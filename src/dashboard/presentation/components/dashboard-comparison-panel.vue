<script setup>
import { computed } from 'vue'
import { useDashboardStore } from '../../application/dashboard.store.js'
import {
    COMPARISON_UI,
    buildDualChartPaths,
    deltaTone,
    formatCompareDate,
    formatDeltaBadge,
} from '../constants/dashboard-comparison.constants-ui.js'

const store = useDashboardStore()

const c = computed(() => store.comparison)
const previousLabel = computed(() =>
    COMPARISON_UI.PREVIOUS_LABELS[c.value?.compareWith] ?? 'Referencia',
)

const chartPaths = computed(() =>
    buildDualChartPaths(c.value?.hourlyCurrent ?? [], c.value?.hourlyPrevious ?? []),
)

const formatSoles = (n) => `S/ ${Number(n ?? 0).toFixed(2)}`

const kpiCards = computed(() => {
    if (!c.value) return []
    return [
        { key: 'revenue', label: COMPARISON_UI.KPI.REVENUE, delta: c.value.revenue, format: formatSoles, invert: false },
        { key: 'orders', label: COMPARISON_UI.KPI.ORDERS, delta: c.value.paymentCount, format: (n) => String(Math.round(n)), invert: false },
        { key: 'ticket', label: COMPARISON_UI.KPI.AVG_TICKET, delta: c.value.avgTicket, format: formatSoles, invert: false },
        { key: 'covers', label: COMPARISON_UI.KPI.COVERS, delta: c.value.covers, format: (n) => String(Math.round(n)), invert: false },
        { key: 'cancellations', label: COMPARISON_UI.KPI.CANCELLATIONS, delta: c.value.cancellations, format: (n) => String(Math.round(n)), invert: true },
    ]
})
</script>

<template>
    <div v-if="c" class="cmp-panel">
        <section class="cmp-panel__kpis">
            <article
                v-for="card in kpiCards"
                :key="card.key"
                class="cmp-kpi"
            >
                <p class="cmp-kpi__label">{{ card.label }}</p>
                <p class="cmp-kpi__value">{{ card.format(card.delta.current) }}</p>
                <p class="cmp-kpi__prev">
                    vs {{ card.format(card.delta.previous) }}
                    <span class="cmp-kpi__ref">({{ previousLabel }})</span>
                </p>
                <span :class="['cmp-kpi__badge', `cmp-kpi__badge--${deltaTone(card.delta.changePercent, { invert: card.invert })}`]">
                    {{ formatDeltaBadge(card.delta.changePercent, { invert: card.invert }) }}
                </span>
            </article>
        </section>

        <section class="cmp-panel__grid">
            <article class="panel panel--wide">
                <div class="panel__head">
                    <div>
                        <h2>{{ COMPARISON_UI.SECTIONS.SALES_TREND }}</h2>
                        <p>{{ COMPARISON_UI.CURRENT_LABEL }} vs {{ previousLabel }}</p>
                    </div>
                    <div class="legend">
                        <span class="legend__item"><i class="legend__line legend__line--current"></i> Hoy</span>
                        <span class="legend__item"><i class="legend__line legend__line--previous"></i> {{ previousLabel }}</span>
                    </div>
                </div>
                <div class="chart-wrap">
                    <svg class="chart-wrap__svg" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path
                            :d="chartPaths.previousPath"
                            fill="none"
                            stroke="#94a3b8"
                            stroke-width="0.7"
                            stroke-dasharray="1.5 1.5"
                        />
                        <path
                            :d="chartPaths.currentPath"
                            fill="none"
                            stroke="#7c5cfc"
                            stroke-width="0.9"
                        />
                    </svg>
                    <div class="chart-wrap__axis">
                        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                    </div>
                </div>
            </article>

            <div class="cmp-panel__side">
                <article class="panel">
                    <div class="panel__head">
                        <div>
                            <h2>{{ COMPARISON_UI.SECTIONS.CHANNELS }}</h2>
                            <p>Participación por canal</p>
                        </div>
                    </div>
                    <div class="channel-table">
                        <div class="channel-table__head">
                            <span>Canal</span>
                            <span>Hoy</span>
                            <span>{{ previousLabel }}</span>
                            <span>Cambio</span>
                        </div>
                        <div
                            v-for="row in c.channels"
                            :key="row.key"
                            class="channel-table__row"
                        >
                            <span>{{ row.label }}</span>
                            <span>{{ formatSoles(row.current) }}</span>
                            <span>{{ formatSoles(row.previous) }}</span>
                            <span :class="`delta delta--${deltaTone(row.changePercent)}`">
                                {{ formatDeltaBadge(row.changePercent) }}
                            </span>
                        </div>
                    </div>
                </article>

                <article class="panel panel--summary">
                    <div class="panel__head">
                        <div>
                            <h2>{{ COMPARISON_UI.SECTIONS.SUMMARY }}</h2>
                            <p>{{ formatCompareDate(c.compareDate) }}</p>
                        </div>
                    </div>
                    <div class="summary">
                        <p class="summary__headline">{{ c.summary.headline }}</p>
                        <p class="summary__metric">
                            Ventas {{ formatDeltaBadge(c.summary.revenueChangePercent) }}
                            respecto a {{ previousLabel.toLowerCase() }}
                        </p>
                        <ul class="summary__list">
                            <li>
                                <strong>Mejor hora:</strong>
                                {{ c.summary.bestHour.label }}
                                · {{ formatSoles(c.summary.bestHour.amount) }}
                            </li>
                            <li>
                                <strong>Top producto:</strong>
                                {{ c.summary.topProduct.name }}
                                · {{ c.summary.topProduct.quantity }} uds.
                            </li>
                            <li>
                                <strong>Canal líder:</strong>
                                {{ c.summary.topChannel.label }}
                                · {{ c.summary.topChannel.percent }}%
                            </li>
                        </ul>
                    </div>
                </article>
            </div>
        </section>

        <section class="panel">
            <div class="panel__head">
                <div>
                    <h2>{{ COMPARISON_UI.SECTIONS.TOP_PRODUCTS }}</h2>
                    <p>Unidades vendidas hoy vs periodo de referencia</p>
                </div>
            </div>
            <div v-if="c.topItems.length" class="products-table">
                <div class="products-table__head">
                    <span>#</span>
                    <span>Producto</span>
                    <span>Hoy</span>
                    <span>{{ previousLabel }}</span>
                    <span>Cambio</span>
                </div>
                <div
                    v-for="(item, idx) in c.topItems"
                    :key="item.itemId ?? item.name"
                    class="products-table__row"
                >
                    <span>{{ idx + 1 }}</span>
                    <span>{{ item.name }}</span>
                    <span>{{ item.currentQuantity }}</span>
                    <span>{{ item.previousQuantity }}</span>
                    <span :class="`delta delta--${deltaTone(item.changePercent)}`">
                        {{ formatDeltaBadge(item.changePercent) }}
                    </span>
                </div>
            </div>
            <div v-else class="panel__empty">Sin productos para comparar en este periodo</div>
        </section>
    </div>
</template>

<style scoped>
.cmp-panel {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.cmp-panel__kpis {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1rem;
}

.cmp-kpi {
    background: #fff;
    border: 1px solid #eef0f4;
    border-radius: 16px;
    padding: 1rem;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.cmp-kpi__label {
    margin: 0;
    font-size: 0.76rem;
    color: #6b7280;
    font-weight: 600;
}

.cmp-kpi__value {
    margin: 0.35rem 0 0;
    font-size: 1.35rem;
    font-weight: 800;
    color: #111827;
}

.cmp-kpi__prev {
    margin: 0.25rem 0 0.65rem;
    font-size: 0.72rem;
    color: #9ca3af;
}

.cmp-kpi__ref { color: #cbd5e1; }

.cmp-kpi__badge {
    display: inline-flex;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
}

.cmp-kpi__badge--up { background: #dcfce7; color: #15803d; }
.cmp-kpi__badge--down { background: #fee2e2; color: #b91c1c; }
.cmp-kpi__badge--neutral { background: #f3f4f6; color: #6b7280; }

.cmp-panel__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(280px, 1fr);
    gap: 1rem;
}

.cmp-panel__side {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1.15rem 0.75rem;
}

.panel__head h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
}

.panel__head p {
    margin: 0.2rem 0 0;
    font-size: 0.76rem;
    color: #6b7280;
}

.panel__empty {
    padding: 1.5rem;
    text-align: center;
    color: #9ca3af;
    font-size: 0.82rem;
}

.legend {
    display: flex;
    gap: 0.85rem;
    align-items: center;
    font-size: 0.72rem;
    color: #6b7280;
}

.legend__item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.legend__line {
    width: 18px;
    height: 0;
    border-top: 2px solid;
    display: inline-block;
}

.legend__line--current { border-color: #7c5cfc; }
.legend__line--previous { border-color: #94a3b8; border-style: dashed; }

.chart-wrap { padding: 0 1.15rem 1rem; }
.chart-wrap__svg { width: 100%; height: 220px; display: block; }
.chart-wrap__axis {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.68rem;
    color: #9ca3af;
}

.channel-table,
.products-table {
    padding: 0 1.15rem 1.15rem;
}

.channel-table__head,
.channel-table__row,
.products-table__head,
.products-table__row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 0.8fr;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.76rem;
}

.products-table__head,
.products-table__row {
    grid-template-columns: 0.35fr 1.4fr 0.6fr 0.6fr 0.7fr;
}

.channel-table__head,
.products-table__head {
    color: #9ca3af;
    font-weight: 700;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f3f4f6;
}

.channel-table__row,
.products-table__row {
    padding: 0.65rem 0;
    border-bottom: 1px solid #f9fafb;
    color: #374151;
}

.delta { font-weight: 800; }
.delta--up { color: #15803d; }
.delta--down { color: #b91c1c; }
.delta--neutral { color: #6b7280; }

.summary { padding: 0 1.15rem 1.15rem; }

.summary__headline {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    color: #111827;
}

.summary__metric {
    margin: 0.35rem 0 0.85rem;
    font-size: 0.82rem;
    color: #6d28d9;
    font-weight: 700;
}

.summary__list {
    margin: 0;
    padding-left: 1rem;
    color: #4b5563;
    font-size: 0.78rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

@media (max-width: 1200px) {
    .cmp-panel__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cmp-panel__grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
    .cmp-panel__kpis { grid-template-columns: 1fr; }
}
</style>
