<script setup>
import { computed } from 'vue'
import {
    TABLE_PAGE_SIZE_OPTIONS,
    TABLE_PAGINATOR_TEMPLATE,
} from '../composables/use-table-pagination.js'

const page = defineModel('page', { type: Number, default: 1 })
const pageSize = defineModel('pageSize', { type: Number, default: 10 })

const props = defineProps({
    totalPages: { type: Number, default: 1 },
    rangeStart: { type: Number, default: 0 },
    rangeEnd: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    itemLabel: { type: String, default: 'registros' },
    pageSizeOptions: { type: Array, default: () => TABLE_PAGE_SIZE_OPTIONS },
    showWhenEmpty: { type: Boolean, default: false },
    maxPageLinks: { type: Number, default: 5 },
})

const visible = computed(() => props.showWhenEmpty || props.totalItems > 0)

const first = computed({
    get: () => Math.max(0, (page.value - 1) * pageSize.value),
    set: (value) => {
        page.value = Math.max(1, Math.floor(value / pageSize.value) + 1)
    },
})

const reportTemplate = computed(
    () => `Mostrando {first} - {last} de {totalRecords} ${props.itemLabel}`,
)

function onPage(event) {
    page.value = event.page + 1
    pageSize.value = event.rows
}
</script>

<template>
    <pv-paginator
        v-if="visible"
        v-model:first="first"
        v-model:rows="pageSize"
        :total-records="totalItems"
        :template="TABLE_PAGINATOR_TEMPLATE"
        :current-page-report-template="reportTemplate"
        :rows-per-page-options="pageSizeOptions"
        :page-link-size="maxPageLinks"
        class="gs-table-pagination"
        @page="onPage"
    />
</template>

<style scoped>
.gs-table-pagination {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
    padding: 0.35rem 0.75rem;
    border-radius: 0;
    min-height: 0;
}

.gs-table-pagination :deep(.p-paginator) {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    padding: 0;
    background: transparent;
    border: none;
    width: 100%;
}

.gs-table-pagination :deep(.p-paginator-content) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 1rem;
}

.gs-table-pagination :deep(.p-paginator-first),
.gs-table-pagination :deep(.p-paginator-prev),
.gs-table-pagination :deep(.p-paginator-next),
.gs-table-pagination :deep(.p-paginator-last) {
    min-width: 1.5rem;
    height: 1.5rem;
    color: #6b7280;
    background: transparent;
    border: none;
    border-radius: 4px;
}

.gs-table-pagination :deep(.p-paginator-first:not(:disabled):hover),
.gs-table-pagination :deep(.p-paginator-prev:not(:disabled):hover),
.gs-table-pagination :deep(.p-paginator-next:not(:disabled):hover),
.gs-table-pagination :deep(.p-paginator-last:not(:disabled):hover) {
    color: #374151;
    background: #f3f4f6;
}

.gs-table-pagination :deep(.p-paginator-first:disabled),
.gs-table-pagination :deep(.p-paginator-prev:disabled),
.gs-table-pagination :deep(.p-paginator-next:disabled),
.gs-table-pagination :deep(.p-paginator-last:disabled) {
    opacity: 0.35;
}

.gs-table-pagination :deep(.p-paginator-pages) {
    gap: 0.1rem;
}

.gs-table-pagination :deep(.p-paginator-page) {
    min-width: 1.5rem;
    height: 1.5rem;
    margin: 0;
    padding: 0 0.15rem;
    color: #6b7280;
    font-size: 0.8rem;
    font-weight: 500;
    background: transparent !important;
    border: none;
    border-radius: 4px;
    box-shadow: none !important;
}

.gs-table-pagination :deep(.p-paginator-page:not(.p-paginator-page-selected):hover) {
    color: #374151;
    background: #f3f4f6 !important;
}

.gs-table-pagination :deep(.p-paginator-page-selected),
.gs-table-pagination :deep(.p-paginator-page.p-highlight) {
    color: #111827;
    font-weight: 600;
    background: transparent !important;
    box-shadow: none !important;
}

.gs-table-pagination :deep(.p-paginator-current) {
    font-size: 0.8rem;
    color: #9ca3af;
    white-space: nowrap;
}

.gs-table-pagination :deep(.p-paginator-rpp-dropdown) {
    min-width: 4rem;
}

.gs-table-pagination :deep(.p-paginator-rpp-dropdown .p-select),
.gs-table-pagination :deep(.p-paginator-rpp-dropdown .p-dropdown) {
    border-radius: 6px;
    border-color: #e5e7eb;
    background: #fff;
}

.gs-table-pagination :deep(.p-paginator-rpp-dropdown .p-select-label),
.gs-table-pagination :deep(.p-paginator-rpp-dropdown .p-dropdown-label) {
    padding: 0.2rem 0.45rem;
    font-size: 0.8rem;
    color: #374151;
}
</style>
