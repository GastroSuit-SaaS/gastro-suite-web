<script setup>
import { computed } from 'vue'
import { TABLE_PAGE_SIZE_OPTIONS } from '../../composables/use-table-pagination.js'

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
})

const visible = computed(() => props.showWhenEmpty || props.totalItems > 0)

const sizeOptions = computed(() =>
    props.pageSizeOptions.map(n => ({ label: String(n), value: n })),
)

function goPrev() {
    if (page.value > 1) page.value--
}

function goNext() {
    if (page.value < props.totalPages) page.value++
}
</script>

<template>
    <div v-if="visible" class="gs-table-pagination">
        <span class="gs-table-pagination__info">
            {{ rangeStart }}–{{ rangeEnd }} de {{ totalItems }} {{ itemLabel }}
        </span>
        <div class="gs-table-pagination__controls">
            <label class="gs-table-pagination__size">
                <span class="gs-table-pagination__size-label">Mostrar</span>
                <pv-select
                    v-model="pageSize"
                    :options="sizeOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    class="gs-table-pagination__select"
                />
            </label>
            <button
                type="button"
                class="gs-table-pagination__btn"
                :disabled="page <= 1"
                aria-label="Página anterior"
                @click="goPrev"
            >
                <i class="pi pi-chevron-left" />
            </button>
            <span class="gs-table-pagination__page">{{ page }} / {{ totalPages }}</span>
            <button
                type="button"
                class="gs-table-pagination__btn"
                :disabled="page >= totalPages"
                aria-label="Página siguiente"
                @click="goNext"
            >
                <i class="pi pi-chevron-right" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.gs-table-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.gs-table-pagination__info {
    font-size: 0.82rem;
    color: #6b7280;
}

.gs-table-pagination__controls {
    display: flex;
    align-items: center;
    gap: 0.45rem;
}

.gs-table-pagination__size {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-right: 0.25rem;
}

.gs-table-pagination__size-label {
    font-size: 0.78rem;
    color: #6b7280;
    white-space: nowrap;
}

.gs-table-pagination__select {
    min-width: 4.5rem;
}

.gs-table-pagination__page {
    font-size: 0.82rem;
    font-weight: 600;
    color: #374151;
    min-width: 3.5rem;
    text-align: center;
}

.gs-table-pagination__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    color: #374151;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
}

.gs-table-pagination__btn:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #d1d5db;
}

.gs-table-pagination__btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
</style>
