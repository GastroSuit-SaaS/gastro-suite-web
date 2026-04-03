<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCashRegisterStore } from '../../application/cash-register.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { useDateFormatter }  from '../../../shared/composables/use-date-formatter.js'
import {
    CASH_REGISTER_LABELS as L,
    SESSION_STATUS_CONFIG,
    MOVEMENT_TYPE_CONFIG,
    MOVEMENT_CATEGORY_CONFIG,
} from '../constants/cash-register.constants-ui.js'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'
import OpenSessionDialog    from './open-session-dialog.vue'
import CloseSessionDialog   from './close-session-dialog.vue'
import CreateMovementDialog from './create-movement-dialog.vue'

const store = useCashRegisterStore()
const { confirmDelete } = useConfirmDialog()
const { elapsedTime } = useDateFormatter()
function formatDateTime(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    if (isNaN(d)) return dt
    return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => { store.fetchAll() })

// ── Dialog visibility ─────────────────────────────────────────────────────
const showOpenDialog     = ref(false)
const showCloseDialog    = ref(false)
const showMovementDialog = ref(false)

async function onSessionOpened(payload) {
    await store.openSession(payload)
}

async function onSessionClosed(payload) {
    await store.closeSession(payload)
}

async function onMovementSaved(payload) {
    await store.addMovement(payload)
}

// ── Delete Movement ───────────────────────────────────────────────────────
function onDeleteMovement(mov) {
    confirmDelete({
        target:  mov.description,
        accept:  () => store.remove(mov.id),
    })
}

// ── History Tab ───────────────────────────────────────────────────────────
const activeTab       = ref('current')   // 'current' | 'history'
const expandedSession = ref(null)        // session.id expandido en historial
// ── Paginación movimientos turno actual ───────────────────────────────
const PAGE_SIZE = 10
const movPage   = ref(1)

const movTotalPages = computed(() => Math.max(1, Math.ceil(store.currentSessionMovements.length / PAGE_SIZE)))
const paginatedMovements = computed(() => {
    const start = (movPage.value - 1) * PAGE_SIZE
    return store.currentSessionMovements.slice(start, start + PAGE_SIZE)
})
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
function categoryColor(cat) {
    return MOVEMENT_CATEGORY_CONFIG[cat]?.color ?? 'text-color-secondary'
}
function fmtCurrency(n) {
    return `S/ ${(n ?? 0).toFixed(2)}`
}
</script>

<template>
    <module-state-feedback
        :loading="store.isLoading"
        :error="store.error"
        loading-label="Cargando caja..."
        @retry="store.fetchAll()"
    >
    <div class="cr-home">

        <!-- ══ Stat cards (turno abierto) ════════════════════════════════ -->
        <div v-if="store.hasOpenSession" class="stat-strip">
            <!-- Card principal: Efectivo Esperado -->
            <div class="stat-card stat-card--primary">
                <span class="stat-card__label">Efectivo en gaveta</span>
                <span class="stat-card__value">{{ fmtCurrency(store.sessionExpectedCash) }}</span>
                <span class="stat-card__sub">
                    <i class="pi pi-lock-open" style="font-size:.7rem"></i>
                    {{ store.currentSession.shiftName || 'Turno' }} — {{ elapsedTime(store.currentSession.openedAt) }}
                </span>
            </div>
            <div class="stat-card">
                <div class="stat-card__method-row">
                    <span class="method-dot" style="background:#10b981"></span>
                    <span class="stat-card__label">Ventas Efectivo</span>
                </div>
                <span class="stat-card__value stat-card__value--sm">{{ fmtCurrency(store.sessionCashIncome - store.currentSession.initialAmount) }}</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__method-row">
                    <span class="method-dot" style="background:#8b5cf6"></span>
                    <span class="stat-card__label">Ventas Digitales</span>
                </div>
                <span class="stat-card__value stat-card__value--sm">{{ fmtCurrency(store.sessionDigitalIncome) }}</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__method-row">
                    <span class="method-dot" style="background:#3b82f6"></span>
                    <span class="stat-card__label">Ventas Totales</span>
                </div>
                <span class="stat-card__value stat-card__value--sm">{{ fmtCurrency((store.sessionCashIncome - store.currentSession.initialAmount) + store.sessionDigitalIncome) }}</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__method-row">
                    <span class="method-dot" style="background:#6b7280"></span>
                    <span class="stat-card__label">N° Ventas</span>
                </div>
                <span class="stat-card__value stat-card__value--sm">{{ store.sessionSalesCount }}</span>
            </div>
        </div>

        <!-- ══ Barra de contexto + acciones ══════════════════════════════ -->
        <div v-if="store.hasOpenSession" class="flex align-items-center flex-wrap gap-3">
            <!-- Info del turno -->
            <div class="flex align-items-center gap-2 flex-1" style="min-width: 200px">
                <pv-tag :value="SESSION_STATUS_CONFIG.open.label"
                        :icon="SESSION_STATUS_CONFIG.open.icon"
                        :severity="SESSION_STATUS_CONFIG.open.severity" />
                <span class="text-sm text-color-secondary">
                    Cajero: <strong class="text-color">{{ store.currentSession.openedBy }}</strong>
                </span>
                <span class="cr-info-divider"></span>
                <span class="text-sm text-color-secondary">
                    Inicial: <strong class="text-color">{{ fmtCurrency(store.currentSession.initialAmount) }}</strong>
                </span>
                <span class="cr-info-divider"></span>
                <span class="text-sm text-color-secondary">
                    Egresos: <strong class="text-red-400">{{ fmtCurrency(store.sessionCashExpense) }}</strong>
                </span>
            </div>
            <!-- Acciones -->
            <div class="flex gap-2">
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

        <!-- ══ No session ════════════════════════════════════════════════ -->
        <div v-else-if="!store.isLoading" class="cr-empty">
            <i class="pi pi-lock" style="font-size:2rem;color:#d1d5db"></i>
            <span class="cr-empty__title">{{ L.NO_SESSION }}</span>
            <span class="cr-empty__sub">Abre un turno para comenzar a registrar movimientos de caja.</span>
            <pv-button :label="L.OPEN_SESSION" icon="pi pi-lock-open" severity="success" @click="showOpenDialog = true" />
        </div>

        <!-- ══ Tabs ══════════════════════════════════════════════════════ -->
        <div v-if="store.sessions.length > 0" class="flex align-items-center gap-3">
            <div class="flex gap-2">
                <pv-button :label="L.MOVEMENTS"
                           :outlined="activeTab !== 'current'"
                           size="small"
                           @click="activeTab = 'current'" />
                <pv-button :label="L.HISTORY"
                           :outlined="activeTab !== 'history'"
                           size="small"
                           severity="secondary"
                           @click="activeTab = 'history'" />
            </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- Current Session Movements                                      -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'current' && store.hasOpenSession">
            <div v-if="store.currentSessionMovements.length === 0" class="text-center text-color-secondary py-4">
                No hay movimientos en este turno aún.
            </div>
            <div v-else class="cr-table-wrap">
                <table class="cr-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Categoría</th>
                            <th>Descripción</th>
                            <th>Tipo</th>
                            <th style="text-align:right">Monto</th>
                            <th>Usuario</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="mov in paginatedMovements"
                            :key="mov.id"
                            class="cr-row">
                            <td class="td-time">{{ formatDateTime(mov.createdAt) }}</td>
                            <td>
                                <div class="flex align-items-center gap-2">
                                    <i :class="[categoryIcon(mov.category), categoryColor(mov.category)]" />
                                    <span>{{ categoryLabel(mov.category) }}</span>
                                </div>
                            </td>
                            <td class="font-medium text-color">{{ mov.description }}</td>
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
                            <td class="td-user">{{ mov.userName }}</td>
                            <td class="td-action">
                                <pv-button v-if="mov.category !== 'apertura'"
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
            <div v-if="store.currentSessionMovements.length > PAGE_SIZE" class="cr-pagination">
                <span class="cr-pagination__info">
                    {{ (movPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(movPage * PAGE_SIZE, store.currentSessionMovements.length) }}
                    de {{ store.currentSessionMovements.length }}
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

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- History of Closed Sessions                                     -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'history'">
            <div v-if="store.closedSessions.length === 0" class="text-center text-color-secondary py-4">
                No hay turnos cerrados en el historial.
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
                        <div class="flex align-items-center gap-3">
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
                                        <span class="font-medium text-color">{{ session.openedBy }}</span>
                                    </div>
                                    <div class="flex justify-content-between">
                                        <span class="text-color-secondary">Cerrado por</span>
                                        <span class="font-medium text-color">{{ session.closedBy }}</span>
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
                                        <th>Categoría</th>
                                        <th>Descripción</th>
                                        <th>Tipo</th>
                                        <th style="text-align:right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="mov in store.getMovementsBySession(session.id)"
                                        :key="mov.id"
                                        class="cr-row">
                                        <td class="td-time">{{ formatDateTime(mov.createdAt) }}</td>
                                        <td>
                                            <div class="flex align-items-center gap-2">
                                                <i :class="[categoryIcon(mov.category), categoryColor(mov.category)]" />
                                                <span>{{ categoryLabel(mov.category) }}</span>
                                            </div>
                                        </td>
                                        <td class="text-color">{{ mov.description }}</td>
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
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- Dialogs                                                        -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
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
</template>

<style scoped>
/* ── Contenedor principal (mismo patrón que payments) ────────────────────── */
.cr-home {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    height: 100%;
    overflow-y: auto;
    background: #f3f4f6;
}

/* ── Stat strip ──────────────────────────────────────────────────────────── */
.stat-strip {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.stat-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 130px;
}

.stat-card--primary {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-color: transparent;
    color: #fff;
}
.stat-card--primary .stat-card__label { color: rgba(255,255,255,0.75); }
.stat-card--primary .stat-card__sub   { color: rgba(255,255,255,0.6); font-size: 0.75rem; display: flex; align-items: center; gap: 0.3rem; }

.stat-card__method-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.method-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.stat-card__label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.stat-card__value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #111827;
    line-height: 1;
}
.stat-card--primary .stat-card__value { color: #fff; }
.stat-card__value--sm { font-size: 1.2rem; }

/* ── Info divider ────────────────────────────────────────────────────────── */
.cr-info-divider {
    width: 1px;
    height: 1rem;
    background: #d1d5db;
    flex-shrink: 0;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.cr-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #9ca3af;
    padding: 3rem;
}
.cr-empty__title { font-size: 1rem; font-weight: 600; color: #6b7280; }
.cr-empty__sub   { font-size: 0.83rem; margin-bottom: 0.5rem; }

/* ── Tabla ───────────────────────────────────────────────────────────────── */
.cr-table-wrap {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
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
.td-amount { text-align: right; font-weight: 600; white-space: nowrap; }
.td-user   { color: #6b7280; }
.td-action { width: 2.5rem; text-align: center; }

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
