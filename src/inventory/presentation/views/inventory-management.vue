<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '../../application/inventory.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from '../constants/inventory.constants-ui.js'
import CreateAndEditProduct           from './create-and-edit-product.vue'
import CreateAndEditInventoryCategory from './create-and-edit-inventory-category.vue'
import RegisterStockMovement          from './register-stock-movement.vue'
import ModuleStateFeedback            from '../../../shared/presentation/components/module-state-feedback.vue'
import ModuleTabBar                   from '../../../shared/presentation/components/module-tab-bar.vue'
import ModuleTab                      from '../../../shared/presentation/components/module-tab.vue'
import { useNotification } from '../../../shared/composables/use-notification.js'
import { INVENTORY_MESSAGES } from '../constants/inventory.constants-ui.js'

const store = useInventoryStore()
const { showSuccess, showError } = useNotification()
const { confirmDelete } = useConfirmDialog()

onMounted(() => store.fetchAll())

// ── Tab ──────────────────────────────────────────────────
const activeTab = ref('products')

const PAGE_SIZE = 10

// ── Products state ───────────────────────────────────────
const showDialog   = ref(false)
const editingItem  = ref(null)
const selectedStatus = ref(null)
const productPage  = ref(1)

const productTotalPages = computed(() => Math.max(1, Math.ceil(store.filteredProducts.length / PAGE_SIZE)))
const paginatedProducts = computed(() => {
    const start = (productPage.value - 1) * PAGE_SIZE
    return store.filteredProducts.slice(start, start + PAGE_SIZE)
})

const categoryFilterOptions = computed(() => store.categorySelectOptions)

const canCreateProduct = computed(() => store.categorySelectOptions.length > 0)

/** Overlays al body para quedar sobre tabs sticky */
import { OVERLAY_APPEND_TARGET as OVERLAY_TARGET } from '../../../shared/presentation/constants/overlay.constants-ui.js'

function toggleStatus(status) {
    selectedStatus.value = selectedStatus.value === status ? null : status
    store.filterStatus = selectedStatus.value
    productPage.value = 1
}

function clearStatus() {
    selectedStatus.value = null
    store.filterStatus = null
    productPage.value = 1
}

function openCreate() {
    editingItem.value = null
    showDialog.value = true
}

function openEdit(product) {
    editingItem.value = { ...product }
    showDialog.value = true
}

function onDelete(product) {
    confirmDelete({
        target: product.name,
        accept: async () => {
            const ok = await store.remove(product.id)
            if (ok) showSuccess(INVENTORY_MESSAGES.PRODUCT_DELETED)
            else if (store.error) showError(store.error)
        },
    })
}

async function onSaved(data) {
    const ok = editingItem.value
        ? await store.update(editingItem.value.id, data)
        : await store.create(data)
    if (ok) {
        showSuccess(editingItem.value ? INVENTORY_MESSAGES.PRODUCT_UPDATED : INVENTORY_MESSAGES.PRODUCT_CREATED)
        editingItem.value = null
    } else if (store.error) {
        showError(store.error)
    }
}

function getStockStatusLabel(product) {
    return STOCK_STATUS_LABELS[product.stockStatus?.toUpperCase()] ?? product.stockStatus
}

function getStockStatusColor(product) {
    return STOCK_STATUS_COLORS[product.stockStatus?.toUpperCase()] ?? '#6b7280'
}

function formatCurrency(val) {
    return `S/ ${Number(val ?? 0).toFixed(2)}`
}

// ── Categories state ─────────────────────────────────────
const showCategoryDialog = ref(false)
const editingCategory    = ref(null)

function openCreateCategory() {
    editingCategory.value = null
    showCategoryDialog.value = true
}

function openEditCategory(cat) {
    editingCategory.value = { id: cat.id, name: cat.name, color: cat.color, description: cat.description ?? '', isActive: cat.isActive ?? true }
    showCategoryDialog.value = true
}

function onDeleteCategory(cat) {
    confirmDelete({
        target: cat.name,
        accept: async () => {
            const ok = await store.removeCategory(cat.id)
            if (ok) showSuccess(INVENTORY_MESSAGES.CATEGORY_DELETED)
            else if (store.error) showError(store.error)
        },
    })
}

async function onCategorySaved(data) {
    const ok = editingCategory.value
        ? await store.updateCategory(editingCategory.value.id, data)
        : await store.createCategory(data)
    if (ok) {
        showSuccess(editingCategory.value ? INVENTORY_MESSAGES.CATEGORY_UPDATED : INVENTORY_MESSAGES.CATEGORY_CREATED)
        editingCategory.value = null
    } else if (store.error) {
        showError(store.error)
    }
}

// ── Movements state ──────────────────────────────────────
const showMovementDialog = ref(false)
const movementPage = ref(1)

const movementTotalPages = computed(() => Math.max(1, Math.ceil(store.filteredMovements.length / PAGE_SIZE)))
const paginatedMovements = computed(() => {
    const start = (movementPage.value - 1) * PAGE_SIZE
    return store.filteredMovements.slice(start, start + PAGE_SIZE)
})

const MOVEMENT_TYPE_LABELS = {
    purchase:   'Compra',
    usage:      'Uso cocina',
    waste:      'Merma',
    adjustment: 'Ajuste',
    transfer:   'Transferencia',
    return:     'Devolución',
}

const MOVEMENT_TYPE_COLORS = {
    purchase:   '#059669',
    usage:      '#6366f1',
    waste:      '#dc2626',
    adjustment: '#f59e0b',
    transfer:   '#06b6d4',
    return:     '#8b5cf6',
}

const movementTypeFilterOptions = [
    { label: 'Compra',        value: 'purchase'   },
    { label: 'Uso cocina',    value: 'usage'      },
    { label: 'Merma',         value: 'waste'      },
    { label: 'Ajuste',        value: 'adjustment' },
    { label: 'Transferencia', value: 'transfer'   },
    { label: 'Devolución',    value: 'return'     },
]

const movementDirFilterOptions = [
    { label: 'Entradas', value: 'in'  },
    { label: 'Salidas',  value: 'out' },
]

function openRegisterMovement() {
    showMovementDialog.value = true
}

async function onMovementSaved(data) {
    const ok = await store.registerMovement(data)
    if (ok) {
        showSuccess(INVENTORY_MESSAGES.MOVEMENT_REGISTERED)
    } else if (store.error) {
        showError(store.error)
    }
}

function formatDate(d) {
    if (!d) return '—'
    const dt = new Date(d)
    return dt.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <div class="inv-layout module-page">

    <module-state-feedback
        :loading="store.isLoading"
        :error="store.error"
        loading-label="Cargando inventario..."
        @retry="store.fetchAll()"
    >
        <div class="inv-shell">

        <!-- ══ Tab navigation ═════════════════════════════════════════════ -->
        <module-tab-bar v-model="activeTab" sticky aria-label="Inventario">
            <module-tab value="products" icon="pi-box">
                Productos
            </module-tab>
            <module-tab value="categories" icon="pi-tag">
                Categorías
            </module-tab>
            <module-tab value="movements" icon="pi-arrow-right-arrow-left">
                Movimientos
            </module-tab>
        </module-tab-bar>

        <!-- ══════════════════ TAB: PRODUCTOS ════════════════════════════ -->
        <div v-if="activeTab === 'products'" class="inv-tab-body">
        <div class="inv-home">

            <!-- ── Resumen compacto (chips, como Mesas) ─────────────── -->
            <div class="stat-row">
                <button type="button" class="stat-chip stat-chip--btn" @click="clearStatus">
                    <span class="stat-chip__label">Total productos</span>
                    <span class="stat-chip__value">{{ store.totalProducts }}</span>
                    <span class="stat-chip__sub">{{ formatCurrency(store.totalStockValue) }}</span>
                </button>
                <button
                    type="button"
                    :class="['stat-chip', 'stat-chip--btn', selectedStatus === 'in_stock' && 'stat-chip--active-green']"
                    @click="toggleStatus('in_stock')"
                >
                    <span class="stat-chip__dot" style="background:#059669"></span>
                    <span class="stat-chip__label">En stock</span>
                    <span class="stat-chip__value stat-chip__value--success">{{ store.inStockProducts.length }}</span>
                </button>
                <button
                    type="button"
                    :class="['stat-chip', 'stat-chip--btn', selectedStatus === 'low_stock' && 'stat-chip--active-orange']"
                    @click="toggleStatus('low_stock')"
                >
                    <span class="stat-chip__dot" style="background:#f59e0b"></span>
                    <span class="stat-chip__label">Stock bajo</span>
                    <span class="stat-chip__value stat-chip__value--warning">{{ store.lowStockProducts.length }}</span>
                </button>
                <button
                    type="button"
                    :class="['stat-chip', 'stat-chip--btn', selectedStatus === 'out_of_stock' && 'stat-chip--active-red']"
                    @click="toggleStatus('out_of_stock')"
                >
                    <span class="stat-chip__dot" style="background:#dc2626"></span>
                    <span class="stat-chip__label">Sin stock</span>
                    <span class="stat-chip__value stat-chip__value--danger">{{ store.outOfStockProducts.length }}</span>
                </button>
            </div>

            <!-- ── Filtros ─────────────────────────────────────────── -->
            <div class="inv-toolbar">
                <pv-icon-field class="inv-toolbar__search">
                    <pv-input-icon class="pi pi-search" />
                    <pv-input-text
                        v-model="store.searchQuery"
                        placeholder="Buscar por nombre o SKU..."
                        class="w-full"
                        size="small"
                        @input="productPage = 1"
                    />
                </pv-icon-field>

                <pv-select
                    v-model="store.filterCategory"
                    :options="categoryFilterOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="CATEGORÍA"
                    showClear
                    :append-to="OVERLAY_TARGET"
                    size="small"
                    class="inv-toolbar__select"
                    @change="productPage = 1"
                />

                <pv-button
                    label="Nuevo producto"
                    icon="pi pi-plus"
                    size="small"
                    :disabled="!canCreateProduct"
                    v-tooltip.top="!canCreateProduct ? 'Crea al menos una categoría en la pestaña Categorías' : undefined"
                    @click="openCreate"
                />
            </div>

            <!-- ── Empty ───────────────────────────────────────────── -->
            <div v-if="store.filteredProducts.length === 0" class="inv-empty inv-panel">
                <i class="pi pi-inbox inv-empty__icon"></i>
                <span class="inv-empty__title">No se encontraron productos</span>
                <span class="inv-empty__sub">
                    {{ store.products.length === 0
                        ? 'Crea categorías y luego agrega tu primer producto de bodega.'
                        : 'Prueba otros filtros o términos de búsqueda.' }}
                </span>
                <pv-button
                    v-if="store.products.length === 0 && canCreateProduct"
                    label="Nuevo producto"
                    icon="pi pi-plus"
                    size="small"
                    @click="openCreate"
                />
                <pv-button
                    v-else-if="store.products.length === 0"
                    label="Ir a categorías"
                    icon="pi pi-tag"
                    size="small"
                    severity="secondary"
                    outlined
                    @click="activeTab = 'categories'"
                />
            </div>

            <!-- ── Tabla de productos ──────────────────────────────── -->
            <div v-else class="inv-table-wrap">
                <table class="inv-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th style="text-align:right">Costo</th>
                            <th style="text-align:right">Precio</th>
                            <th>Mín / Máx</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="p in paginatedProducts"
                            :key="p.id"
                            class="inv-row"
                            @click="openEdit(p)">
                            <td>
                                <div class="flex flex-column">
                                    <span class="font-semibold text-color">{{ p.name }}</span>
                                    <span v-if="p.description" class="text-xs text-color-secondary" style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ p.description }}</span>
                                </div>
                            </td>
                            <td class="td-sku">{{ p.sku }}</td>
                            <td>{{ p.category || '—' }}</td>
                            <td :style="{ color: getStockStatusColor(p), fontWeight: 600 }">
                                {{ p.stock }} {{ p.unit }}
                            </td>
                            <td>
                                <span class="badge"
                                      :style="{ background: getStockStatusColor(p) + '22', color: getStockStatusColor(p), border: '1px solid ' + getStockStatusColor(p) + '66' }">
                                    {{ getStockStatusLabel(p) }}
                                </span>
                            </td>
                            <td class="td-amount">{{ formatCurrency(p.cost) }}</td>
                            <td class="td-amount td-price">{{ formatCurrency(p.price) }}</td>
                            <td class="td-minmax">{{ p.minStock }} / {{ p.maxStock ?? '∞' }}</td>
                            <td class="td-actions">
                                <pv-button icon="pi pi-pencil" text rounded size="small" severity="info" @click.stop="openEdit(p)" />
                                <pv-button icon="pi pi-trash" text rounded size="small" severity="danger" @click.stop="onDelete(p)" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginación productos -->
            <div v-if="store.filteredProducts.length > PAGE_SIZE" class="inv-pagination">
                <span class="inv-pagination__info">
                    {{ (productPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(productPage * PAGE_SIZE, store.filteredProducts.length) }}
                    de {{ store.filteredProducts.length }}
                </span>
                <div class="inv-pagination__controls">
                    <button class="inv-pagination__btn" :disabled="productPage <= 1" @click="productPage--">
                        <i class="pi pi-chevron-left"></i>
                    </button>
                    <span class="inv-pagination__page">{{ productPage }} / {{ productTotalPages }}</span>
                    <button class="inv-pagination__btn" :disabled="productPage >= productTotalPages" @click="productPage++">
                        <i class="pi pi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
        </div>

        <!-- ══════════════════ TAB: CATEGORÍAS ═══════════════════════════ -->
        <div v-else-if="activeTab === 'categories'" class="inv-tab-body">
        <div class="inv-home">

            <div class="inv-toolbar inv-toolbar--split">
                <div>
                    <h2 class="inv-section-title">Categorías de inventario</h2>
                    <p class="inv-section-hint">Agrupa insumos y productos de bodega por tipo.</p>
                </div>
                <pv-button label="Nueva categoría" icon="pi pi-plus" size="small" @click="openCreateCategory" />
            </div>

            <div v-if="store.allCategories.length > 0" class="cats-grid">
                <div
                    v-for="cat in store.allCategories"
                    :key="cat.id"
                    :class="['cat-card', !cat.isActive && 'cat-card--inactive']"
                >
                    <div class="cat-card__top-bar" :style="{ background: cat.isActive ? cat.color : '#9ca3af' }"></div>
                    <div class="cat-card__body">
                        <div class="cat-card__icon-wrap" :style="{ background: cat.color + '22' }">
                            <i class="pi pi-tag" :style="{ color: cat.color }"></i>
                        </div>
                        <div class="cat-card__info">
                            <div class="cat-card__name">{{ cat.name }}</div>
                            <div class="cat-card__desc">{{ cat.description || 'Sin descripción' }}</div>
                        </div>
                        <div class="flex flex-column align-items-end gap-1">
                            <div class="cat-card__badge">{{ cat.count }} producto{{ cat.count !== 1 ? 's' : '' }}</div>
                            <span :class="['cat-card__active-badge', cat.isActive ? 'cat-card__active-badge--on' : 'cat-card__active-badge--off']">
                                {{ cat.isActive !== false ? 'Activa' : 'Inactiva' }}
                            </span>
                        </div>
                    </div>
                    <div class="cat-card__actions">
                        <button
                            :class="['mgmt-btn', 'mgmt-btn--power', cat.isActive ? 'mgmt-btn--power-on' : 'mgmt-btn--power-off']"
                            :title="cat.isActive ? 'Desactivar categoría' : 'Activar categoría'"
                            @click="store.updateCategory(cat.id, { ...cat, isActive: !cat.isActive })"
                        >
                            <i class="pi pi-power-off"></i>
                        </button>
                        <button class="mgmt-btn mgmt-btn--edit" title="Editar" @click="openEditCategory(cat)">
                            <i class="pi pi-pencil"></i>
                        </button>
                        <button class="mgmt-btn mgmt-btn--delete" title="Eliminar" @click="onDeleteCategory(cat)">
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="inv-empty inv-panel">
                <i class="pi pi-tag inv-empty__icon"></i>
                <span class="inv-empty__title">No hay categorías configuradas</span>
                <span class="inv-empty__sub">Crea categorías para organizar los productos del inventario.</span>
                <pv-button label="Nueva categoría" icon="pi pi-plus" size="small" @click="openCreateCategory" />
            </div>
        </div>
        </div>

        <!-- ══════════════════ TAB: MOVIMIENTOS ══════════════════════ -->
        <div v-else class="inv-tab-body">
        <div class="inv-home">

            <div class="stat-row">
                <div class="stat-chip">
                    <span class="stat-chip__label">Total movimientos</span>
                    <span class="stat-chip__value">{{ store.totalMovements }}</span>
                </div>
                <div class="stat-chip">
                    <span class="stat-chip__dot" style="background:#059669"></span>
                    <span class="stat-chip__label">Entradas</span>
                    <span class="stat-chip__value stat-chip__value--success">{{ store.entryMovements.length }}</span>
                </div>
                <div class="stat-chip">
                    <span class="stat-chip__dot" style="background:#dc2626"></span>
                    <span class="stat-chip__label">Salidas</span>
                    <span class="stat-chip__value stat-chip__value--danger">{{ store.exitMovements.length }}</span>
                </div>
            </div>

            <!-- Filtros movimientos -->
            <div class="inv-toolbar">
                <pv-icon-field class="inv-toolbar__search">
                    <pv-input-icon class="pi pi-search" />
                    <pv-input-text
                        v-model="store.movementSearch"
                        placeholder="Buscar producto, SKU, registrado por, nota..."
                        class="w-full"
                        size="small"
                        @input="movementPage = 1"
                    />
                </pv-icon-field>

                <pv-select
                    v-model="store.movementFilterType"
                    :options="movementTypeFilterOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="MOTIVO"
                    showClear
                    :append-to="OVERLAY_TARGET"
                    size="small"
                    class="inv-toolbar__select"
                    @change="movementPage = 1"
                />

                <pv-select
                    v-model="store.movementFilterDirection"
                    :options="movementDirFilterOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="DIRECCIÓN"
                    showClear
                    :append-to="OVERLAY_TARGET"
                    size="small"
                    class="inv-toolbar__select"
                    @change="movementPage = 1"
                />

                <pv-button label="Registrar movimiento" icon="pi pi-plus" size="small" @click="openRegisterMovement" />
            </div>

            <!-- Empty -->
            <div v-if="store.filteredMovements.length === 0" class="inv-empty inv-panel">
                <i class="pi pi-arrow-right-arrow-left inv-empty__icon"></i>
                <span class="inv-empty__title">No hay movimientos registrados</span>
                <span class="inv-empty__sub">Registra entradas y salidas para llevar el kardex de bodega.</span>
                <pv-button
                    v-if="store.products.length > 0"
                    label="Registrar movimiento"
                    icon="pi pi-plus"
                    size="small"
                    @click="openRegisterMovement"
                />
            </div>

            <!-- Tabla movimientos -->
            <div v-else class="inv-table-wrap">
                <table class="inv-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Dir.</th>
                            <th>Motivo</th>
                            <th style="text-align:right">Cantidad</th>
                            <th style="text-align:right">Stock ant.</th>
                            <th style="text-align:right">Stock nuevo</th>
                            <th>Nota</th>
                            <th>Registrado por</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="m in paginatedMovements"
                            :key="m.id"
                            class="inv-row inv-row--readonly">
                            <td class="td-date">{{ formatDate(m.createdAt) }}</td>
                            <td>
                                <div class="flex flex-column">
                                    <span class="font-semibold text-color">{{ m.productName }}</span>
                                    <span class="text-xs text-color-secondary">{{ m.productSku }}</span>
                                </div>
                            </td>
                            <td>
                                <span :class="['dir-badge', m.isEntry ? 'dir-badge--in' : 'dir-badge--out']">
                                    <i :class="['pi', m.isEntry ? 'pi-arrow-down' : 'pi-arrow-up']"></i>
                                    {{ m.isEntry ? 'Entrada' : 'Salida' }}
                                </span>
                            </td>
                            <td>
                                <span class="badge" :style="{ background: (MOVEMENT_TYPE_COLORS[m.type] ?? '#6b7280') + '18', color: MOVEMENT_TYPE_COLORS[m.type] ?? '#6b7280', border: '1px solid ' + (MOVEMENT_TYPE_COLORS[m.type] ?? '#6b7280') + '44' }">
                                    {{ MOVEMENT_TYPE_LABELS[m.type] ?? m.type }}
                                </span>
                            </td>
                            <td class="td-amount" :style="{ color: m.isEntry ? '#059669' : '#dc2626' }">
                                {{ m.isEntry ? '+' : '-' }}{{ m.quantity }}
                            </td>
                            <td class="td-amount" style="color:#6b7280">{{ m.previousStock }}</td>
                            <td class="td-amount font-bold">{{ m.newStock }}</td>
                            <td class="td-notes">{{ m.notes || '—' }}</td>
                            <td class="td-user">
                                <span class="font-medium text-color">{{ m.userName || '—' }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginación movimientos -->
            <div v-if="store.filteredMovements.length > PAGE_SIZE" class="inv-pagination">
                <span class="inv-pagination__info">
                    {{ (movementPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(movementPage * PAGE_SIZE, store.filteredMovements.length) }}
                    de {{ store.filteredMovements.length }}
                </span>
                <div class="inv-pagination__controls">
                    <button class="inv-pagination__btn" :disabled="movementPage <= 1" @click="movementPage--">
                        <i class="pi pi-chevron-left"></i>
                    </button>
                    <span class="inv-pagination__page">{{ movementPage }} / {{ movementTotalPages }}</span>
                    <button class="inv-pagination__btn" :disabled="movementPage >= movementTotalPages" @click="movementPage++">
                        <i class="pi pi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
        </div>

        </div>
    </module-state-feedback>
    </div>

    <!-- ── Dialogs ───────────────────────────────────────────── -->
    <create-and-edit-product
        v-model:visible="showDialog"
        :edit="!!editingItem"
        :product="editingItem"
        :categories="store.categorySelectOptions"
        @product-saved="onSaved"
    />

    <create-and-edit-inventory-category
        v-model:visible="showCategoryDialog"
        :edit="!!editingCategory"
        :category="editingCategory"
        @category-saved="onCategorySaved"
    />

    <register-stock-movement
        v-model:visible="showMovementDialog"
        :products="store.products"
        @movement-saved="onMovementSaved"
    />
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────── */
.inv-layout.module-page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.inv-shell {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.inv-tab-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

/* ── Contenedor principal (cada tab) ───────────────────────────────────── */
.inv-home {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem 1.5rem 1.5rem;
    background: var(--module-page-bg, #f3f4f6);
}

.inv-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.inv-toolbar--split {
    justify-content: space-between;
    align-items: flex-start;
}

.inv-toolbar__search {
    flex: 1;
    min-width: 200px;
}

.inv-toolbar__select {
    min-width: 150px;
}

.inv-section-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
}

.inv-section-hint {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: #6b7280;
}

.inv-panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
}

.inv-empty__icon {
    font-size: 2.25rem;
    color: #d1d5db;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.inv-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    color: #9ca3af;
    padding: 3rem 2rem;
    text-align: center;
    min-height: 220px;
}
.inv-empty__title { font-size: 1rem; font-weight: 600; color: #374151; }
.inv-empty__sub   { font-size: 0.875rem; color: #6b7280; max-width: 28rem; line-height: 1.45; }

/* ── Tabla ───────────────────────────────────────────────────────────────── */
.inv-table-wrap {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}



.inv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.83rem;
}

.inv-table thead tr {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
}

.inv-table th {
    padding: 0.7rem 0.85rem;
    text-align: left;
    font-size: 0.73rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
}

.inv-row {
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background 0.1s;
}
.inv-row:hover { background: #fafafe; }

.inv-table td {
    padding: 0.7rem 0.85rem;
    color: #374151;
    vertical-align: middle;
}

.td-sku     { font-family: monospace; font-size: 0.78rem; color: #6b7280; }
.td-amount  { text-align: right; font-weight: 600; white-space: nowrap; color: #374151; }
.td-price   { color: #111827; }
.td-minmax  { white-space: nowrap; color: #6b7280; font-size: 0.78rem; }
.td-actions { white-space: nowrap; width: 5rem; }

.badge {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}

/* ── Category cards (categories tab) ─────────────────────────────────── */
.cats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
}

.cat-card {
    position: relative;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    transition: box-shadow 0.15s;
}
.cat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }

.cat-card--inactive {
    opacity: 0.55;
    filter: grayscale(0.7);
    transition: opacity 0.2s, filter 0.2s;
}
.cat-card--inactive:hover {
    opacity: 0.75;
    filter: grayscale(0.4);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.cat-card__top-bar { height: 4px; }

.cat-card__body {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1rem;
}

.cat-card__icon-wrap {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.3rem;
}

.cat-card__info { flex: 1; min-width: 0; }

.cat-card__name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
}

.cat-card__desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.cat-card__badge {
    font-size: 0.68rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    background: #eff6ff;
    color: #1d4ed8;
    flex-shrink: 0;
}

.cat-card__active-badge {
    font-size: 0.63rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
    flex-shrink: 0;
}
.cat-card__active-badge--on  { background: #dcfce7; color: #15803d; }
.cat-card__active-badge--off { background: #fee2e2; color: #b91c1c; }

.cat-card__actions {
    display: flex;
    gap: 0.4rem;
    padding: 0 1rem 0.85rem;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.15s;
}
.cat-card:hover .cat-card__actions { opacity: 1; }

/* ── Management action buttons ───────────────────────────────────────── */
.mgmt-btn {
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
    color: #6b7280;
    transition: background 0.12s, color 0.12s;
}
.mgmt-btn--edit:hover   { background: #eff6ff; color: #2563eb; border-color: #93c5fd; }
.mgmt-btn--delete:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }

.mgmt-btn--power { transition: background 0.15s, color 0.15s, border-color 0.15s; }
.mgmt-btn--power-on  { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
.mgmt-btn--power-on:hover  { background: #dcfce7; color: #15803d; border-color: #86efac; }
.mgmt-btn--power-off { color: #9ca3af; border-color: #e5e7eb; background: #f9fafb; }
.mgmt-btn--power-off:hover { background: #f0fdf4; color: #16a34a; border-color: #86efac; }

/* ── Movement direction badge ─────────────────────────────────────────── */
.dir-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}
.dir-badge--in  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.dir-badge--out { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
.dir-badge i { font-size: 0.65rem; }

/* ── Movement table extras ────────────────────────────────────────────── */
.inv-row--readonly { cursor: default; }
.td-date  { white-space: nowrap; font-size: 0.78rem; color: #6b7280; }
.td-notes { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.78rem; color: #6b7280; }
.td-user  { white-space: nowrap; font-size: 0.78rem; color: #6b7280; }

/* ── Pagination ──────────────────────────────────────────────────────────── */
.inv-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.25rem;
}

.inv-pagination__info {
    font-size: 0.78rem;
    color: #6b7280;
}

.inv-pagination__controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.inv-pagination__page {
    font-size: 0.78rem;
    font-weight: 600;
    color: #374151;
    min-width: 3.5rem;
    text-align: center;
}

.inv-pagination__btn {
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
.inv-pagination__btn:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
.inv-pagination__btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
