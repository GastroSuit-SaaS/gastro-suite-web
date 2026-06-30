<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '../../application/inventory.store.js'
import { useConfirmDialog } from '../../../shared/presentation/composables/use-confirm-dialog.js'
import { STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from '../constants/inventory.constants-ui.js'
import CreateAndEditProduct           from './create-and-edit-product.vue'
import CreateAndEditInventoryCategory from './create-and-edit-inventory-category.vue'
import RegisterStockMovement          from './register-stock-movement.vue'
import ModuleStateFeedback            from '../../../shared/presentation/components/module-state-feedback.vue'
import ModuleTabBar                   from '../../../shared/presentation/components/module-tab-bar.vue'
import ModuleTab                      from '../../../shared/presentation/components/module-tab.vue'
import ModuleEmptyState from '../../../shared/presentation/components/module-empty-state.vue'
import DataManager from '../../../shared/presentation/components/data-manager.vue'
import { useNotification } from '../../../shared/presentation/composables/use-notification.js'
import { INVENTORY_MESSAGES } from '../constants/inventory.constants-ui.js'

const store = useInventoryStore()
const { showSuccess, showError } = useNotification()
const { confirmDelete } = useConfirmDialog()

onMounted(() => store.fetchAll())

// ── Tab ──────────────────────────────────────────────────
const activeTab = ref('products')

// ── Products state ───────────────────────────────────────
const showDialog   = ref(false)
const editingItem  = ref(null)
const selectedStatus = ref(null)

const categoryFilterOptions = computed(() => store.categorySelectOptions)

const canCreateProduct = computed(() => store.categorySelectOptions.length > 0)

const productTableColumns = [
    { field: 'name', header: 'Producto', sortable: true, template: 'prod-name', style: 'min-width: 180px' },
    { field: 'sku', header: 'SKU', sortable: true, style: 'min-width: 100px' },
    { field: 'category', header: 'Categoría', sortable: true, style: 'min-width: 120px' },
    { field: 'stock', header: 'Stock', sortable: true, template: 'prod-stock', style: 'min-width: 90px' },
    { field: 'stockStatus', header: 'Estado', sortable: true, template: 'prod-status', style: 'min-width: 110px' },
    { field: 'cost', header: 'Costo', sortable: true, template: 'prod-cost', bodyStyle: 'text-align: right', headerStyle: 'text-align: right' },
    { field: 'price', header: 'Precio', sortable: true, template: 'prod-price', bodyStyle: 'text-align: right', headerStyle: 'text-align: right' },
    { field: 'minStock', header: 'Mín / Máx', sortable: false, template: 'prod-minmax', style: 'min-width: 90px' },
    { field: 'actions', header: '', sortable: false, template: 'prod-actions', style: 'min-width: 5rem' },
]

function productRowClass() {
    return 'inv-row--clickable'
}

/** Overlays al body para quedar sobre tabs sticky */
import { OVERLAY_APPEND_TARGET as OVERLAY_TARGET } from '../../../shared/presentation/constants/overlay.constants-ui.js'

function toggleStatus(status) {
    selectedStatus.value = selectedStatus.value === status ? null : status
    store.filterStatus = selectedStatus.value
}

function clearStatus() {
    selectedStatus.value = null
    store.filterStatus = null
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
            const result = await store.remove(product.id)
            if (result.ok) showSuccess(INVENTORY_MESSAGES.PRODUCT_DELETED)
            else showError(result.message ?? store.error)
        },
    })
}

async function onSaved(data) {
    const isEdit = !!editingItem.value
    const result = isEdit
        ? await store.update(editingItem.value.id, data)
        : await store.create(data)
    if (result.ok) {
        showDialog.value = false
        editingItem.value = null
        showSuccess(isEdit ? INVENTORY_MESSAGES.PRODUCT_UPDATED : INVENTORY_MESSAGES.PRODUCT_CREATED)
    } else {
        showError(result.message ?? store.error)
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
            const result = await store.removeCategory(cat.id)
            if (result.ok) showSuccess(INVENTORY_MESSAGES.CATEGORY_DELETED)
            else showError(result.message ?? store.error)
        },
    })
}

async function onCategorySaved(data) {
    const isEdit = !!editingCategory.value
    const result = isEdit
        ? await store.updateCategory(editingCategory.value.id, data)
        : await store.createCategory(data)
    if (result.ok) {
        showCategoryDialog.value = false
        editingCategory.value = null
        showSuccess(isEdit ? INVENTORY_MESSAGES.CATEGORY_UPDATED : INVENTORY_MESSAGES.CATEGORY_CREATED)
    } else {
        showError(result.message ?? store.error)
    }
}

// ── Movements state ──────────────────────────────────────
const showMovementDialog = ref(false)
const editingMovement    = ref(null)

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

const movementTableColumns = [
    { field: 'createdAt', header: 'Fecha', sortable: true, template: 'mov-date', style: 'min-width: 130px' },
    { field: 'productName', header: 'Producto', sortable: true, template: 'mov-product', style: 'min-width: 160px' },
    { field: 'isEntry', header: 'Dir.', sortable: true, template: 'mov-direction', style: 'min-width: 100px' },
    { field: 'type', header: 'Motivo', sortable: true, template: 'mov-type', style: 'min-width: 120px' },
    { field: 'quantity', header: 'Cantidad', sortable: true, template: 'mov-qty', style: 'min-width: 90px', bodyStyle: 'text-align: right', headerStyle: 'text-align: right' },
    { field: 'previousStock', header: 'Stock ant.', sortable: true, template: 'mov-prev', style: 'min-width: 90px', bodyStyle: 'text-align: right', headerStyle: 'text-align: right' },
    { field: 'newStock', header: 'Stock nuevo', sortable: true, template: 'mov-new', style: 'min-width: 100px', bodyStyle: 'text-align: right', headerStyle: 'text-align: right' },
    { field: 'notes', header: 'Nota', sortable: false, template: 'mov-notes', style: 'min-width: 140px' },
    { field: 'userName', header: 'Registrado por', sortable: true, style: 'min-width: 120px' },
    { field: 'actions', header: '', sortable: false, template: 'mov-actions', style: 'min-width: 5rem' },
]

function openRegisterMovement() {
    editingMovement.value = null
    showMovementDialog.value = true
}

function openEditMovement(movement) {
    editingMovement.value = { ...movement }
    showMovementDialog.value = true
}

function isPersistedMovement(movement) {
    return movement?.id && !String(movement.id).startsWith('opt-')
}

function onDeleteMovement(movement) {
    confirmDelete({
        target: `${movement.productName} (${movement.quantity})`,
        accept: async () => {
            const result = await store.removeMovement(movement.id)
            if (result.ok) showSuccess(INVENTORY_MESSAGES.MOVEMENT_DELETED)
            else showError(result.message ?? store.error)
        },
    })
}

async function onMovementSaved(data) {
    const ok = editingMovement.value
        ? await store.updateMovement(editingMovement.value.id, data)
        : await store.registerMovement(data)
    if (ok) {
        showSuccess(editingMovement.value ? INVENTORY_MESSAGES.MOVEMENT_UPDATED : INVENTORY_MESSAGES.MOVEMENT_REGISTERED)
        editingMovement.value = null
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

            <data-manager
                class="inv-products-manager"
                :items="store.products"
                :filtered-items="store.filteredProducts"
                :columns="productTableColumns"
                :title="{ singular: 'producto', plural: 'productos' }"
                :loading="store.isLoading"
                :dynamic="true"
                :global-filter-value="store.searchQuery"
                :row-class="productRowClass"
                search-placeholder="Buscar por nombre o SKU..."
                :inline-toolbar="true"
                new-button-label="Nuevo producto"
                :new-button-disabled="!canCreateProduct"
                new-button-tooltip="Crea al menos una categoría en la pestaña Categorías"
                :show-selection="false"
                :show-export="false"
                :show-actions="false"
                empty-icon="pi-inbox"
                empty-title="No se encontraron productos"
                :empty-subtitle="store.products.length === 0
                    ? 'Crea categorías y luego agrega tu primer producto de bodega.'
                    : 'Prueba otros filtros o términos de búsqueda.'"
                item-label="productos"
                :rows="12"
                @new-item-requested-manager="openCreate"
                @global-filter-change="store.searchQuery = $event"
                @view-item-requested-manager="openEdit"
            >
                <template #empty-actions>
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
                </template>

                <template #filters>
                    <pv-select
                        v-model="store.filterCategory"
                        :options="categoryFilterOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Categoría"
                        show-clear
                        :append-to="OVERLAY_TARGET"
                        size="small"
                        class="inv-toolbar__select"
                    />
                </template>

                <template #prod-name="{ data: p }">
                    <div class="flex flex-column">
                        <span class="font-semibold text-color">{{ p.name }}</span>
                        <span
                            v-if="p.description"
                            class="text-xs text-color-secondary inv-prod-desc"
                        >{{ p.description }}</span>
                    </div>
                </template>

                <template #prod-stock="{ data: p }">
                    <span :style="{ color: getStockStatusColor(p), fontWeight: 600 }">
                        {{ p.stock }} {{ p.unit }}
                    </span>
                </template>

                <template #prod-status="{ data: p }">
                    <span
                        class="badge"
                        :style="{
                            background: getStockStatusColor(p) + '22',
                            color: getStockStatusColor(p),
                            border: '1px solid ' + getStockStatusColor(p) + '66',
                        }"
                    >
                        {{ getStockStatusLabel(p) }}
                    </span>
                </template>

                <template #prod-cost="{ data: p }">
                    <span class="td-amount">{{ formatCurrency(p.cost) }}</span>
                </template>

                <template #prod-price="{ data: p }">
                    <span class="td-amount td-price">{{ formatCurrency(p.price) }}</span>
                </template>

                <template #prod-minmax="{ data: p }">
                    <span class="td-minmax">{{ p.minStock }} / {{ p.maxStock ?? '∞' }}</span>
                </template>

                <template #prod-actions="{ data: p }">
                    <div class="inv-row-actions">
                        <button
                            type="button"
                            class="dm-action-btn dm-action-btn--edit"
                            title="Editar"
                            @click.stop="openEdit(p)"
                        >
                            <i class="pi pi-pencil" />
                        </button>
                        <button
                            type="button"
                            class="dm-action-btn dm-action-btn--delete"
                            title="Eliminar"
                            @click.stop="onDelete(p)"
                        >
                            <i class="pi pi-trash" />
                        </button>
                    </div>
                </template>
            </data-manager>
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
            <module-empty-state
                v-else
                icon="pi-tag"
                title="No hay categorías configuradas"
                subtitle="Crea categorías para organizar los productos del inventario."
            >
                <pv-button label="Nueva categoría" icon="pi pi-plus" size="small" @click="openCreateCategory" />
            </module-empty-state>
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

            <data-manager
                class="inv-movements-manager"
                :items="store.movements"
                :filtered-items="store.filteredMovements"
                :columns="movementTableColumns"
                :title="{ singular: 'movimiento', plural: 'movimientos' }"
                :loading="store.isLoading"
                :dynamic="true"
                :global-filter-value="store.movementSearch"
                search-placeholder="Buscar producto, SKU, registrado por, nota..."
                :inline-toolbar="true"
                new-button-label="Registrar movimiento"
                :show-selection="false"
                :show-export="false"
                :show-actions="false"
                empty-icon="pi-arrow-right-arrow-left"
                empty-title="No hay movimientos registrados"
                empty-subtitle="Registra entradas y salidas para llevar el kardex de bodega."
                item-label="movimientos"
                :rows="15"
                @new-item-requested-manager="openRegisterMovement"
                @global-filter-change="store.movementSearch = $event"
            >
                <template #empty-actions>
                    <pv-button
                        v-if="store.products.length > 0"
                        label="Registrar movimiento"
                        icon="pi pi-plus"
                        size="small"
                        @click="openRegisterMovement"
                    />
                </template>

                <template #filters>
                    <pv-select
                        v-model="store.movementFilterType"
                        :options="movementTypeFilterOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Motivo"
                        show-clear
                        :append-to="OVERLAY_TARGET"
                        size="small"
                        class="inv-toolbar__select"
                    />
                    <pv-select
                        v-model="store.movementFilterDirection"
                        :options="movementDirFilterOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Dirección"
                        show-clear
                        :append-to="OVERLAY_TARGET"
                        size="small"
                        class="inv-toolbar__select"
                    />
                </template>

                <template #mov-date="{ data: m }">
                    <span class="td-date">{{ formatDate(m.createdAt) }}</span>
                </template>

                <template #mov-product="{ data: m }">
                    <div class="flex flex-column">
                        <span class="font-semibold text-color">{{ m.productName }}</span>
                        <span class="text-xs text-color-secondary">{{ m.productSku }}</span>
                    </div>
                </template>

                <template #mov-direction="{ data: m }">
                    <span :class="['dir-badge', m.isEntry ? 'dir-badge--in' : 'dir-badge--out']">
                        <i :class="['pi', m.isEntry ? 'pi-arrow-down' : 'pi-arrow-up']"></i>
                        {{ m.isEntry ? 'Entrada' : 'Salida' }}
                    </span>
                </template>

                <template #mov-type="{ data: m }">
                    <span
                        class="badge"
                        :style="{
                            background: (MOVEMENT_TYPE_COLORS[m.type] ?? '#6b7280') + '18',
                            color: MOVEMENT_TYPE_COLORS[m.type] ?? '#6b7280',
                            border: '1px solid ' + (MOVEMENT_TYPE_COLORS[m.type] ?? '#6b7280') + '44',
                        }"
                    >
                        {{ MOVEMENT_TYPE_LABELS[m.type] ?? m.type }}
                    </span>
                </template>

                <template #mov-qty="{ data: m }">
                    <span class="td-amount" :style="{ color: m.isEntry ? '#059669' : '#dc2626' }">
                        {{ m.isEntry ? '+' : '-' }}{{ m.quantity }}
                    </span>
                </template>

                <template #mov-prev="{ data: m }">
                    <span class="td-amount" style="color:#6b7280">{{ m.previousStock }}</span>
                </template>

                <template #mov-new="{ data: m }">
                    <span class="td-amount font-bold">{{ m.newStock }}</span>
                </template>

                <template #mov-notes="{ data: m }">
                    <span class="td-notes">{{ m.notes || '—' }}</span>
                </template>

                <template #mov-actions="{ data: m }">
                    <div v-if="isPersistedMovement(m)" class="inv-row-actions">
                        <button
                            type="button"
                            class="dm-action-btn dm-action-btn--edit"
                            title="Editar"
                            @click.stop="openEditMovement(m)"
                        >
                            <i class="pi pi-pencil" />
                        </button>
                        <button
                            type="button"
                            class="dm-action-btn dm-action-btn--delete"
                            title="Eliminar"
                            @click.stop="onDeleteMovement(m)"
                        >
                            <i class="pi pi-trash" />
                        </button>
                    </div>
                </template>
            </data-manager>
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
        :edit="!!editingMovement"
        :movement="editingMovement"
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


.inv-movements-manager {
    flex: 1;
    min-height: 0;
}

.inv-products-manager {
    flex: 1;
    min-height: 0;
}

.inv-prod-desc {
    max-width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.inv-row-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.25rem;
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
</style>
