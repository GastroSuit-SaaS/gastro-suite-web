<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import { FilterMatchMode } from '@primevue/core'
import { useConfirm } from 'primevue/useconfirm'
import { exportTableToExcel } from '../../infrastructure/export/excel-export.js'
import {
  readDefaultTablePageSize,
  TABLE_PAGE_SIZE_OPTIONS,
  useTablePagination,
} from '../composables/use-table-pagination.js'
import TablePaginationBar from './table-pagination-bar.vue'
import ModuleEmptyState from './module-empty-state.vue'

const props = defineProps({
  items: { type: Array, required: true },
  title: { type: Object, required: true },
  dynamic: { type: Boolean, default: false },
  columns: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  dataKey: { type: String, default: 'id' },

  searchPlaceholder: { type: String, default: 'Buscar…' },
  filteredItems: { type: Array, default: null },
  globalFilterValue: { type: String, default: '' },

  showActions: { type: Boolean, default: true },
  showSelection: { type: Boolean, default: true },
  showExport: { type: Boolean, default: true },
  showNew: { type: Boolean, default: true },
  showDelete: { type: Boolean, default: true },
  showActionButtons: { type: Boolean, default: true },
  inlineToolbar: { type: Boolean, default: false },
  showToolbar: { type: Boolean, default: true },

  rows: { type: Number, default: () => readDefaultTablePageSize(10) },
  rowsPerPageOptions: { type: Array, default: () => TABLE_PAGE_SIZE_OPTIONS },
  itemLabel: { type: String, default: '' },

  newButtonLabel: { type: String, default: 'Agregar' },
  newButtonDisabled: { type: Boolean, default: false },
  newButtonTooltip: { type: String, default: '' },
  deleteButtonLabel: { type: String, default: 'Eliminar' },
  exportButtonLabel: { type: String, default: 'Exportar Excel' },

  showViewAction: { type: Boolean, default: true },
  showEditAction: { type: Boolean, default: false },
  showDeleteAction: { type: Boolean, default: false },
  editButtonLabel: { type: String, default: 'Editar' },
  deleteActionLabel: { type: String, default: 'Eliminar' },
  viewButtonLabel: { type: String, default: 'Ver detalles' },
  viewActionIconOnly: { type: Boolean, default: false },

  emptyIcon: { type: String, default: 'pi-inbox' },
  emptyTitle: { type: String, default: 'No se encontraron registros' },
  emptySubtitle: { type: String, default: '' },

  /** module = integrado en pestañas; card = contenedor con sombra */
  layout: {
    type: String,
    default: 'module',
    validator: (v) => ['module', 'card'].includes(v),
  },
  /** Función (data) => string | object — clases por fila (ej. inactivo, clickable) */
  rowClass: { type: Function, default: null },
  /** false = nunca abrir detalle al click en fila; null = auto según listeners del padre */
  openDetailOnRowClick: { type: Boolean, default: null },
})

const instance = getCurrentInstance()

const emit = defineEmits([
  'new-item-requested-manager',
  'delete-selected-items-requested-manager',
  'view-item-requested-manager',
  'edit-item-requested-manager',
  'delete-item-requested-manager',
  'global-filter-change',
  'clear-filters',
  'row-select',
  'row-unselect',
  'row-click',
])

const confirm = useConfirm()

const selectedItems = ref([])
const filters = ref(null)
const internalGlobalFilterValue = ref('')
const dt = ref(null)
const sortField = ref(null)
const sortOrder = ref(1)

const displayItems = computed(() => props.filteredItems ?? props.items)

const sortedItems = computed(() => {
  const list = [...(displayItems.value ?? [])]
  if (!sortField.value) return list

  const field = sortField.value
  const dir = sortOrder.value ?? 1

  return list.sort((a, b) => {
    const av = a?.[field]
    const bv = b?.[field]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv), 'es', { sensitivity: 'base' }) * dir
  })
})

const {
  page,
  pageSize,
  totalPages,
  paginatedItems,
  rangeStart,
  rangeEnd,
  totalItems,
} = useTablePagination(sortedItems, {
  pageSizeOptions: props.rowsPerPageOptions,
  initialPageSize: props.rows,
})

const paginationLabel = computed(() => props.itemLabel || props.title?.plural || 'registros')

const showInlineNew = computed(() =>
  props.inlineToolbar && props.showActionButtons && props.showNew,
)

const showInlineExport = computed(() =>
  props.inlineToolbar && props.showActionButtons && props.showExport,
)

const showStandaloneActionBar = computed(() => {
  if (!props.showActionButtons) return false
  const hasDelete = props.showDelete && props.showSelection
  if (props.inlineToolbar) {
    return hasDelete || (!props.showNew && props.showExport)
  }
  return props.showNew || hasDelete || props.showExport
})

const showTable = computed(() =>
  props.loading || totalItems.value > 0,
)

const showEmpty = computed(() =>
  !props.loading && totalItems.value === 0,
)

const currentGlobalFilterValue = computed({
  get: () => props.globalFilterValue ?? internalGlobalFilterValue.value,
  set: (value) => {
    internalGlobalFilterValue.value = value || ''
    emit('global-filter-change', value || '')
  },
})

const initFilters = () => {
  filters.value = { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
}

const onGlobalFilterChange = () => {
  if (!props.filteredItems) {
    filters.value.global.value = currentGlobalFilterValue.value || null
  }
}

const clearFilters = () => {
  internalGlobalFilterValue.value = ''
  currentGlobalFilterValue.value = ''
  initFilters()
  emit('clear-filters')
  emit('global-filter-change', '')
}

const newItem = () => emit('new-item-requested-manager')

const confirmDeleteSelected = () => {
  const count = selectedItems.value.length
  confirm.require({
    message: `¿Está seguro de que desea eliminar ${count} ${count === 1 ? props.title.singular : props.title.plural}?`,
    header: 'Confirmación',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Eliminar', severity: 'danger' },
    accept: () => emit('delete-selected-items-requested-manager', selectedItems.value),
    reject: () => {},
  })
}

const confirmDeleteItem = (item) => {
  const itemIdentifier = item.fullName || item.firstName || item.guestName || item.id || ''

  confirm.require({
    message: `¿Está seguro de eliminar ${itemIdentifier ? `"${itemIdentifier}"` : `esta ${props.title.singular}`}?`,
    header: 'Confirmación',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Eliminar', severity: 'danger' },
    accept: () => emit('delete-item-requested-manager', item),
    reject: () => {},
  })
}

const exportToExcel = () => {
  const rows = displayItems.value ?? []
  const exportColumns = props.columns
    .filter(col => col.field && col.exportable !== false && col.field !== 'actions')
    .map(col => ({
      header: col.header || col.field,
      field: col.field,
      exportValue: col.exportValue,
    }))

  if (!exportColumns.length || !rows.length) return

  const plural = props.title?.plural || 'datos'
  const date = new Date().toISOString().slice(0, 10)
  exportTableToExcel({
    filename: `${plural}_${date}`,
    sheetName: plural.slice(0, 31),
    columns: exportColumns,
    rows,
  })
}

const onRowSelect = (event) => emit('row-select', event)
const onRowUnselect = (event) => emit('row-unselect', event)

function hasParentListener(eventName) {
  const vnodeProps = instance?.vnode?.props ?? {}
  return typeof vnodeProps[`on${eventName}`] === 'function'
}

const hasViewDetailListener = computed(() => hasParentListener('ViewItemRequestedManager'))
const hasRowClickListener = computed(() => hasParentListener('RowClick'))

const rowOpensDetail = computed(() => {
  if (props.openDetailOnRowClick === false) return false
  return hasViewDetailListener.value || hasRowClickListener.value
})

function mergedRowClass(data) {
  const fromParent = props.rowClass?.(data)
  if (!rowOpensDetail.value) return fromParent ?? undefined

  if (props.rowClass) return fromParent ?? undefined

  return 'gs-row--clickable'
}

function onRowClick(event) {
  const data = event?.data
  if (!data || props.openDetailOnRowClick === false) return

  if (hasViewDetailListener.value) {
    emit('view-item-requested-manager', data)
  } else if (hasRowClickListener.value) {
    emit('row-click', data)
  }
}

function onSort(event) {
  sortField.value = event.sortField ?? null
  sortOrder.value = event.sortOrder ?? 1
}

watch(() => props.rows, (size) => {
  pageSize.value = size
})

onMounted(() => initFilters())
</script>

<template>
  <div
    :class="[
      'gs-data-manager',
      layout === 'card' ? 'gs-data-manager--card' : 'gs-data-manager--module',
      'flex flex-column h-full min-h-0',
    ]"
  >
    <div v-if="showToolbar" class="gs-data-manager__toolbar flex align-items-center gap-2 flex-wrap">
      <div class="search-wrapper gs-data-manager__search flex-1">
        <i class="pi pi-search search-wrapper__icon" />
        <pv-input-text
          v-model="currentGlobalFilterValue"
          :placeholder="searchPlaceholder"
          class="w-full search-wrapper__input"
          @input="onGlobalFilterChange"
        />
      </div>

      <slot name="filters" :clear-filters="clearFilters" />

      <div
        v-if="inlineToolbar && (showInlineNew || showInlineExport)"
        class="gs-data-manager__toolbar-actions flex gap-2 align-items-center flex-shrink-0"
      >
        <pv-button
          v-if="showInlineNew"
          icon="pi pi-plus"
          :label="newButtonLabel"
          severity="success"
          size="small"
          :disabled="newButtonDisabled"
          v-tooltip.top="newButtonDisabled && newButtonTooltip ? newButtonTooltip : undefined"
          @click="newItem"
        />
        <pv-button
          v-if="showInlineExport"
          icon="pi pi-file-excel"
          :label="exportButtonLabel"
          severity="secondary"
          outlined
          size="small"
          :disabled="!displayItems?.length"
          @click="exportToExcel"
        />
      </div>
    </div>

    <div v-if="showStandaloneActionBar" class="gs-data-manager__actions flex flex-wrap gap-2">
      <pv-button
        v-if="showNew && !inlineToolbar"
        icon="pi pi-plus"
        :label="newButtonLabel"
        severity="success"
        size="small"
        :disabled="newButtonDisabled"
        v-tooltip.top="newButtonDisabled && newButtonTooltip ? newButtonTooltip : undefined"
        @click="newItem"
      />
      <pv-button
        v-if="showDelete && showSelection"
        :disabled="!selectedItems?.length"
        icon="pi pi-trash"
        :label="deleteButtonLabel"
        severity="danger"
        size="small"
        outlined
        @click="confirmDeleteSelected"
      />
      <pv-button
        v-if="showExport && !inlineToolbar"
        icon="pi pi-file-excel"
        :label="exportButtonLabel"
        severity="secondary"
        outlined
        size="small"
        :disabled="!displayItems?.length"
        @click="exportToExcel"
      />
    </div>

    <module-empty-state
      v-if="showEmpty"
      :icon="emptyIcon"
      :title="emptyTitle"
      :subtitle="emptySubtitle"
      variant="plain"
    >
      <slot name="empty-actions" />
    </module-empty-state>

    <template v-else-if="showTable">
      <div class="gs-data-manager__table-wrap flex-1 min-h-0 flex flex-column">
        <pv-data-table
          ref="dt"
          v-model:selection="selectedItems"
          :value="paginatedItems"
          :filters="filteredItems ? null : filters"
          :loading="loading"
          :paginator="false"
          :data-key="dataKey"
          scrollable
          scroll-height="flex"
          :global-filter-fields="filteredItems ? [] : columns.map(col => col.field)"
          class="gs-data-manager__table"
          :row-class="mergedRowClass"
          @row-select="onRowSelect"
          @row-unselect="onRowUnselect"
          @row-click="onRowClick"
          @sort="onSort"
        >
          <pv-column
            v-if="showSelection"
            :exportable="false"
            selection-mode="multiple"
            header-style="width: 3rem"
          />

          <slot name="custom-columns-manager" />

          <pv-column
            v-if="dynamic"
            v-for="column in columns"
            :key="column.field"
            :field="column.field"
            :header="column.header"
            :sortable="false"
            :style="column.style || 'min-width: 120px'"
            :header-style="column.headerStyle || 'text-align: left'"
            :body-style="column.bodyStyle || 'text-align: left'"
          >
            <template v-if="column.template" #body="slotProps">
              <slot
                :name="column.template"
                :data="slotProps.data"
                :value="slotProps.data[column.field]"
              />
            </template>
          </pv-column>

          <pv-column
            v-if="showActions"
            :exportable="false"
            header=""
            header-style="width: 7rem; text-align: right"
            body-style="text-align: right"
          >
            <template #body="slotProps">
              <div class="gs-data-manager__row-actions">
                <button
                  v-if="showViewAction && viewActionIconOnly"
                  type="button"
                  class="dm-action-btn dm-action-btn--view"
                  :title="viewButtonLabel"
                  @click.stop="emit('view-item-requested-manager', slotProps.data)"
                >
                  <i class="pi pi-eye" />
                </button>
                <pv-button
                  v-if="showViewAction && !viewActionIconOnly"
                  :label="viewButtonLabel"
                  link
                  size="small"
                  @click.stop="emit('view-item-requested-manager', slotProps.data)"
                />
                <button
                  v-if="showEditAction"
                  type="button"
                  class="dm-action-btn dm-action-btn--edit"
                  :title="editButtonLabel"
                  @click.stop="emit('edit-item-requested-manager', slotProps.data)"
                >
                  <i class="pi pi-pencil" />
                </button>
                <button
                  v-if="showDeleteAction"
                  type="button"
                  class="dm-action-btn dm-action-btn--delete"
                  :title="deleteActionLabel"
                  @click.stop="confirmDeleteItem(slotProps.data)"
                >
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </pv-column>

          <template #loading>
            <div class="gs-data-manager__loading">
              <pv-progress-spinner style="width:2.5rem;height:2.5rem" stroke-width="3" />
              <span>Cargando datos…</span>
            </div>
          </template>
        </pv-data-table>

        <table-pagination-bar
          v-model:page="page"
          v-model:page-size="pageSize"
          :total-pages="totalPages"
          :range-start="rangeStart"
          :range-end="rangeEnd"
          :total-items="totalItems"
          :item-label="paginationLabel"
          :page-size-options="rowsPerPageOptions"
          class="gs-data-manager__pagination"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.gs-data-manager--module {
  gap: 0.75rem;
}

.gs-data-manager--card {
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.gs-data-manager__toolbar {
  width: 100%;
}

.gs-data-manager__search {
  min-width: 12rem;
}

.gs-data-manager__toolbar-actions {
  margin-left: auto;
}

.gs-data-manager__table-wrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.gs-data-manager__pagination {
  flex-shrink: 0;
  border-radius: 0 0 12px 12px;
}

.gs-data-manager__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.85rem;
}

.gs-data-manager__row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.gs-data-manager__table .gs-row--clickable {
  cursor: pointer;
}

.gs-data-manager__table .user-row--clickable {
  cursor: pointer;
}

.gs-data-manager__table .user-row--inactive {
  opacity: 0.55;
}

.gs-data-manager__table .user-row--inactive:hover {
  opacity: 0.75;
}

.gs-data-manager__table .pay-row--clickable {
  cursor: pointer;
}

.gs-data-manager__table .inv-row--clickable {
  cursor: pointer;
}

@media (max-width: 768px) {
  .gs-data-manager__toolbar-actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>

<style>
/* Acciones de fila — sin scoped para que apliquen a slots de módulos */
.gs-data-manager .dm-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  padding: 0.25rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
  transition: color 0.12s, background 0.12s;
}

.gs-data-manager .dm-action-btn .pi {
  font-size: 0.85rem;
}

/* Ver detalle — índigo */
.gs-data-manager .dm-action-btn--view {
  color: #4f46e5;
}

.gs-data-manager .dm-action-btn--view:hover {
  color: #4338ca;
  background: rgba(79, 70, 229, 0.1);
}

/* Editar — ámbar */
.gs-data-manager .dm-action-btn--edit {
  color: #d97706;
}

.gs-data-manager .dm-action-btn--edit:hover {
  color: #b45309;
  background: rgba(217, 119, 6, 0.12);
}

/* Eliminar — rojo */
.gs-data-manager .dm-action-btn--delete {
  color: #dc2626;
}

.gs-data-manager .dm-action-btn--delete:hover {
  color: #b91c1c;
  background: rgba(220, 38, 38, 0.1);
}

.gs-data-manager .dm-action-btn--power-on {
  color: #16a34a;
}

.gs-data-manager .dm-action-btn--power-on:hover {
  color: #15803d;
}

.gs-data-manager .dm-action-btn--power-off {
  color: #9ca3af;
}

.gs-data-manager .dm-action-btn--power-off:hover {
  color: #16a34a;
}

/* PrimeVue DataTable — tema claro de módulos; anula tokens oscuros de primevue-overrides */
.gs-data-manager__table.p-datatable,
.gs-data-manager__table.p-datatable .p-datatable-table-container,
.gs-data-manager__table.p-datatable .p-datatable-scrollable,
.gs-data-manager__table.p-datatable .p-datatable-scrollable-body,
.gs-data-manager__table.p-datatable .p-datatable-wrapper {
  background: #fff !important;
  color: #374151;
}

.gs-data-manager__table.p-datatable {
  font-size: 0.83rem;
  border-radius: 0;
  overflow: hidden;
}

.gs-data-manager__table .p-datatable-table {
  border-collapse: collapse;
}

.gs-data-manager__table .p-datatable-thead > tr > th {
  background: #f9fafb !important;
  border-bottom: 2px solid #e5e7eb !important;
  border-top: none !important;
  padding: 0.7rem 0.85rem !important;
  font-size: 0.73rem !important;
  font-weight: 600 !important;
  color: #6b7280 !important;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.gs-data-manager__table .p-datatable-column-header-content {
  color: #6b7280 !important;
  gap: 0.35rem;
}

.gs-data-manager__table .p-datatable-sort-icon,
.gs-data-manager__table .p-sortable-column-icon,
.gs-data-manager__table .p-datatable-column-sort-icon {
  display: none !important;
}

.gs-data-manager__table .p-datatable-thead > tr > th.p-datatable-column-sorted,
.gs-data-manager__table .p-datatable-thead > tr > th.p-datatable-sortable-column:hover {
  background: #f9fafb !important;
  color: #6b7280 !important;
  cursor: default;
}

.gs-data-manager__table .p-datatable-tbody > tr {
  background: #fff !important;
  color: #374151 !important;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}

.gs-data-manager__table .p-datatable-tbody > tr:hover {
  background: #fafafe !important;
}

.gs-data-manager__table .p-datatable-tbody > tr > td {
  padding: 0.7rem 0.85rem !important;
  color: #374151 !important;
  vertical-align: middle;
  border: none !important;
  background: transparent !important;
}

.gs-data-manager__table .p-datatable-tbody > tr.p-datatable-row-selected,
.gs-data-manager__table .p-datatable-tbody > tr.p-highlight {
  background: #eef2ff !important;
}

.gs-data-manager__table .p-datatable-loading-overlay {
  background: rgba(255, 255, 255, 0.72) !important;
}

.gs-data-manager__table .p-datatable-mask {
  background: rgba(255, 255, 255, 0.65) !important;
}

.gs-data-manager__table .p-checkbox .p-checkbox-box {
  border-color: #d1d5db;
  background: #fff;
}

.gs-data-manager__table .p-checkbox.p-highlight .p-checkbox-box {
  background: #2563eb;
  border-color: #2563eb;
}
</style>
