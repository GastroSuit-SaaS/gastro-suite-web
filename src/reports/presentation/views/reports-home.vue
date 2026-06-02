<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '../../application/reports.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { REPORT_TYPE_LABELS, EXPORT_FORMAT_LABELS } from '../constants/reports.constants-ui.js'
import { REPORT_TYPE, REPORT_STATUS, EXPORT_FORMAT } from '../../domain/models/report.entity.js'
import { exportCollectorSalesReportExcel } from '../utils/reports-excel.js'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'

const store = useReportsStore()
const { confirmDelete } = useConfirmDialog()

onMounted(() => store.fetchAll())

const showGenerate = ref(false)
const showDetail = ref(false)
const detailReport = ref(null)

/** Opciones para filtro por tipo (desplegable). */
const reportTypeFilterOptions = [
    { label: 'Todos los tipos', value: null },
    ...Object.entries(REPORT_TYPE).map(([key, value]) => ({
        label: REPORT_TYPE_LABELS[key] ?? key,
        value,
    })),
]

function todayInputValue() {
    return new Date().toISOString().slice(0, 10)
}

function clearReportFilters() {
    store.filterType = null
    store.filterStatus = null
}

function toggleStatus(status) {
    store.filterStatus = store.filterStatus === status ? null : status
}

const newReport = ref({
    type: REPORT_TYPE.COLLECTOR_SALES,
    exportFormat: EXPORT_FORMAT.EXCEL,
    title: '',
    dateFrom: todayInputValue(),
    dateTo: todayInputValue(),
})

function openGenerate() {
    newReport.value = {
        type: REPORT_TYPE.COLLECTOR_SALES,
        exportFormat: EXPORT_FORMAT.EXCEL,
        title: '',
        dateFrom: todayInputValue(),
        dateTo: todayInputValue(),
    }
    showGenerate.value = true
}

async function onGenerate() {
    const r = newReport.value
    if (!r.title.trim()) {
        r.title = REPORT_TYPE_LABELS[r.type?.toUpperCase()] ?? 'Reporte'
    }
    const dateFrom = r.dateFrom ? new Date(`${r.dateFrom}T00:00:00`).toISOString() : null
    const dateTo = r.dateTo ? new Date(`${r.dateTo}T23:59:59.999`).toISOString() : null
    const ok = await store.generate({
        type: r.type,
        title: r.title,
        exportFormat: EXPORT_FORMAT.EXCEL,
        dateFrom,
        dateTo,
    })
    if (ok) {
        showGenerate.value = false
    }
}

function openDetail(report) {
    detailReport.value = report
    showDetail.value = true
}

function onDelete(report) {
    confirmDelete('el reporte', report.title, () => store.remove(report.id))
}

function typeLabel(type) {
    const key = String(type ?? '').toUpperCase().replace(/-/g, '_')
    return REPORT_TYPE_LABELS[key] ?? type
}

function formatLabel(format) {
    return EXPORT_FORMAT_LABELS[format?.toUpperCase()] ?? format
}

function statusConfig(status) {
    const map = {
        [REPORT_STATUS.GENERATED]: { label: 'Generado',  color: '#059669', bg: '#d1fae5', icon: 'pi-check-circle' },
        [REPORT_STATUS.PENDING]:   { label: 'Pendiente', color: '#f59e0b', bg: '#fef3c7', icon: 'pi-clock' },
        [REPORT_STATUS.FAILED]:    { label: 'Fallido',   color: '#dc2626', bg: '#fef2f2', icon: 'pi-times-circle' },
    }
    return map[status] ?? { label: status, color: '#6b7280', bg: '#f3f4f6', icon: 'pi-question-circle' }
}

function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatMoney(value) {
    const n = Number(value ?? 0)
    return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatPeriod(report) {
    if (!report?.dateFrom && !report?.dateTo) return '—'
    const from = report.dateFrom ? formatDate(report.dateFrom) : '—'
    const to = report.dateTo ? formatDate(report.dateTo) : '—'
    return `${from} → ${to}`
}

const isCollectorReport = computed(() =>
    detailReport.value?.type === REPORT_TYPE.COLLECTOR_SALES,
)

const collectorRows = computed(() =>
    detailReport.value?.data?.collectors ?? [],
)

const collectorTotals = computed(() => ({
    payments: detailReport.value?.data?.totalPayments ?? 0,
    amount: detailReport.value?.data?.totalAmount ?? 0,
}))

function exportDetailExcel() {
    if (!detailReport.value || !isCollectorReport.value) return
    exportCollectorSalesReportExcel(detailReport.value)
}

function clearSearch() {
    store.searchQuery = ''
}
</script>

<template>
    <div class="rpt-layout">
        <module-state-feedback
            :loading="store.isLoading"
            :error="store.error"
            loading-label="Cargando reportes..."
            @retry="store.fetchAll()"
        >

        <!-- ── Resumen compacto (chips) ────────────────────────── -->
        <div class="stat-row">
            <button
                type="button"
                :class="['stat-chip', 'stat-chip--btn', store.filterStatus === null && !store.filterType && 'stat-chip--active-indigo']"
                @click="clearReportFilters()"
            >
                <span class="stat-chip__label">Total reportes</span>
                <span class="stat-chip__value">{{ store.totalReports }}</span>
            </button>

            <button
                type="button"
                :class="['stat-chip', 'stat-chip--btn', store.filterStatus === 'generated' && 'stat-chip--active-green']"
                @click="toggleStatus('generated')"
            >
                <span class="stat-chip__dot" style="background:#059669"></span>
                <span class="stat-chip__label">Generados</span>
                <span class="stat-chip__value stat-chip__value--success">{{ store.generatedCount }}</span>
            </button>

            <button
                type="button"
                :class="['stat-chip', 'stat-chip--btn', store.filterStatus === 'pending' && 'stat-chip--active-orange']"
                @click="toggleStatus('pending')"
            >
                <span class="stat-chip__dot" style="background:#f59e0b"></span>
                <span class="stat-chip__label">Pendientes</span>
                <span class="stat-chip__value stat-chip__value--warning">{{ store.pendingCount }}</span>
            </button>

            <button
                type="button"
                :class="['stat-chip', 'stat-chip--btn', store.filterStatus === 'failed' && 'stat-chip--active-red']"
                @click="toggleStatus('failed')"
            >
                <span class="stat-chip__dot" style="background:#dc2626"></span>
                <span class="stat-chip__label">Fallidos</span>
                <span class="stat-chip__value stat-chip__value--danger">{{ store.failedCount }}</span>
            </button>
        </div>

        <!-- ── Toolbar ───────────────────────────────────────────── -->
        <div class="rpt-toolbar">
            <div class="rpt-toolbar__search">
                <span style="position:relative">
                    <i class="pi pi-search" style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; z-index:1"></i>
                    <input
                        v-model="store.searchQuery"
                        type="text"
                        placeholder="Buscar reportes..."
                        class="rpt-search-input"
                    />
                    <button v-if="store.searchQuery" class="rpt-search-clear" @click="clearSearch">
                        <i class="pi pi-times"></i>
                    </button>
                </span>
            </div>

            <pv-select
                v-model="store.filterType"
                :options="reportTypeFilterOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tipo de reporte"
                size="small"
                showClear
                class="rpt-type-select"
            />

            <button class="rpt-btn rpt-btn--primary" @click="openGenerate">
                <i class="pi pi-plus"></i> Generar reporte
            </button>
        </div>

        <!-- ── Reports List ──────────────────────────────────────── -->
        <div v-if="store.filteredReports.length === 0" class="rpt-empty">
            <i class="pi pi-inbox" style="font-size:2.5rem; color:#cbd5e1"></i>
            <p>No se encontraron reportes</p>
        </div>

        <div v-else class="rpt-list">
            <div v-for="report in store.filteredReports" :key="report.id" class="rpt-card" @click="openDetail(report)">
                <div class="rpt-card__left">
                    <div class="rpt-card__icon-wrap" :style="{ background: statusConfig(report.status).bg }">
                        <i :class="['pi', statusConfig(report.status).icon]" :style="{ color: statusConfig(report.status).color }"></i>
                    </div>
                    <div class="rpt-card__info">
                        <div class="rpt-card__title">{{ report.title }}</div>
                        <div class="rpt-card__meta">
                            <span class="rpt-card__type">{{ typeLabel(report.type) }}</span>
                            <span class="rpt-card__sep">·</span>
                            <span>{{ formatLabel(report.exportFormat) }}</span>
                            <span class="rpt-card__sep">·</span>
                            <span>{{ formatDate(report.generatedAt) }}</span>
                        </div>
                    </div>
                </div>
                <div class="rpt-card__right">
                    <span
                        class="rpt-card__badge"
                        :style="{ background: statusConfig(report.status).bg, color: statusConfig(report.status).color }"
                    >
                        {{ statusConfig(report.status).label }}
                    </span>
                    <button class="rpt-card__action" title="Eliminar" @click.stop="onDelete(report)">
                        <i class="pi pi-trash"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- ── Generate Dialog ───────────────────────────────────── -->
        <Teleport to="body">
            <div v-if="showGenerate" class="rpt-overlay" @click.self="showGenerate = false">
                <div class="rpt-dialog">
                    <div class="rpt-dialog__header">
                        <h3>Generar nuevo reporte</h3>
                        <button class="rpt-dialog__close" @click="showGenerate = false">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>
                    <div class="rpt-dialog__body">
                        <label class="rpt-field">
                            <span class="rpt-field__label">Título</span>
                            <input v-model="newReport.title" type="text" placeholder="Título del reporte (opcional)" class="rpt-field__input" />
                        </label>
                        <label class="rpt-field">
                            <span class="rpt-field__label">Tipo de reporte</span>
                            <select v-model="newReport.type" class="rpt-field__input">
                                <option v-for="(label, key) in REPORT_TYPE_LABELS" :key="key" :value="REPORT_TYPE[key] ?? key.toLowerCase()">
                                    {{ label }}
                                </option>
                            </select>
                        </label>
                        <div class="rpt-field-row">
                            <label class="rpt-field">
                                <span class="rpt-field__label">Desde</span>
                                <input v-model="newReport.dateFrom" type="date" class="rpt-field__input" />
                            </label>
                            <label class="rpt-field">
                                <span class="rpt-field__label">Hasta</span>
                                <input v-model="newReport.dateTo" type="date" class="rpt-field__input" />
                            </label>
                        </div>
                        <label class="rpt-field">
                            <span class="rpt-field__label">Formato de exportación</span>
                            <input type="text" class="rpt-field__input" value="Excel (.xlsx)" disabled />
                        </label>
                    </div>
                    <div class="rpt-dialog__footer">
                        <button class="rpt-btn" @click="showGenerate = false">Cancelar</button>
                        <button class="rpt-btn rpt-btn--primary" @click="onGenerate">
                            <i class="pi pi-chart-bar"></i> Generar
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- ── Detail Dialog ─────────────────────────────────────── -->
        <Teleport to="body">
            <div v-if="showDetail && detailReport" class="rpt-overlay" @click.self="showDetail = false">
                <div class="rpt-dialog rpt-dialog--wide">
                    <div class="rpt-dialog__header">
                        <div>
                            <h3>{{ detailReport.title }}</h3>
                            <p class="rpt-dialog__subtitle">
                                {{ typeLabel(detailReport.type) }} · {{ formatPeriod(detailReport) }}
                            </p>
                        </div>
                        <button class="rpt-dialog__close" @click="showDetail = false">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>
                    <div class="rpt-dialog__body">
                        <template v-if="isCollectorReport">
                            <div class="rpt-summary-row">
                                <div class="rpt-summary-card">
                                    <span class="rpt-summary-card__label">Pagos</span>
                                    <span class="rpt-summary-card__value">{{ collectorTotals.payments }}</span>
                                </div>
                                <div class="rpt-summary-card">
                                    <span class="rpt-summary-card__label">Total cobrado</span>
                                    <span class="rpt-summary-card__value">S/ {{ formatMoney(collectorTotals.amount) }}</span>
                                </div>
                                <div class="rpt-summary-card">
                                    <span class="rpt-summary-card__label">Cobradores</span>
                                    <span class="rpt-summary-card__value">{{ collectorRows.length }}</span>
                                </div>
                            </div>
                            <div v-if="collectorRows.length === 0" class="rpt-empty rpt-empty--compact">
                                <p>Sin cobros en el periodo seleccionado.</p>
                            </div>
                            <table v-else class="rpt-table">
                                <thead>
                                    <tr>
                                        <th>Empleado / cobrador</th>
                                        <th>Pagos</th>
                                        <th>Total (S/)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, idx) in collectorRows" :key="idx">
                                        <td>{{ row.displayName ?? '—' }}</td>
                                        <td>{{ row.paymentCount ?? 0 }}</td>
                                        <td>{{ formatMoney(row.totalAmount) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </template>
                        <div v-else class="rpt-empty rpt-empty--compact">
                            <p>Vista detallada no disponible para este tipo de reporte.</p>
                        </div>
                    </div>
                    <div class="rpt-dialog__footer">
                        <button v-if="isCollectorReport && collectorRows.length" class="rpt-btn" @click="exportDetailExcel">
                            <i class="pi pi-download"></i> Exportar Excel
                        </button>
                        <button class="rpt-btn rpt-btn--primary" @click="showDetail = false">Cerrar</button>
                    </div>
                </div>
            </div>
        </Teleport>

        </module-state-feedback>
    </div>
</template>

<style scoped>
.rpt-layout { display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; }

/* ── Toolbar ────────────────────────────────────────────── */
.rpt-toolbar {
    display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;
    background: #fff; padding: 0.85rem 1rem; border-radius: 12px;
    border: 1px solid #e5e7eb;
}
.rpt-toolbar__search { flex: 1; min-width: 200px; }
.rpt-search-input {
    width: 100%; padding: 0.55rem 0.75rem 0.55rem 2.25rem;
    border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.85rem;
    outline: none; transition: border-color 0.15s;
}
.rpt-search-input:focus { border-color: #6366f1; }
.rpt-search-clear {
    position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 0.75rem;
}

.rpt-type-select {
    min-width: 220px;
    flex-shrink: 0;
}

/* ── Buttons ────────────────────────────────────────────── */
.rpt-btn {
    padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.82rem;
    font-weight: 600; border: 1px solid #e5e7eb; background: #fff;
    cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
    color: #374151; transition: all 0.15s;
}
.rpt-btn:hover { background: #f9fafb; }
.rpt-btn--primary { background: #6366f1; color: #fff; border-color: #6366f1; }
.rpt-btn--primary:hover { background: #4f46e5; }

/* ── Empty state ────────────────────────────────────────── */
.rpt-empty {
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
    padding: 3rem 1rem; color: #94a3b8; font-size: 0.88rem;
}

/* ── Report cards ───────────────────────────────────────── */
.rpt-list { display: flex; flex-direction: column; gap: 0.6rem; }
.rpt-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem; background: #fff; border: 1px solid #e5e7eb;
    border-radius: 12px; gap: 1rem; transition: border-color 0.15s;
    cursor: pointer;
}
.rpt-card:hover { border-color: #c7d2fe; }
.rpt-card__left { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0; }
.rpt-card__icon-wrap {
    width: 2.5rem; height: 2.5rem; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.95rem; flex-shrink: 0;
}
.rpt-card__info { min-width: 0; }
.rpt-card__title { font-size: 0.9rem; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rpt-card__meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; color: #6b7280; margin-top: 0.15rem; flex-wrap: wrap; }
.rpt-card__type { font-weight: 600; color: #6366f1; }
.rpt-card__sep { color: #d1d5db; }
.rpt-card__right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
.rpt-card__badge {
    padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.68rem;
    font-weight: 700; white-space: nowrap;
}
.rpt-card__action {
    width: 2rem; height: 2rem; border-radius: 8px; border: none;
    background: transparent; cursor: pointer; color: #94a3b8;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.rpt-card__action:hover { background: #fef2f2; color: #dc2626; }

/* ── Dialog ─────────────────────────────────────────────── */
.rpt-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
}
.rpt-dialog {
    background: #fff; border-radius: 16px; width: 100%; max-width: 460px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.rpt-dialog--wide { max-width: 720px; }
.rpt-dialog__subtitle { margin: 0.25rem 0 0; font-size: 0.78rem; color: #6b7280; }
.rpt-dialog__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.25rem 1.5rem; border-bottom: 1px solid #f3f4f6;
}
.rpt-dialog__header h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #111827; }
.rpt-dialog__close {
    background: none; border: none; cursor: pointer; color: #94a3b8;
    font-size: 0.9rem; padding: 0.25rem;
}
.rpt-dialog__close:hover { color: #374151; }
.rpt-dialog__body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.rpt-dialog__footer {
    display: flex; justify-content: flex-end; gap: 0.6rem;
    padding: 1rem 1.5rem; border-top: 1px solid #f3f4f6;
}

/* ── Form fields ────────────────────────────────────────── */
.rpt-field { display: flex; flex-direction: column; gap: 0.3rem; }
.rpt-field__label { font-size: 0.78rem; font-weight: 600; color: #374151; }
.rpt-field__input {
    padding: 0.55rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 8px;
    font-size: 0.85rem; outline: none; transition: border-color 0.15s;
}
.rpt-field__input:focus { border-color: #6366f1; }
.rpt-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

.rpt-summary-row {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem; margin-bottom: 1rem;
}
.rpt-summary-card {
    padding: 0.85rem 1rem; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb;
}
.rpt-summary-card__label { display: block; font-size: 0.72rem; color: #6b7280; font-weight: 600; }
.rpt-summary-card__value { display: block; margin-top: 0.2rem; font-size: 1.1rem; font-weight: 800; color: #111827; }

.rpt-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.rpt-table th, .rpt-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #f3f4f6; text-align: left; }
.rpt-table th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
.rpt-empty--compact { padding: 1.5rem 0; }
</style>
