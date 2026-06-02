<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCashRegisterStore } from '../../application/cash-register.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { useDateFormatter }  from '../../../shared/composables/use-date-formatter.js'
import {
    CASH_REGISTER_LABELS as L,
    SESSION_STATUS_CONFIG,
    MOVEMENT_TYPE_CONFIG,
    MOVEMENT_CATEGORY_CONFIG,
    MOVEMENT_FILTER_CATEGORY_OPTIONS,
    MOVEMENT_FILTER_TYPE_OPTIONS,
    MOVEMENT_FILTER_METHOD_OPTIONS,
} from '../constants/cash-register.constants-ui.js'
import { METHOD_COLORS } from '../../../payments/presentation/constants/payments.constants-ui.js'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'
import ModuleTabBar from '../../../shared/presentation/components/module-tab-bar.vue'
import ModuleTab from '../../../shared/presentation/components/module-tab.vue'
import OpenSessionDialog    from './open-session-dialog.vue'
import CloseSessionDialog   from './close-session-dialog.vue'
import CreateMovementDialog from './create-movement-dialog.vue'
import {
    movementOrderLabel,
    movementPaymentMethodLabel,
    movementCollectedBy,
    movementDescriptionText,
    movementMethodKey,
    canDeleteMovement,
} from '../utils/cash-movement-display.js'
import {
    exportCashMovementsExcel,
    buildSessionSummaryRows,
} from '../utils/cash-register-excel.js'
import { useNotification } from '../../../shared/composables/use-notification.js'

const store = useCashRegisterStore()
const router = useRouter()
const route = useRoute()
const { confirmDelete } = useConfirmDialog()
const { showSuccess, showError } = useNotification()
const { elapsedTime } = useDateFormatter()
function formatDateTime(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    if (isNaN(d)) return dt
    return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Hora compacta en tabla de movimientos (mismo día → solo hora). */
function formatMovementTime(dt) {
    if (!dt) return '—'
    const d = new Date(dt)
    if (isNaN(d.getTime())) return String(dt)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) {
        return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleString('es-PE', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
}

function formatUserAudit(userId) {
    if (!userId) return null
    const id = String(userId)
    return id.length > 12 ? `${id.slice(0, 8)}…` : id
}

onMounted(() => { store.fetchAll() })

watch(() => route.name, (name) => {
    if (name === 'cash-register-home') store.fetchAll()
})

// ── Tabs turno actual / historial (antes de watchers que usan activeTab) ──
const activeTab       = ref('current')   // 'current' | 'history'
const expandedSession = ref(null)        // session.id expandido en historial

watch(
    () => store.hasOpenSession,
    (open) => {
        if (!open && store.closedSessions.length) activeTab.value = 'history'
        if (open) activeTab.value = 'current'
    },
    { immediate: true },
)

// ── Dialog visibility ─────────────────────────────────────────────────────
const showOpenDialog     = ref(false)
const showCloseDialog    = ref(false)
const showMovementDialog = ref(false)

async function onSessionOpened(payload) {
    await store.openSession(payload)
}

async function onSessionClosed(payload) {
    const ok = await store.closeSession(payload)
    if (ok) {
        showCloseDialog.value = false
    }
}

async function onMovementSaved(payload) {
    await store.addMovement(payload)
}

// ── Delete Movement ───────────────────────────────────────────────────────
function onDeleteMovement(mov) {
    confirmDelete({
        target:  movementDescriptionText(mov),
        accept:  () => store.remove(mov.id),
    })
}

function goToPayment(mov) {
    if (!mov?.paymentId) return
    router.push({ name: 'payments-management', query: { paymentId: mov.paymentId } })
}

function methodDotColor(mov) {
    const key = (mov?.paymentMethod || '').toLowerCase()
    if (key && METHOD_COLORS[key]) return METHOD_COLORS[key]
    if (mov?.category === 'venta') return '#10b981'
    if (mov?.category === 'venta_digital') return '#8b5cf6'
    return '#9ca3af'
}

// ── Paginación movimientos turno actual ───────────────────────────────
const PAGE_SIZE = 10
const movPage   = ref(1)

const filterCategory = ref(null)
const filterType     = ref(null)
const filterMethod   = ref(null)
const filterSearch   = ref('')

const filteredCurrentMovements = computed(() => {
    let list = [...store.currentSessionMovements].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )

    if (filterCategory.value) {
        list = list.filter(m => m.category === filterCategory.value)
    }
    if (filterType.value) {
        list = list.filter(m => m.type === filterType.value)
    }
    if (filterMethod.value) {
        list = list.filter(m => movementMethodKey(m) === filterMethod.value)
    }
    if (filterSearch.value.trim()) {
        const q = filterSearch.value.trim().toLowerCase()
        list = list.filter(m =>
            movementDescriptionText(m).toLowerCase().includes(q)
            || movementOrderLabel(m).toLowerCase().includes(q)
            || movementPaymentMethodLabel(m).toLowerCase().includes(q)
            || movementCollectedBy(m).toLowerCase().includes(q)
            || String(m.saleDisplayNumber ?? '').includes(q)
            || (m.tableNumber && String(m.tableNumber).includes(q)),
        )
    }
    return list
})

const hasActiveFilters = computed(() =>
    Boolean(filterCategory.value)
    || Boolean(filterType.value)
    || Boolean(filterMethod.value)
    || Boolean(filterSearch.value.trim()),
)

const movementFilterSummary = computed(() => {
    const n = filteredCurrentMovements.value.length
    const total = store.currentSessionMovements.length
    if (!total) return ''
    if (hasActiveFilters.value && n !== total) {
        return `${n} de ${total} movimientos`
    }
    return `${total} movimiento${total !== 1 ? 's' : ''}`
})

const movTotalPages = computed(() => Math.max(1, Math.ceil(filteredCurrentMovements.value.length / PAGE_SIZE)))
const paginatedMovements = computed(() => {
    const start = (movPage.value - 1) * PAGE_SIZE
    return filteredCurrentMovements.value.slice(start, start + PAGE_SIZE)
})

watch([filterCategory, filterType, filterMethod, filterSearch], () => {
    movPage.value = 1
})

function clearMovementFilters() {
    filterCategory.value = null
    filterType.value     = null
    filterMethod.value   = null
    filterSearch.value   = ''
}

function exportFilename(prefix) {
    const shift = store.currentSession?.shiftName || 'turno'
    const date  = new Date().toISOString().slice(0, 10)
    return `${prefix}_${shift}_${date}`.replace(/\s+/g, '_')
}

function exportCurrentMovementsExcel() {
    if (!store.hasOpenSession) return
    const movements = filteredCurrentMovements.value.length
        ? filteredCurrentMovements.value
        : store.currentSessionMovements
    try {
        exportCashMovementsExcel({
            movements,
            filename: exportFilename('caja_movimientos'),
            summaryRows: buildSessionSummaryRows(store.currentSession, store.currentSessionMovements),
        })
        showSuccess('Exportación Excel generada')
    } catch {
        showError('No se pudo exportar a Excel')
    }
}

function exportHistorySessionExcel(session) {
    const movements = store.getMovementsBySession(session.id)
    try {
        exportCashMovementsExcel({
            movements,
            filename: exportFilename(`caja_${session.shiftName || session.id}`),
            summaryRows: buildSessionSummaryRows(session, movements),
        })
        showSuccess('Turno exportado a Excel')
    } catch {
        showError('No se pudo exportar el turno')
    }
}
function toggleSessionDetail(sessionId) {
    expandedSession.value = expandedSession.value === sessionId ? null : sessionId
}

// ── Helpers ───────────────────────────────────────────────────────────────
function categoryLabel(cat) {
    return MOVEMENT_CATEGORY_CONFIG[cat]?.label ?? cat
}
function categoryIcon(cat) {
    return MOVEMENT_CATEGORY_CONFIG[cat]?.icon ?? 'pi pi-circle'
}
function fmtCurrency(n) {
    return `S/ ${(n ?? 0).toFixed(2)}`
}

const summaryExpanded = ref(false)

const shiftSummaryStats = computed(() => {
    const stats = [
        {
            key: 'initial',
            label: 'Inicial',
            value: fmtCurrency(store.currentSession?.initialAmount),
            tone: 'neutral',
        },
        {
            key: 'expense',
            label: 'Egresos',
            value: fmtCurrency(store.sessionCashExpense),
            tone: 'danger',
        },
    ]
    if (store.sessionTipsIncome > 0) {
        stats.push({
            key: 'tips',
            label: L.TIPS,
            value: fmtCurrency(store.sessionTipsIncome),
            tone: 'tip',
        })
    }
    if (store.sessionRefundsExpense > 0) {
        stats.push({
            key: 'refunds',
            label: L.REFUNDS,
            value: fmtCurrency(store.sessionRefundsExpense),
            tone: 'danger',
        })
    }
    return stats
})

const shiftDigitalMethods = computed(() => [
    { key: 'card', label: L.CARD_SALES, amount: store.sessionSalesByMethod.card, color: METHOD_COLORS.card ?? '#6366f1' },
    { key: 'yape', label: L.YAPE_SALES, amount: store.sessionSalesByMethod.yape, color: METHOD_COLORS.yape ?? '#8b5cf6' },
    { key: 'plin', label: L.PLIN_SALES, amount: store.sessionSalesByMethod.plin, color: METHOD_COLORS.plin ?? '#3b82f6' },
])
</script>

<template>
    <div class="module-page cr-page--fill">
    <div class="cr-page__shell">
    <module-state-feedback
        :loading="store.isLoading"
        :error="store.error"
        loading-label="Cargando caja..."
        @retry="store.fetchAll()"
    >
    <div class="module-page-body cr-home">

        <!-- Sin ningún turno en la sucursal (primera vez) -->
        <div v-if="!store.isLoading && store.sessions.length === 0" class="cr-empty">
            <i class="pi pi-lock"></i>
            <span class="cr-empty__title">{{ L.NO_SESSION }}</span>
            <span class="cr-empty__sub">Abre un turno para comenzar a registrar movimientos de caja.</span>
            <pv-button :label="L.OPEN_SESSION" icon="pi pi-lock-open" severity="success" @click="showOpenDialog = true" />
        </div>

        <template v-else-if="!store.isLoading">
        <div v-if="!store.hasOpenSession" class="cr-banner">
            <div class="cr-banner__text">
                <i class="pi pi-info-circle"></i>
                <span>{{ L.NO_OPEN_HINT }}</span>
            </div>
            <pv-button :label="L.OPEN_SESSION" icon="pi pi-lock-open" severity="success" size="small" @click="showOpenDialog = true" />
        </div>

        <section class="cr-panel cr-panel--fill">
            <!-- Franja compacta del turno (no compite con la tabla) -->
            <div v-if="store.hasOpenSession" class="cr-hero" aria-label="Resumen del turno">
                <div class="cr-hero__top">
                    <div class="cr-hero__cash">
                        <span class="cr-hero__cash-label">{{ L.CASH_IN_DRAWER }}</span>
                        <span class="cr-hero__cash-value">{{ fmtCurrency(store.sessionExpectedCash) }}</span>
                    </div>
                    <div class="cr-hero__actions">
                        <pv-button :label="summaryExpanded ? L.HIDE_SHIFT_DETAIL : L.SHOW_SHIFT_DETAIL"
                                   :icon="summaryExpanded ? 'pi pi-chevron-up' : 'pi pi-chart-bar'"
                                   size="small"
                                   severity="secondary"
                                   outlined
                                   @click="summaryExpanded = !summaryExpanded" />
                        <pv-button :label="L.CLOSE_SESSION"
                                   icon="pi pi-lock"
                                   severity="warn"
                                   outlined
                                   size="small"
                                   @click="showCloseDialog = true" />
                        <pv-button :label="L.NEW_MOVEMENT"
                                   icon="pi pi-plus"
                                   size="small"
                                   @click="showMovementDialog = true" />
                    </div>
                </div>
                <div class="cr-hero__kpis">
                    <div class="cr-kpi">
                        <span class="cr-kpi__label">{{ L.TOTAL_REVENUE }}</span>
                        <span class="cr-kpi__value">{{ fmtCurrency(store.sessionTotalSalesRevenue) }}</span>
                    </div>
                    <div class="cr-kpi">
                        <span class="cr-kpi__label">{{ L.CASH_SALES }}</span>
                        <span class="cr-kpi__value">{{ fmtCurrency(store.sessionCashSalesRevenue) }}</span>
                    </div>
                    <div class="cr-kpi">
                        <span class="cr-kpi__label">{{ L.DIGITAL_SALES }}</span>
                        <span class="cr-kpi__value cr-kpi__value--digital">{{ fmtCurrency(store.sessionDigitalIncome) }}</span>
                    </div>
                    <div class="cr-kpi">
                        <span class="cr-kpi__label">{{ L.TOTAL_SALES }}</span>
                        <span class="cr-kpi__value">{{ store.sessionSalesCount }}</span>
                    </div>
                </div>
                <div class="cr-hero__meta">
                    <pv-tag :value="SESSION_STATUS_CONFIG.open.label"
                            :icon="SESSION_STATUS_CONFIG.open.icon"
                            :severity="SESSION_STATUS_CONFIG.open.severity"
                            class="cr-hero__tag" />
                    <span class="cr-hero__meta-text">
                        <strong>{{ store.currentSession.shiftName || 'Turno' }}</strong>
                        · {{ elapsedTime(store.currentSession.openedAt) }}
                        · {{ store.currentSession.openedBy }}
                        <span
                            v-if="store.currentSession.openedByUserId"
                            class="cr-audit-id"
                            :title="store.currentSession.openedByUserId"
                        > · {{ formatUserAudit(store.currentSession.openedByUserId) }}</span>
                    </span>
                </div>
            </div>

            <section v-if="store.hasOpenSession && summaryExpanded"
                     class="cr-summary-panel"
                     aria-label="Resumen detallado del turno">
                <header class="cr-summary-panel__head">
                    <h3 class="cr-summary-panel__title">{{ L.SHIFT_SUMMARY }}</h3>
                    <span class="cr-summary-panel__hint">Detalle de caja y cobros del turno abierto</span>
                </header>

                <div class="cr-summary-panel__grid">
                    <article v-for="stat in shiftSummaryStats"
                             :key="stat.key"
                             class="cr-summary-stat"
                             :class="`cr-summary-stat--${stat.tone}`">
                        <span class="cr-summary-stat__label">{{ stat.label }}</span>
                        <span class="cr-summary-stat__value">{{ stat.value }}</span>
                    </article>
                </div>

                <div class="cr-summary-block">
                    <h4 class="cr-summary-block__title">{{ L.DIGITAL_BREAKDOWN }}</h4>
                    <div class="cr-summary-methods">
                        <article v-for="m in shiftDigitalMethods"
                                 :key="m.key"
                                 class="cr-summary-method"
                                 :class="{ 'cr-summary-method--zero': !(m.amount > 0) }">
                            <div class="cr-summary-method__head">
                                <span class="cr-summary-method__dot" :style="{ background: m.color }" />
                                <span class="cr-summary-method__label">{{ m.label }}</span>
                            </div>
                            <span class="cr-summary-method__amount">{{ fmtCurrency(m.amount) }}</span>
                        </article>
                    </div>
                </div>

                <div v-if="store.collectorSummary.length" class="cr-summary-block">
                    <h4 class="cr-summary-block__title">Cobros por empleado (turno actual)</h4>
                    <div class="cr-summary-table-wrap">
                        <table class="cr-summary-table">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th class="cr-summary-table__num">Pagos</th>
                                    <th class="cr-summary-table__num">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(row, idx) in store.collectorSummary" :key="idx">
                                    <td class="cr-summary-table__name">{{ row.displayName || '—' }}</td>
                                    <td class="cr-summary-table__num">{{ row.paymentCount }}</td>
                                    <td class="cr-summary-table__num cr-summary-table__total">
                                        {{ fmtCurrency(row.totalAmount) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <module-tab-bar v-model="activeTab" class="cr-tabs" aria-label="Registro de caja">
                <module-tab value="current" icon="pi-list" :disabled="!store.hasOpenSession">
                    {{ L.MOVEMENTS }}
                </module-tab>
                <module-tab value="history" icon="pi-history">
                    {{ L.HISTORY }}
                </module-tab>
                <template #end>
                    <span v-if="activeTab === 'current' && store.hasOpenSession && movementFilterSummary"
                          class="cr-tabs__count">{{ movementFilterSummary }}</span>
                    <pv-button v-if="activeTab === 'current' && store.hasOpenSession"
                               :label="L.EXPORT_EXCEL"
                               icon="pi pi-file-excel"
                               size="small"
                               severity="success"
                               outlined
                               :disabled="store.currentSessionMovements.length === 0"
                               @click="exportCurrentMovementsExcel" />
                </template>
            </module-tab-bar>

            <div v-if="activeTab === 'current' && store.hasOpenSession" class="cr-panel__filters">
                <pv-icon-field class="cr-panel__search">
                    <pv-input-icon class="pi pi-search" />
                    <pv-input-text v-model="filterSearch"
                                  placeholder="Buscar orden, mesa, detalle…"
                                  class="w-full"
                                  size="small" />
                </pv-icon-field>
                <pv-select v-model="filterCategory"
                           :options="MOVEMENT_FILTER_CATEGORY_OPTIONS"
                           option-label="label"
                           option-value="value"
                           :placeholder="L.FILTER_CATEGORY"
                           show-clear
                           class="cr-panel__select"
                           size="small" />
                <pv-select v-model="filterType"
                           :options="MOVEMENT_FILTER_TYPE_OPTIONS"
                           option-label="label"
                           option-value="value"
                           :placeholder="L.FILTER_TYPE"
                           show-clear
                           class="cr-panel__select"
                           size="small" />
                <pv-select v-model="filterMethod"
                           :options="MOVEMENT_FILTER_METHOD_OPTIONS"
                           option-label="label"
                           option-value="value"
                           :placeholder="L.FILTER_METHOD"
                           show-clear
                           class="cr-panel__select"
                           size="small" />
                <pv-button v-if="hasActiveFilters"
                           :label="L.CLEAR_FILTERS"
                           icon="pi pi-filter-slash"
                           size="small"
                           severity="secondary"
                           text
                           @click="clearMovementFilters" />
            </div>

            <div class="cr-panel__body cr-panel__body--scroll">
        <div v-if="activeTab === 'current' && store.hasOpenSession">
            <div v-if="store.currentSessionMovements.length === 0" class="cr-state-msg">
                <i class="pi pi-inbox"></i>
                <span class="cr-state-msg__title">Sin movimientos en este turno</span>
                <span class="cr-state-msg__sub">Los cobros del POS y los movimientos manuales aparecerán aquí.</span>
                <pv-button :label="L.NEW_MOVEMENT" icon="pi pi-plus" size="small" @click="showMovementDialog = true" />
            </div>
            <div v-else-if="filteredCurrentMovements.length === 0" class="cr-state-msg">
                <i class="pi pi-filter"></i>
                <span class="cr-state-msg__title">Ningún resultado</span>
                <span class="cr-state-msg__sub">Prueba con otros filtros o limpia la búsqueda.</span>
                <pv-button :label="L.CLEAR_FILTERS" icon="pi pi-filter-slash" size="small" severity="secondary" outlined @click="clearMovementFilters" />
            </div>
            <div v-else-if="filteredCurrentMovements.length > 0" class="cr-table-wrap">
                <table class="cr-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>{{ L.ORDER }}</th>
                            <th>Categoría</th>
                            <th>{{ L.PAYMENT_METHOD }}</th>
                            <th>{{ L.DETAIL }}</th>
                            <th>Tipo</th>
                            <th style="text-align:right">Monto</th>
                            <th>{{ L.COLLECTED_BY }}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="mov in paginatedMovements"
                            :key="mov.id"
                            class="cr-row">
                            <td class="td-time" :title="formatDateTime(mov.createdAt)">{{ formatMovementTime(mov.createdAt) }}</td>
                            <td class="td-order font-semibold text-color">
                                {{ movementOrderLabel(mov) }}
                            </td>
                            <td>
                                <span class="cr-cat-badge" :class="`cr-cat-badge--${mov.category}`">
                                    <i :class="categoryIcon(mov.category)" aria-hidden="true" />
                                    {{ categoryLabel(mov.category) }}
                                </span>
                            </td>
                            <td>
                                <span v-if="movementPaymentMethodLabel(mov)" class="method-pill">
                                    <span class="method-dot" :style="{ background: methodDotColor(mov) }"></span>
                                    {{ movementPaymentMethodLabel(mov) }}
                                </span>
                                <span v-else class="text-color-secondary">—</span>
                            </td>
                            <td class="font-medium text-color td-detail">
                                {{ movementDescriptionText(mov) }}
                            </td>
                            <td>
                                <span class="badge"
                                      :style="mov.type === 'income'
                                          ? 'background:#dcfce7;color:#16a34a;border:1px solid #16a34a66'
                                          : 'background:#fee2e2;color:#dc2626;border:1px solid #dc262666'">
                                    {{ MOVEMENT_TYPE_CONFIG[mov.type]?.label ?? mov.type }}
                                </span>
                            </td>
                            <td class="td-amount" :style="mov.type === 'income' ? 'color:#16a34a' : 'color:#dc2626'">
                                {{ mov.type === 'expense' ? '−' : '+' }} {{ fmtCurrency(mov.amount) }}
                            </td>
                            <td class="td-user">{{ movementCollectedBy(mov) }}</td>
                            <td class="td-action">
                                <pv-button v-if="mov.paymentId"
                                           v-tooltip.top="L.VIEW_PAYMENT"
                                           icon="pi pi-external-link"
                                           severity="secondary"
                                           text rounded size="small"
                                           @click.stop="goToPayment(mov)" />
                                <pv-button v-if="canDeleteMovement(mov)"
                                           icon="pi pi-trash"
                                           severity="danger"
                                           text rounded size="small"
                                           @click.stop="onDeleteMovement(mov)" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginación movimientos -->
            <div v-if="filteredCurrentMovements.length > PAGE_SIZE" class="cr-pagination">
                <span class="cr-pagination__info">
                    {{ (movPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(movPage * PAGE_SIZE, filteredCurrentMovements.length) }}
                    de {{ filteredCurrentMovements.length }}
                </span>
                <div class="cr-pagination__controls">
                    <button class="cr-pagination__btn" :disabled="movPage <= 1" @click="movPage--">
                        <i class="pi pi-chevron-left"></i>
                    </button>
                    <span class="cr-pagination__page">{{ movPage }} / {{ movTotalPages }}</span>
                    <button class="cr-pagination__btn" :disabled="movPage >= movTotalPages" @click="movPage++">
                        <i class="pi pi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <div v-else-if="activeTab === 'current' && !store.hasOpenSession" class="cr-state-msg">
            <i class="pi pi-lock"></i>
            <span class="cr-state-msg__title">Turno cerrado</span>
            <span class="cr-state-msg__sub">Abre un turno para registrar movimientos o revisa el historial.</span>
            <pv-button :label="L.OPEN_SESSION" icon="pi pi-lock-open" size="small" severity="success" @click="showOpenDialog = true" />
        </div>

        <!-- Historial de turnos cerrados -->
        <div v-else-if="activeTab === 'history'">
            <div v-if="store.closedSessions.length === 0" class="cr-state-msg">
                <i class="pi pi-history"></i>
                <span class="cr-state-msg__title">Sin historial</span>
                <span class="cr-state-msg__sub">Los turnos cerrados y su rendición aparecerán aquí.</span>
            </div>
            <div v-else class="flex flex-column gap-3">
                <div v-for="session in store.closedSessions"
                     :key="session.id"
                     class="surface-card border-1 surface-border border-round-lg p-4 cursor-pointer"
                     @click="toggleSessionDetail(session.id)">

                    <!-- Header row -->
                    <div class="flex align-items-center justify-content-between mb-2">
                        <div class="flex align-items-center gap-2">
                            <pv-tag :value="`${session.shiftName || 'Turno'} — ${SESSION_STATUS_CONFIG.closed.label}`"
                                    :icon="SESSION_STATUS_CONFIG.closed.icon"
                                    :severity="SESSION_STATUS_CONFIG.closed.severity" />
                            <span class="text-sm text-color-secondary">
                                {{ formatDateTime(session.openedAt) }} — {{ formatDateTime(session.closedAt) }}
                            </span>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <pv-button icon="pi pi-file-excel"
                                       :label="L.EXPORT_EXCEL"
                                       size="small"
                                       severity="success"
                                       outlined
                                       @click.stop="exportHistorySessionExcel(session)" />
                            <span v-if="session.hasCashShortage" class="text-sm font-bold text-red-400">
                                Faltante: {{ fmtCurrency(Math.abs(session.difference)) }}
                            </span>
                            <span v-else-if="session.hasCashSurplus" class="text-sm font-bold text-orange-400">
                                Sobrante: {{ fmtCurrency(session.difference) }}
                            </span>
                            <span v-else-if="session.countedAmount !== null" class="text-sm font-bold text-green-400">
                                Cuadrado
                            </span>
                            <i :class="expandedSession === session.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
                        </div>
                    </div>

                    <!-- Summary row -->
                    <div class="flex flex-wrap gap-4 text-sm">
                        <span class="text-color-secondary">Cajero: <strong class="text-color">{{ session.openedBy }}</strong></span>
                        <span class="text-color-secondary">Ventas: <strong class="text-color">{{ session.totalSales }}</strong></span>
                        <span class="text-color-secondary">Total vendido: <strong class="text-green-400">{{ fmtCurrency(session.totalRevenue) }}</strong></span>
                        <span class="text-color-secondary">Efectivo: <strong class="text-color">{{ fmtCurrency(session.cashRevenue) }}</strong></span>
                        <span class="text-color-secondary">Digital: <strong class="text-purple-400">{{ fmtCurrency(session.digitalRevenue) }}</strong></span>
                    </div>

                    <!-- Expanded detail -->
                    <div v-if="expandedSession === session.id" class="mt-3 pt-3 border-top-1 surface-border">
                        <div class="grid">
                            <div class="col-12 md:col-6">
                                <p class="text-xs text-color-secondary uppercase font-medium mt-0 mb-2">Rendición de Caja</p>
                                <div class="flex flex-column gap-2 text-sm">
                                    <div class="flex justify-content-between">
                                        <span class="text-color-secondary">Monto Inicial</span>
                                        <span class="font-medium text-color">{{ fmtCurrency(session.initialAmount) }}</span>
                                    </div>
                                    <div class="flex justify-content-between">
                                        <span class="text-color-secondary">Efectivo Esperado</span>
                                        <span class="font-medium text-color">{{ fmtCurrency(session.expectedCash) }}</span>
                                    </div>
                                    <div class="flex justify-content-between">
                                        <span class="text-color-secondary">Efectivo Contado</span>
                                        <span class="font-bold text-color">{{ fmtCurrency(session.countedAmount) }}</span>
                                    </div>
                                    <div class="flex justify-content-between">
                                        <span class="text-color-secondary">Diferencia</span>
                                        <span :class="['font-bold', session.difference < 0 ? 'text-red-400' : session.difference > 0 ? 'text-orange-400' : 'text-green-400']">
                                            {{ session.difference >= 0 ? '+' : '' }}{{ fmtCurrency(session.difference) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 md:col-6">
                                <p class="text-xs text-color-secondary uppercase font-medium mt-0 mb-2">Detalles</p>
                                <div class="flex flex-column gap-2 text-sm">
                                    <div class="flex justify-content-between">
                                        <span class="text-color-secondary">Abierto por</span>
                                        <span class="font-medium text-color">
                                            {{ session.openedBy }}
                                            <span
                                                v-if="session.openedByUserId"
                                                class="cr-audit-id"
                                                :title="session.openedByUserId"
                                            > · {{ formatUserAudit(session.openedByUserId) }}</span>
                                        </span>
                                    </div>
                                    <div class="flex justify-content-between">
                                        <span class="text-color-secondary">Cerrado por</span>
                                        <span class="font-medium text-color">
                                            {{ session.closedBy }}
                                            <span
                                                v-if="session.closedByUserId"
                                                class="cr-audit-id"
                                                :title="session.closedByUserId"
                                            > · {{ formatUserAudit(session.closedByUserId) }}</span>
                                        </span>
                                    </div>
                                    <div v-if="session.notes" class="flex justify-content-between">
                                        <span class="text-color-secondary">Notas</span>
                                        <span class="font-italic text-color">{{ session.notes }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Movimientos del turno cerrado -->
                        <p class="text-xs text-color-secondary uppercase font-medium mt-3 mb-2">Movimientos del turno</p>
                        <div class="cr-table-wrap">
                            <table class="cr-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>{{ L.ORDER }}</th>
                                        <th>Categoría</th>
                                        <th>{{ L.PAYMENT_METHOD }}</th>
                                        <th>{{ L.DETAIL }}</th>
                                        <th>Tipo</th>
                                        <th style="text-align:right">Monto</th>
                                        <th>{{ L.COLLECTED_BY }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="mov in store.getMovementsBySession(session.id)"
                                        :key="mov.id"
                                        class="cr-row">
                                        <td class="td-time" :title="formatDateTime(mov.createdAt)">{{ formatMovementTime(mov.createdAt) }}</td>
                                        <td class="td-order font-semibold text-color">{{ movementOrderLabel(mov) }}</td>
                                        <td>
                                            <span class="cr-cat-badge" :class="`cr-cat-badge--${mov.category}`">
                                                <i :class="categoryIcon(mov.category)" aria-hidden="true" />
                                                {{ categoryLabel(mov.category) }}
                                            </span>
                                        </td>
                                        <td>{{ movementPaymentMethodLabel(mov) || '—' }}</td>
                                        <td class="text-color">{{ movementDescriptionText(mov) }}</td>
                                        <td>
                                            <span class="badge"
                                                  :style="mov.type === 'income'
                                                      ? 'background:#dcfce7;color:#16a34a;border:1px solid #16a34a66'
                                                      : 'background:#fee2e2;color:#dc2626;border:1px solid #dc262666'">
                                                {{ MOVEMENT_TYPE_CONFIG[mov.type]?.label ?? mov.type }}
                                            </span>
                                        </td>
                                        <td class="td-amount" :style="mov.type === 'income' ? 'color:#16a34a' : 'color:#dc2626'">
                                            {{ mov.type === 'expense' ? '−' : '+' }} {{ fmtCurrency(mov.amount) }}
                                        </td>
                                        <td class="td-user">{{ movementCollectedBy(mov) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            </div>
        </section>
        </template>

        <!-- Dialogs -->
        <open-session-dialog
            v-model:visible="showOpenDialog"
            @session-opened="onSessionOpened"
        />

        <close-session-dialog
            v-model:visible="showCloseDialog"
            @session-closed="onSessionClosed"
        />

        <create-movement-dialog
            v-model:visible="showMovementDialog"
            @movement-saved="onMovementSaved"
        />

    </div>
    </module-state-feedback>
    </div>
    </div>
</template>

<style scoped>
.cr-page--fill {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.cr-page__shell {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.cr-home {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0.5rem 0.75rem 0.75rem;
}

/* ── Resumen del turno (jerarquía visual) ─────────────────────────────── */
.cr-hero {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.65rem 0.85rem 0.7rem;
    background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 48%, #fff 100%);
    border-bottom: 1px solid #e2e8f0;
}

.cr-hero__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.cr-hero__cash {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
}

.cr-hero__cash-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6366f1;
}

.cr-hero__cash-value {
    font-size: 1.45rem;
    font-weight: 800;
    color: #312e81;
    line-height: 1.1;
    letter-spacing: -0.02em;
}

.cr-hero__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
}

.cr-hero__kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
    gap: 0.45rem;
}

.cr-kpi {
    padding: 0.4rem 0.55rem;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

.cr-kpi__label {
    display: block;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #64748b;
    margin-bottom: 0.15rem;
}

.cr-kpi__value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
}

.cr-kpi__value--digital { color: #6d28d9; }

.cr-hero__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.76rem;
    color: #64748b;
}

.cr-hero__meta-text strong { color: #334155; }

.cr-hero__tag :deep(.p-tag) {
    font-size: 0.68rem;
    padding: 0.1rem 0.4rem;
}

.cr-audit-id {
    font-size: 0.72rem;
    color: #94a3b8;
    font-weight: 500;
    cursor: help;
}

.cr-tabs__count {
    font-size: 0.75rem;
    color: #64748b;
    white-space: nowrap;
    margin-right: 0.25rem;
}

/* ── Panel «Ver resumen del turno» ─────────────────────────────────────── */
.cr-summary-panel {
    padding: 0.75rem 0.85rem 0.85rem;
    background: #f1f5f9;
    border-bottom: 1px solid #cbd5e1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.cr-summary-panel__head {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.cr-summary-panel__title {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
}

.cr-summary-panel__hint {
    font-size: 0.75rem;
    color: #475569;
}

.cr-summary-panel__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
    gap: 0.5rem;
}

.cr-summary-stat {
    padding: 0.55rem 0.65rem;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.cr-summary-stat__label {
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #475569;
    margin-bottom: 0.25rem;
}

.cr-summary-stat__value {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
}

.cr-summary-stat--danger .cr-summary-stat__value { color: #b91c1c; }
.cr-summary-stat--tip .cr-summary-stat__value { color: #be185d; }

.cr-summary-block {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.cr-summary-block__title {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #334155;
}

.cr-summary-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
    gap: 0.45rem;
}

.cr-summary-method {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.5rem 0.6rem;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
}

.cr-summary-method__head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.cr-summary-method__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.cr-summary-method__label {
    font-size: 0.78rem;
    font-weight: 600;
    color: #334155;
}

.cr-summary-method__amount {
    font-size: 0.95rem;
    font-weight: 800;
    color: #0f172a;
}

.cr-summary-method--zero .cr-summary-method__amount {
    color: #64748b;
    font-weight: 600;
}

.cr-summary-table-wrap {
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.cr-summary-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
}

.cr-summary-table thead tr {
    background: #e2e8f0;
    border-bottom: 2px solid #cbd5e1;
}

.cr-summary-table th {
    padding: 0.55rem 0.75rem;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 700;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.cr-summary-table td {
    padding: 0.6rem 0.75rem;
    color: #0f172a;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
}

.cr-summary-table tbody tr:last-child td {
    border-bottom: none;
}

.cr-summary-table tbody tr:hover {
    background: #f8fafc;
}

.cr-summary-table__name {
    font-weight: 600;
    color: #0f172a;
}

.cr-summary-table__num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: #334155;
}

.cr-summary-table__total {
    font-weight: 800;
    color: #0f172a;
}

@media (max-width: 768px) {
    .cr-hero__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .cr-hero__cash-value {
        font-size: 1.25rem;
    }
}

.cr-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 10px;
    flex-shrink: 0;
}

.cr-banner__text {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.88rem;
    color: #92400e;
    max-width: 42rem;
}

.cr-banner__text .pi { margin-top: 0.1rem; flex-shrink: 0; }

.cr-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 3rem 1.5rem;
    background: #fff;
    border: 1px dashed #e5e7eb;
    border-radius: 12px;
    color: #9ca3af;
}

.cr-empty .pi { font-size: 2rem; color: #d1d5db; }
.cr-empty__title { font-size: 1rem; font-weight: 600; color: #6b7280; }
.cr-empty__sub { font-size: 0.85rem; margin-bottom: 0.35rem; text-align: center; }

.cr-panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.cr-panel--fill {
    flex: 1;
}

.cr-tabs {
    flex-shrink: 0;
}

.cr-panel__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.65rem;
    padding: 0.55rem 0.85rem;
    border-bottom: 1px solid #f1f5f9;
    flex-shrink: 0;
}

.cr-panel__search { flex: 1; min-width: 12rem; }
.cr-panel__select { min-width: 9.5rem; flex-shrink: 0; }

.cr-panel__body {
    padding: 0.5rem 0.75rem 0.75rem;
    flex: 1;
    min-height: 0;
}

.cr-panel__body--scroll {
    overflow-y: auto;
}

.cr-state-msg {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    padding: 2.25rem 1.25rem;
    text-align: center;
}

.cr-state-msg .pi {
    font-size: 2rem;
    color: #d1d5db;
}

.cr-state-msg__title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #6b7280;
}

.cr-state-msg__sub {
    font-size: 0.85rem;
    color: #9ca3af;
    max-width: 22rem;
    margin-bottom: 0.25rem;
}

.cr-cat-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    white-space: nowrap;
}

.cr-cat-badge .pi { font-size: 0.7rem; }

.cr-cat-badge--venta { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
.cr-cat-badge--venta_digital { background: #ede9fe; color: #6d28d9; border-color: #ddd6fe; }
.cr-cat-badge--apertura { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
.cr-cat-badge--reembolso { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
.cr-cat-badge--PROPIA { background: #fce7f3; color: #be185d; border-color: #fbcfe8; }

.method-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.cr-table-wrap {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow-x: auto;
}

.cr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.83rem;
}

.cr-table thead tr {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
}

.cr-table th {
    padding: 0.7rem 0.85rem;
    text-align: left;
    font-size: 0.73rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
}

.cr-row {
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.1s;
}
.cr-row:hover { background: #fafafe; }

.cr-table td {
    padding: 0.7rem 0.85rem;
    color: #374151;
    vertical-align: middle;
}

.td-time   { color: #6b7280; white-space: nowrap; }
.td-order  { white-space: nowrap; }
.td-amount { text-align: right; font-weight: 600; white-space: nowrap; }
.td-user   { color: #6b7280; max-width: 10rem; }
.td-action { width: 4.5rem; text-align: center; white-space: nowrap; }

.td-detail {
    max-width: 14rem;
    line-height: 1.35;
}

.method-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    white-space: nowrap;
}

.badge {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}

/* ── Pagination ──────────────────────────────────────────────────────────── */
.cr-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.25rem;
}

.cr-pagination__info {
    font-size: 0.78rem;
    color: #6b7280;
}

.cr-pagination__controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.cr-pagination__page {
    font-size: 0.78rem;
    font-weight: 600;
    color: #374151;
    min-width: 3.5rem;
    text-align: center;
}

.cr-pagination__btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    color: #374151;
    transition: background 0.12s, border-color 0.12s;
}
.cr-pagination__btn:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
.cr-pagination__btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
