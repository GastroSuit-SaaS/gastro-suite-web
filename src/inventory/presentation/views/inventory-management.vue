<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '../../application/inventory.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from '../constants/inventory.constants-ui.js'
import CreateAndEditProduct           from './create-and-edit-product.vue'
import CreateAndEditInventoryCategory from './create-and-edit-inventory-category.vue'
import RegisterStockMovement          from './register-stock-movement.vue'
import ModuleStateFeedback            from '../../../shared/presentation/components/module-state-feedback.vue'

const store = useInventoryStore()
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

const categoryOptions = computed(() => [
    { label: 'Todas', value: '' },
    ...store.categoryNames.map(c => ({ label: c, value: c })),
])

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
    confirmDelete('el producto', product.name, () => store.remove(product.id))
}

function onSaved(data) {
    if (editingItem.value) {
        store.update(editingItem.value.id, data)
    } else {
        store.create(data)
    }
    editingItem.value = null
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
    confirmDelete('la categoría', cat.name, () => store.removeCategory(cat.id))
}

function onCategorySaved(data) {
    if (editingCategory.value) {
        store.updateCategory(editingCategory.value.id, data)
    } else {
        store.createCategory(data)
    }
    editingCategory.value = null
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
    { label: 'Todos', value: '' },
    { label: 'Compra',        value: 'purchase'   },
    { label: 'Uso cocina',    value: 'usage'      },
    { label: 'Merma',         value: 'waste'      },
    { label: 'Ajuste',        value: 'adjustment' },
    { label: 'Transferencia', value: 'transfer'   },
    { label: 'Devolución',    value: 'return'     },
]

const movementDirFilterOptions = [
    { label: 'Todas',    value: '' },
    { label: 'Entradas', value: 'in'  },
    { label: 'Salidas',  value: 'out' },
]

function openRegisterMovement() {
    showMovementDialog.value = true
}

function onMovementSaved(data) {
    store.registerMovement(data)
}

function formatDate(d) {
    if (!d) return '—'
    const dt = new Date(d)
    return dt.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <div class="inv-layout">

    <module-state-feedback
        :loading="store.isLoading"
        :error="store.error"
        loading-label="Cargando inventario..."
        @retry="store.fetchAll()"
    >

        <!-- ══ Tab navigation ═════════════════════════════════════════════ -->
        <div class="inv-tabs">
            <button
                :class="['tab-btn', activeTab === 'products' && 'tab-btn--active']"
                @click="activeTab = 'products'"
            >
                <i class="pi pi-box"></i> Productos
            </button>
            <button
                :class="['tab-btn', activeTab === 'categories' && 'tab-btn--active']"
                @click="activeTab = 'categories'"
            >
                <i class="pi pi-tag"></i> Categorías
            </button>
            <button
                :class="['tab-btn', activeTab === 'movements' && 'tab-btn--active']"
                @click="activeTab = 'movements'"
            >
                <i class="pi pi-arrow-right-arrow-left"></i> Movimientos
            </button>
        </div>

        <!-- ══════════════════ TAB: PRODUCTOS ════════════════════════════ -->
        <div v-if="activeTab === 'products'" class="inv-home">

            <!-- ── Stat cards ──────────────────────────────────────── -->
            <div class="stat-strip">
                <div class="stat-card stat-card--primary" style="cursor:pointer" @click="clearStatus">
                    <span class="stat-card__label">Total productos</span>
                    <span class="stat-card__value">{{ store.totalProducts }}</span>
                    <span class="stat-card__sub">{{ formatCurrency(store.totalStockValue) }} en stock</span>
                </div>
                <div class="stat-card" :class="{ 'stat-card--selected': selectedStatus === 'in_stock' }" style="cursor:pointer" @click="toggleStatus('in_stock')">
                    <div class="stat-card__method-row">
                        <span class="method-dot" style="background:#059669"></span>
                        <span class="stat-card__label">En stock</span>
                    </div>
                    <span class="stat-card__value stat-card__value--sm">{{ store.inStockProducts.length }}</span>
                </div>
                <div class="stat-card" :class="{ 'stat-card--selected': selectedStatus === 'low_stock' }" style="cursor:pointer" @click="toggleStatus('low_stock')">
                    <div class="stat-card__method-row">
                        <span class="method-dot" style="background:#f59e0b"></span>
                        <span class="stat-card__label">Stock bajo</span>
                    </div>
                    <span class="stat-card__value stat-card__value--sm">{{ store.lowStockProducts.length }}</span>
                </div>
                <div class="stat-card" :class="{ 'stat-card--selected': selectedStatus === 'out_of_stock' }" style="cursor:pointer" @click="toggleStatus('out_of_stock')">
                    <div class="stat-card__method-row">
                        <span class="method-dot" style="background:#dc2626"></span>
                        <span class="stat-card__label">Sin stock</span>
                    </div>
                    <span class="stat-card__value stat-card__value--sm">{{ store.outOfStockProducts.length }}</span>
                </div>
            </div>

            <!-- ── Filtros ─────────────────────────────────────────── -->
            <div class="flex align-items-center flex-wrap gap-3">
                <pv-icon-field class="flex-1" style="min-width: 200px">
                    <pv-input-icon class="pi pi-search" />
                    <pv-input-text
                        v-model="store.searchQuery"
                        placeholder="Buscar por nombre o SKU..."
                        class="w-full"
                        size="small"
                        @input="productPage = 1"
                    />
                </pv-icon-field>

                <div class="flex align-items-center gap-2">
                    <label class="text-xs font-semibold text-color-secondary uppercase white-space-nowrap">Categoría</label>
                    <pv-select
                        v-model="store.filterCategory"
                        :options="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todas"
                        size="small"
                        @change="productPage = 1"
                    />
                </div>

                <pv-button label="Nuevo producto" icon="pi pi-plus" size="small" @click="openCreate" />
            </div>

            <!-- ── Empty ───────────────────────────────────────────── -->
            <div v-if="store.filteredProducts.length === 0" class="inv-empty">
                <i class="pi pi-inbox" style="font-size:2rem;color:#d1d5db"></i>
                <span class="inv-empty__title">No se encontraron productos</span>
                <span class="inv-empty__sub">Agrega productos para comenzar a gestionar tu inventario</span>
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

        <!-- ══════════════════ TAB: CATEGORÍAS ═══════════════════════════ -->
        <div v-else-if="activeTab === 'categories'" class="inv-home">

            <div class="flex align-items-center justify-content-between">
                <span class="text-base font-bold text-color">Categorías de Inventario</span>
                <pv-button label="Nueva Categoría" icon="pi pi-plus" size="small" @click="openCreateCategory" />
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
            <div v-else class="inv-empty">
                <i class="pi pi-tag" style="font-size:2rem;color:#d1d5db"></i>
                <span class="inv-empty__title">No hay categorías configuradas</span>
                <span class="inv-empty__sub">Crea categorías para organizar los productos del inventario</span>
            </div>
        </div>

        <!-- ══════════════════ TAB: MOVIMIENTOS ══════════════════════ -->
        <div v-else class="inv-home">

            <!-- Stat strip movimientos -->
            <div class="stat-strip">
                <div class="stat-card stat-card--primary">
                    <span class="stat-card__label">Total movimientos</span>
                    <span class="stat-card__value">{{ store.totalMovements }}</span>
                </div>
                <div class="stat-card">
                    <div class="stat-card__method-row">
                        <span class="method-dot" style="background:#059669"></span>
                        <span class="stat-card__label">Entradas</span>
                    </div>
                    <span class="stat-card__value stat-card__value--sm">{{ store.entryMovements.length }}</span>
                </div>
                <div class="stat-card">
                    <div class="stat-card__method-row">
                        <span class="method-dot" style="background:#dc2626"></span>
                        <span class="stat-card__label">Salidas</span>
                    </div>
                    <span class="stat-card__value stat-card__value--sm">{{ store.exitMovements.length }}</span>
                </div>
            </div>

            <!-- Filtros movimientos -->
            <div class="flex align-items-center flex-wrap gap-3">
                <pv-icon-field class="flex-1" style="min-width: 200px">
                    <pv-input-icon class="pi pi-search" />
                    <pv-input-text
                        v-model="store.movementSearch"
                        placeholder="Buscar por producto, nota..."
                        class="w-full"
                        size="small"
                        @input="movementPage = 1"
                    />
                </pv-icon-field>

                <div class="flex align-items-center gap-2">
                    <label class="text-xs font-semibold text-color-secondary uppercase white-space-nowrap">Motivo</label>
                    <pv-select
                        v-model="store.movementFilterType"
                        :options="movementTypeFilterOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todos"
                        size="small"
                        style="min-width: 140px"
                        @change="movementPage = 1"
                    />
                </div>

                <div class="flex align-items-center gap-2">
                    <label class="text-xs font-semibold text-color-secondary uppercase white-space-nowrap">Dir.</label>
                    <pv-select
                        v-model="store.movementFilterDirection"
                        :options="movementDirFilterOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todas"
                        size="small"
                        style="min-width: 120px"
                        @change="movementPage = 1"
                    />
                </div>

                <pv-button label="Registrar movimiento" icon="pi pi-plus" size="small" @click="openRegisterMovement" />
            </div>

            <!-- Empty -->
            <div v-if="store.filteredMovements.length === 0" class="inv-empty">
                <i class="pi pi-arrow-right-arrow-left" style="font-size:2rem;color:#d1d5db"></i>
                <span class="inv-empty__title">No hay movimientos registrados</span>
                <span class="inv-empty__sub">Registra entradas y salidas de productos para llevar control del inventario</span>
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
                            <th>Usuario</th>
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
                            <td class="td-user">{{ m.userName || '—' }}</td>
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

    </module-state-feedback>
    </div>

    <!-- ── Dialogs ───────────────────────────────────────────── -->
    <create-and-edit-product
        v-model:visible="showDialog"
        :edit="!!editingItem"
        :product="editingItem"
        :categories="store.categoryNames"
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
.inv-layout {
    display: flex;
    flex-direction: column;
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.inv-tabs {
    display: flex;
    border-bottom: 2px solid var(--surface-border, #e5e7eb);
    background: #fff;
    padding: 0 1.25rem;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    color: var(--text-color-secondary, #6b7280);
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.15s;
}
.tab-btn--active {
    color: var(--p-primary-color, #6366f1);
    border-bottom-color: var(--p-primary-color, #6366f1);
    font-weight: 600;
}
.tab-btn:hover:not(.tab-btn--active) { color: #374151; }

/* ── Contenedor principal (ambos tabs) ───────────────────────────────────── */
.inv-home {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
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
    transition: border-color 0.15s;
}
.stat-card--selected {
    border-color: #6366f1;
    background: #f5f3ff;
}

.stat-card--primary {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-color: transparent;
    color: #fff;
}
.stat-card--primary .stat-card__label { color: rgba(255,255,255,0.75); }
.stat-card--primary .stat-card__sub   { color: rgba(255,255,255,0.6); font-size: 0.75rem; }

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

/* ── Empty state ─────────────────────────────────────────────────────────── */
.inv-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #9ca3af;
    padding: 3rem;
}
.inv-empty__title { font-size: 1rem; font-weight: 600; color: #6b7280; }
.inv-empty__sub   { font-size: 0.83rem; }

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
