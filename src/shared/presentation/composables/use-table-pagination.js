import { ref, computed, watch } from 'vue'

export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const TABLE_PAGINATOR_TEMPLATE =
    'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
export const TABLE_CURRENT_PAGE_REPORT = 'Mostrando {first} - {last} de {totalRecords} registros'
const STORAGE_KEY = 'gs.tablePageSize'

/** Ajusta un tamaño de página al valor permitido más cercano (≥ preferido). */
export function normalizeTablePageSize(size, options = TABLE_PAGE_SIZE_OPTIONS) {
    const n = Number(size)
    if (!Number.isFinite(n) || n <= 0) return options[0] ?? 10
    if (options.includes(n)) return n
    const next = options.find((o) => o >= n)
    return next ?? options[options.length - 1] ?? n
}

export function readDefaultTablePageSize(fallback = 10) {
    try {
        const n = parseInt(localStorage.getItem(STORAGE_KEY), 10)
        return TABLE_PAGE_SIZE_OPTIONS.includes(n) ? n : fallback
    } catch {
        return fallback
    }
}

function persistTablePageSize(size) {
    try {
        localStorage.setItem(STORAGE_KEY, String(size))
    } catch { /* ok */ }
}

export { persistTablePageSize }

/** Filas por página para PrimeVue DataTable con preferencia persistida. */
export function usePrimeTableRows(fallback = 10) {
    const rows = ref(readDefaultTablePageSize(fallback))
    watch(rows, persistTablePageSize)
    return {
        rows,
        rowsPerPageOptions: TABLE_PAGE_SIZE_OPTIONS,
        paginatorTemplate: TABLE_PAGINATOR_TEMPLATE,
        currentPageReportTemplate: TABLE_CURRENT_PAGE_REPORT,
    }
}

/**
 * Paginación client-side para tablas custom (no Prime DataTable).
 * @param {import('vue').Ref|import('vue').ComputedRef} itemsSource
 * @param {{ pageSizeOptions?: number[], initialPageSize?: number, persistPageSize?: boolean }} [options]
 */
export function useTablePagination(itemsSource, options = {}) {
    const pageSizeOptions = options.pageSizeOptions ?? TABLE_PAGE_SIZE_OPTIONS
    const persistPageSize = options.persistPageSize !== false
    const page = ref(1)
    const pageSize = ref(
        normalizeTablePageSize(
            options.initialPageSize ?? readDefaultTablePageSize(pageSizeOptions[0] ?? 10),
            pageSizeOptions,
        ),
    )

    const totalItems = computed(() => (itemsSource.value ?? []).length)
    const totalPages = computed(() =>
        Math.max(1, Math.ceil(totalItems.value / pageSize.value)),
    )
    const paginatedItems = computed(() => {
        const list = itemsSource.value ?? []
        if (!list.length) return []
        const start = (page.value - 1) * pageSize.value
        return list.slice(start, start + pageSize.value)
    })
    const rangeStart = computed(() =>
        totalItems.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1,
    )
    const rangeEnd = computed(() =>
        Math.min(page.value * pageSize.value, totalItems.value),
    )

    watch(itemsSource, () => {
        page.value = 1
    })

    watch(pageSize, (size) => {
        page.value = 1
        if (persistPageSize) persistTablePageSize(size)
    })

    watch(totalItems, () => {
        if (page.value > totalPages.value) {
            page.value = totalPages.value
        }
    })

    function resetPage() {
        page.value = 1
    }

    return {
        page,
        pageSize,
        pageSizeOptions,
        totalItems,
        totalPages,
        paginatedItems,
        rangeStart,
        rangeEnd,
        resetPage,
    }
}
