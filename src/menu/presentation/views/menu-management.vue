<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMenuStore } from '../../application/menu.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import CreateAndEditCategory from './create-and-edit-category.vue'
import CreateAndEditMenuItem  from './create-and-edit-menu-item.vue'

const store = useMenuStore()
const { confirmDelete } = useConfirmDialog()

onMounted(() => store.fetchAll())

const selectedAvailability = ref(null) // null | true | false

const visibleItems = computed(() => {
    if (selectedAvailability.value === null) return store.filteredItems
    return store.filteredItems.filter(i => i.isAvailable === selectedAvailability.value)
})

function toggleAvailability(val) {
    selectedAvailability.value = selectedAvailability.value === val ? null : val
}

const showCategoryDialog = ref(false)
const editingCategory    = ref(null)

const activeTab = ref('catalog')

const showItemDialog = ref(false)
const editingItem    = ref(null)

function openCreateItem() {
    editingItem.value = null
    showItemDialog.value = true
}

function openEditItem(item) {
    editingItem.value = { ...item }
    showItemDialog.value = true
}

function onDeleteItem(item) {
    confirmDelete('el producto', item.name, () => store.remove(item.id))
}

function onItemSaved(data) {
    if (editingItem.value) {
        store.update(editingItem.value.id, data)
    } else {
        store.create(data)
    }
    editingItem.value = null
}

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
</script>

<template>
    <div class="menu-layout">

        <!-- ── Loading ────────────────────────────────────────────────── -->
        <div v-if="store.isLoading" class="menu-loading">
            <pv-progress-spinner style="width:40px;height:40px" stroke-width="4" />
            <span>Cargando menú...</span>
        </div>

        <!-- ── Error banner ───────────────────────────────────────────── -->
        <div v-if="store.error" class="menu-error-banner">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ store.error }}</span>
            <button class="menu-error-banner__retry" @click="store.fetchAll()">Reintentar</button>
        </div>

        <!-- ── Tab navigation ──────────────────────────────────────────── -->
        <div class="menu-tabs">
            <button
                :class="['tab-btn', activeTab === 'catalog' && 'tab-btn--active']"
                @click="activeTab = 'catalog'"
            >
                <i class="pi pi-book"></i> Catálogo
            </button>
            <button
                :class="['tab-btn', activeTab === 'categories' && 'tab-btn--active']"
                @click="activeTab = 'categories'"
            >
                <i class="pi pi-tag"></i> Categorías
            </button>
        </div>

        <!-- ══════════════════ TAB: CATÁLOGO ═════════════════════════════ -->
        <div v-if="activeTab === 'catalog'" class="p-4 flex flex-column gap-4 catalog-tab">

            <!-- Stat chips -->
            <div class="stat-row">
                <div class="stat-chip">
                    <span class="stat-chip__label">Total Productos</span>
                    <span class="stat-chip__value">{{ store.totalItems }}</span>
                </div>
                <button :class="['stat-chip', 'stat-chip--btn', selectedAvailability === true && 'stat-chip--active-green']" @click="toggleAvailability(true)">
                    <span class="stat-chip__dot" style="background:#22c55e"></span>
                    <span class="stat-chip__label">Disponibles</span>
                    <span class="stat-chip__value text-green-500">{{ store.availableItems }}</span>
                </button>
                <button :class="['stat-chip', 'stat-chip--btn', selectedAvailability === false && 'stat-chip--active-red']" @click="toggleAvailability(false)">
                    <span class="stat-chip__dot" style="background:#ef4444"></span>
                    <span class="stat-chip__label">No Disponibles</span>
                    <span class="stat-chip__value text-red-500">{{ store.unavailableItems }}</span>
                </button>
                <div class="stat-chip">
                    <span class="stat-chip__dot" style="background:#6366f1"></span>
                    <span class="stat-chip__label">Categorías</span>
                    <span class="stat-chip__value">{{ store.totalCategories }}</span>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="flex align-items-center gap-2">
                <div class="search-wrapper flex-1">
                    <i class="pi pi-search search-wrapper__icon"></i>
                    <pv-input-text
                        v-model="store.searchQuery"
                        placeholder="Buscar productos por nombre o SKU..."
                        class="w-full search-wrapper__input"
                    />
                </div>
                <pv-button label="Nuevo Producto" icon="pi pi-plus" size="small" severity="success" @click="openCreateItem" />
            </div>

            <!-- Category filter pills (solo lectura) -->
            <div class="flex flex-column gap-2">
                <div class="flex align-items-center gap-2">
                    <i class="pi pi-tag text-color-secondary"></i>
                    <span class="text-sm text-color-secondary font-medium">Filtrar por Categoría:</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button
                        :class="['filter-pill', store.selectedCategoryId === null && 'filter-pill--active']"
                        @click="store.selectCategory(null)"
                    >
                        Todas ({{ store.totalItems }})
                    </button>
                    <button
                        v-for="cat in store.categories"
                        :key="cat.id"
                        :class="['filter-pill', store.selectedCategoryId === cat.id && 'filter-pill--active']"
                        :style="{ borderLeft: `4px solid ${cat.color}` }"
                        @click="store.selectCategory(cat.id)"
                    >
                        {{ cat.name }} ({{ cat.count }})
                    </button>
                </div>
            </div>

            <!-- Items grid -->
            <div v-if="visibleItems.length > 0" class="menu-grid">
                <div
                    v-for="item in visibleItems"
                    :key="item.id"
                    class="menu-card"
                >
                    <div class="menu-card__image flex align-items-center justify-content-center">
                        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="menu-card__img" />
                        <i v-else class="pi pi-prime menu-card__placeholder-icon"></i>
                        <div :class="['menu-card__badge flex align-items-center', item.isAvailable ? 'menu-card__badge--available' : 'menu-card__badge--unavailable']">
                            <i :class="['pi', item.isAvailable ? 'pi-check-circle' : 'pi-times-circle']"></i>
                            {{ item.isAvailable ? 'Disponible' : 'No Disponible' }}
                        </div>
                        <div class="menu-card__actions">
                            <button class="menu-card__action-btn menu-card__action-btn--edit" title="Editar" @click.stop="openEditItem(item)">
                                <i class="pi pi-pencil"></i>
                            </button>
                            <button
                                class="menu-card__action-btn menu-card__action-btn--toggle"
                                :title="item.isAvailable ? 'Marcar no disponible' : 'Marcar disponible'"
                                @click.stop="store.setItemAvailability(item.id, !item.isAvailable)"
                            >
                                <i :class="['pi', item.isAvailable ? 'pi-eye-slash' : 'pi-eye']"></i>
                            </button>
                            <button class="menu-card__action-btn menu-card__action-btn--delete" title="Eliminar" @click.stop="onDeleteItem(item)">
                                <i class="pi pi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="menu-card__content flex flex-column">
                        <span class="text-xs text-color-secondary">{{ item.category }}</span>
                        <h3 class="menu-card__name font-bold">{{ item.name }}</h3>
                        <p class="menu-card__description">{{ item.description }}</p>
                        <div class="menu-card__footer flex flex-column">
                            <span class="menu-card__price font-bold text-blue-500">S/ {{ item.price.toFixed(2) }}</span>
                            <span class="menu-card__sku text-color-secondary">SKU: {{ item.sku }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="flex flex-column align-items-center justify-content-center gap-3 p-6">
                <i class="pi pi-inbox text-color-secondary" style="font-size: 3rem;"></i>
                <span class="text-color-secondary">No se encontraron productos</span>
            </div>

        </div>

        <!-- ══════════════════ TAB: CATEGORÍAS ═══════════════════════════ -->
        <div v-else class="p-4 flex flex-column gap-4">

            <div class="flex align-items-center justify-content-between">
                <span class="text-base font-bold text-color">Categorías</span>
                <pv-button label="Nueva Categoría" icon="pi pi-plus" size="small" @click="openCreateCategory" />
            </div>

            <div v-if="store.categories.length > 0" class="cats-grid">
                <div
                    v-for="cat in store.categories"
                    :key="cat.id"
                    class="cat-card"
                    :style="{ '--cat-color': cat.color }"
                >
                    <div class="cat-card__top-bar" :style="{ background: cat.color }"></div>
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
                        <button class="mgmt-btn mgmt-btn--edit" title="Editar" @click="openEditCategory(cat)">
                            <i class="pi pi-pencil"></i>
                        </button>
                        <button class="mgmt-btn mgmt-btn--delete" title="Eliminar" @click="onDeleteCategory(cat)">
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="flex flex-column align-items-center justify-content-center gap-2 py-6">
                <i class="pi pi-tag text-4xl text-color-secondary"></i>
                <span class="text-color-secondary">No hay categorías configuradas</span>
            </div>

        </div>

    </div>

    <CreateAndEditCategory
        v-model:visible="showCategoryDialog"
        :edit="!!editingCategory"
        :category="editingCategory"
        @category-saved="onCategorySaved"
    />
    <CreateAndEditMenuItem
        v-model:visible="showItemDialog"
        :edit="!!editingItem"
        :item="editingItem"
        :categories="store.categories"
        @item-saved="onItemSaved"
    />

</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────── */
.menu-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.menu-tabs {
    display: flex;
    border-bottom: 2px solid var(--surface-border);
    background: #fff;
    padding: 0 1.25rem;
    flex-shrink: 0;
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

/* ── Catalog tab scrollable ───────────────────────────────────────────── */
.catalog-tab {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

/* ── Stat chips ───────────────────────────────────────────────────────── */
.stat-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
}
.stat-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.85rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    white-space: nowrap;
    flex: 1;
    justify-content: center;
}
.stat-chip__dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.stat-chip__label {
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 500;
}
.stat-chip__value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
}

.stat-chip--btn {
    cursor: pointer;
    border: none;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.stat-chip--btn:hover { background: #f3f4f6; }
.stat-chip--active-green {
    background: #dcfce7 !important;
    border: 1px solid #22c55e !important;
    box-shadow: 0 0 0 2px #bbf7d0;
}
.stat-chip--active-red {
    background: #fee2e2 !important;
    border: 1px solid #ef4444 !important;
    box-shadow: 0 0 0 2px #fecaca;
}

.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

/* ── Search bar ───────────────────────────────────────────────────────── */
.search-wrapper {
    position: relative;
}

.search-wrapper__icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #9ca3af);
    font-size: 0.9rem;
    z-index: 1;
    pointer-events: none;
}

.search-wrapper__input {
    padding-left: 2.25rem !important;
}

/* Category filter pills → uses global .filter-pill from utilities.css */

/* ── Menu item cards grid ───────────────────────────────────── */
.menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
}

.menu-card {
    background: #ffffff;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 12px;
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
    cursor: pointer;
}

.menu-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

/* Image placeholder */
.menu-card__image {
    position: relative;
    height: 180px;
    background-color: #f3f4f6;
    overflow: hidden;
}

.menu-card__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.menu-card__placeholder-icon {
    font-size: 2.5rem;
    color: #9ca3af;
    opacity: 0.5;
}

/* Availability badge */
.menu-card__badge {
    position: absolute;
    top: 10px;
    right: 10px;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
}

.menu-card__badge--available {
    background-color: rgba(5, 150, 105, 0.12);
    color: #059669;
    border: 1px solid rgba(5, 150, 105, 0.3);
}

.menu-card__badge--unavailable {
    background-color: rgba(220, 38, 38, 0.1);
    color: #dc2626;
    border: 1px solid rgba(220, 38, 38, 0.25);
}

/* Hover action buttons */
.menu-card__actions {
    display: none;
    position: absolute;
    top: 10px;
    left: 10px;
    gap: 6px;
}

.menu-card:hover .menu-card__actions {
    display: flex;
}

.menu-card__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    font-size: 11px;
    transition: opacity 0.15s;
}

.menu-card__action-btn--edit {
    background-color: #3b82f6;
    color: #fff;
}

.menu-card__action-btn--toggle {
    background-color: #f59e0b;
    color: #fff;
}

.menu-card__action-btn--delete {
    background-color: #ef4444;
    color: #fff;
}

.menu-card__action-btn:hover {
    opacity: 0.85;
}

/* Card content */
.menu-card__content {
    padding: 0.85rem 1rem 1rem;
    gap: 4px;
}

.menu-card__name {
    margin: 0;
    font-size: 0.95rem;
    color: #111827;
    line-height: 1.3;
}

.menu-card__description {
    margin: 2px 0 6px;
    font-size: 0.78rem;
    color: #6b7280;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.menu-card__footer {
    gap: 2px;
}

.menu-card__price {
    font-size: 1.05rem;
}

.menu-card__sku {
    font-size: 0.7rem;
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

/* ── Shared management action buttons ────────────────────────────────── */
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

/* ── Loading ──────────────────────────────────────────────────────────── */
.menu-loading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    background: #f0f9ff;
    border-bottom: 1px solid #bae6fd;
    color: #0369a1;
    font-size: 0.88rem;
    font-weight: 500;
}

/* ── Error banner ─────────────────────────────────────────────────────── */
.menu-error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.8rem 1.25rem;
    background: #fef2f2;
    border-bottom: 1px solid #fca5a5;
    color: #dc2626;
    font-size: 0.88rem;
    font-weight: 500;
}
.menu-error-banner i { font-size: 1rem; }
.menu-error-banner__retry {
    margin-left: auto;
    padding: 0.3rem 0.9rem;
    background: #dc2626;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
}
.menu-error-banner__retry:hover { background: #b91c1c; }
</style>
