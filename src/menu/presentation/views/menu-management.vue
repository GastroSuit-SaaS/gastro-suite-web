<script setup>
import { ref } from 'vue'
import { useMenuStore } from '../../application/menu.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import CreateAndEditCategory from './create-and-edit-category.vue'
import CreateAndEditMenuItem  from './create-and-edit-menu-item.vue'

const store = useMenuStore()
const { confirmDelete } = useConfirmDialog()

const showCategoryDialog = ref(false)
const editingCategory    = ref(null)

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
    editingCategory.value = { id: cat.id, name: cat.name, color: cat.color, description: cat.description ?? '' }
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
    <div class="p-4 flex flex-column gap-4">

        <!-- Stat cards -->
        <div class="flex flex-wrap gap-3">

            <!-- Total Productos -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <span class="text-sm text-color-secondary">Total Productos</span>
                <span class="text-4xl font-bold text-color">{{ store.totalItems }}</span>
            </div>

            <!-- Disponibles -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <div class="flex align-items-center gap-2">
                    <span class="status-dot bg-green-500"></span>
                    <span class="text-sm text-color-secondary">Disponibles</span>
                </div>
                <span class="text-4xl font-bold text-green-500">{{ store.availableItems }}</span>
            </div>

            <!-- No Disponibles -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <div class="flex align-items-center gap-2">
                    <span class="status-dot bg-red-500"></span>
                    <span class="text-sm text-color-secondary">No Disponibles</span>
                </div>
                <span class="text-4xl font-bold text-red-500">{{ store.unavailableItems }}</span>
            </div>

            <!-- Categorías -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <span class="text-sm text-color-secondary">Categorías</span>
                <span class="text-4xl font-bold text-color">{{ store.totalCategories }}</span>
            </div>

        </div>

        <!-- Search bar -->
        <div class="search-wrapper">
            <i class="pi pi-search search-wrapper__icon"></i>
            <pv-input-text
                v-model="store.searchQuery"
                placeholder="Buscar productos por nombre o SKU..."
                class="w-full search-wrapper__input"
            />
        </div>

        <!-- Category filter label -->
        <div class="flex align-items-center gap-2">
            <i class="pi pi-tag text-color-secondary"></i>
            <span class="text-sm text-color-secondary font-medium">Filtrar por Categoría:</span>
        </div>

        <!-- Category filter pills + action buttons -->
        <div class="flex align-items-center justify-content-between gap-2">

            <!-- Pills (left, scrollable) -->
            <div class="flex flex-wrap align-items-center gap-2 flex-1">
                <button
                    :class="['cat-btn border-round-xl px-3 py-2 cursor-pointer text-sm font-medium border-1',
                             store.selectedCategoryId === null ? 'cat-btn--active' : 'cat-btn--inactive']"
                    @click="store.selectCategory(null)"
                >
                    Todas ({{ store.totalItems }})
                </button>

                <div v-for="cat in store.categories" :key="cat.id" class="cat-pill-wrapper inline-flex align-items-center">
                    <button
                        class="cat-btn border-round-xl px-3 py-2 cursor-pointer text-sm font-medium"
                        :class="store.selectedCategoryId === cat.id ? 'cat-btn--active' : 'cat-btn--inactive'"
                        :style="{ borderLeft: `4px solid ${cat.color}` }"
                        @click="store.selectCategory(cat.id)"
                    >
                        {{ cat.name }} ({{ cat.count }})
                    </button>
                    <div class="cat-pill-actions">
                        <button class="cat-action-btn cat-action-btn--edit" title="Editar categoría" @click.stop="openEditCategory(cat)">
                            <i class="pi pi-pencil"></i>
                        </button>
                        <button class="cat-action-btn cat-action-btn--delete" title="Eliminar categoría" @click.stop="onDeleteCategory(cat)">
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Action buttons (right) -->
            <div class="flex gap-2 flex-shrink-0">
                <pv-button label="Nueva Categoría" icon="pi pi-plus" size="small" @click="openCreateCategory" />
                <pv-button label="Nuevo Producto"  icon="pi pi-plus" size="small" severity="success" @click="openCreateItem" />
            </div>

        </div>

        <!-- Items grid -->
        <div v-if="store.filteredItems.length > 0" class="menu-grid">
            <div
                v-for="item in store.filteredItems"
                :key="item.id"
                class="menu-card"
            >
                <!-- Image area -->
                <div class="menu-card__image flex align-items-center justify-content-center">
                    <i class="pi pi-prime menu-card__placeholder-icon"></i>
                    <!-- Availability badge -->
                    <div :class="['menu-card__badge flex align-items-center', item.isAvailable ? 'menu-card__badge--available' : 'menu-card__badge--unavailable']">
                        <i :class="['pi', item.isAvailable ? 'pi-check-circle' : 'pi-times-circle']"></i>
                        {{ item.isAvailable ? 'Disponible' : 'No Disponible' }}
                    </div>
                    <!-- Hover actions -->
                    <div class="menu-card__actions">
                        <button class="menu-card__action-btn menu-card__action-btn--edit" title="Editar" @click.stop="openEditItem(item)">
                            <i class="pi pi-pencil"></i>
                        </button>
                        <button class="menu-card__action-btn menu-card__action-btn--delete" title="Eliminar" @click.stop="onDeleteItem(item)">
                            <i class="pi pi-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- Content -->
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

        <!-- Empty state -->
        <div v-else class="flex flex-column align-items-center justify-content-center gap-3 p-6">
            <i class="pi pi-inbox text-color-secondary" style="font-size: 3rem;"></i>
            <span class="text-color-secondary">No se encontraron productos</span>
        </div>

        <!-- Dialogs -->
        <pv-confirm-dialog />
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

    </div>
</template>

<style scoped>
.stat-card {
    min-width: 160px;
}

.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

/* ── Search bar ────────────────────────────────────────────── */
.search-wrapper {
    position: relative;
    width: 100%;
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

/* ── Category pills ─────────────────────────────────────────── */
.cat-btn {
    background-color: white;
    border-top:    1px solid var(--border-color, #e5e7eb);
    border-right:  1px solid var(--border-color, #e5e7eb);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    /* border-left se aplica via :style con el color de categoría */
    transition: background-color 0.15s, color 0.15s;
    white-space: nowrap;
}

.cat-btn--active {
    background-color: var(--color-primary, #3b82f6);
    color: #ffffff;
    border-color: var(--color-primary, #3b82f6);
}

.cat-btn--inactive {
    color: rgb(19, 18, 18);
}

.cat-btn--inactive:hover {
    background-color: var(--bg-hover, #f3f4f6);
    color: var(--text-primary, #374151);
}

/* wrapper for pill + edit/delete mini buttons */
.cat-pill-wrapper {
    position: relative;
}

.cat-pill-actions {
    display: none;
    position: absolute;
    top: -8px;
    right: -8px;
    gap: 2px;
    align-items: center;
}

.cat-pill-wrapper:hover .cat-pill-actions {
    display: flex;
}

.cat-action-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    cursor: pointer;
    transition: transform 0.1s ease, filter 0.1s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.cat-action-btn .pi {
    font-size: 10px;
    line-height: 1;
    display: block;
}

.cat-action-btn:hover {
    transform: scale(1.2);
    filter: brightness(1.15);
}

.cat-action-btn--edit {
    background: #3b82f6;
    color: #fff;
}

.cat-action-btn--delete {
    background: #ef4444;
    color: #fff;
}

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
    color: var(--text-primary, #111827);
    line-height: 1.3;
}

.menu-card__description {
    margin: 2px 0 6px;
    font-size: 0.78rem;
    color: #6366f1;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
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
</style>
