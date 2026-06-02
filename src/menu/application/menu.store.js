import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { MenuApi } from '../infrastructure/api/menu.api.js';
import { MenuItemAssembler } from '../infrastructure/assemblers/menu-item.assembler.js';
import { CategoryAssembler } from '../infrastructure/assemblers/category.assembler.js';
import { MenuItem } from '../domain/models/menu-item.entity.js';
import { Category } from '../domain/models/category.entity.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';
import { isNetworkOnline } from '../../shared/infrustructure/offline/network.js';
import { loadMenuReadCache, saveMenuReadCache } from '../../shared/infrustructure/offline/read-cache.js';
import { sortBySortOrder } from '../domain/menu-sort.js';

const api = new MenuApi();

/** @returns {{ ok: true } | { ok: false, message: string }} */
function fail(err, fallback, restore) {
    restore();
    return { ok: false, message: getApiErrorMessage(err, fallback) };
}

function isValidCategoryId(id) {
    if (id == null || id === '' || String(id) === 'null') return false;
    if (String(id).startsWith('temp-')) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
}

export const useMenuStore = defineStore('menu', () => {

    const categoriesData = ref([]);

    const selectedCategoryId = ref(null);
    const searchQuery         = ref('');
    const items        = ref([]);
    const isLoading    = ref(false);
    const error        = ref(null);
    const selectedItem = ref(null);

    const categories = computed(() =>
        sortBySortOrder(
            categoriesData.value
                .filter(cat => cat.isActive)
                .map(cat => new Category({
                    ...cat,
                    count: items.value.filter(i => i.categoryId === cat.id).length,
                })),
        ),
    );

    const allCategories = computed(() =>
        sortBySortOrder(
            categoriesData.value.map(cat => new Category({
                ...cat,
                count: items.value.filter(i => i.categoryId === cat.id).length,
            })),
        ),
    );

    const activeCategoryIds = computed(() =>
        new Set(categoriesData.value.filter(c => c.isActive).map(c => c.id))
    );

    const totalItems       = computed(() => items.value.filter(i => activeCategoryIds.value.has(i.categoryId)).length);
    const availableItems   = computed(() => items.value.filter(i => activeCategoryIds.value.has(i.categoryId) && i.isAvailable).length);
    const unavailableItems = computed(() => items.value.filter(i => activeCategoryIds.value.has(i.categoryId) && !i.isAvailable).length);
    const totalCategories  = computed(() => categories.value.length);

    const categoryOrderIndex = computed(() => {
        const map = new Map();
        categories.value.forEach((c, idx) => map.set(c.id, idx));
        return map;
    });

    const filteredItems = computed(() => {
        const query = searchQuery.value.trim().toLowerCase();
        const list = items.value.filter(i => {
            if (!activeCategoryIds.value.has(i.categoryId)) return false;
            const matchesCategory = selectedCategoryId.value === null || i.categoryId === selectedCategoryId.value;
            const matchesSearch   = !query || i.name.toLowerCase().includes(query) || i.description.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
        return [...list].sort((a, b) => {
            const oa = categoryOrderIndex.value.get(a.categoryId) ?? 999;
            const ob = categoryOrderIndex.value.get(b.categoryId) ?? 999;
            if (oa !== ob) return oa - ob;
            return a.name.localeCompare(b.name, 'es');
        });
    });

    async function reloadCategories() {
        const branchId = requireActiveBranchId();
        const catsResp = await api.listCategoriesByBranch(branchId);
        categoriesData.value = sortBySortOrder(CategoryAssembler.toEntitiesFromResponse(catsResp));
    }

    function hydrateFromCache() {
        try {
            const branchId = requireActiveBranchId();
            const cached = loadMenuReadCache(branchId);
            if (!cached?.items?.length && !cached?.categories?.length) return false;
            categoriesData.value = sortBySortOrder(
                cached.categories.map(c => new Category(c)),
            );
            items.value = cached.items.map(i => new MenuItem(i));
            return true;
        } catch {
            return false;
        }
    }

    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const branchId = requireActiveBranchId();
            const [itemsResp, catsResp] = await Promise.all([
                api.listItemsByBranch(branchId),
                api.listCategoriesByBranch(branchId),
            ]);
            categoriesData.value = sortBySortOrder(CategoryAssembler.toEntitiesFromResponse(catsResp));
            items.value          = MenuItemAssembler.toEntitiesFromResponse(itemsResp);
            saveMenuReadCache(branchId, {
                categories: categoriesData.value.map(c => ({ ...c })),
                items: items.value.map(i => ({ ...i })),
            });
        } catch (e) {
            if (!isNetworkOnline() && hydrateFromCache()) {
                error.value = null;
            } else {
                error.value = getApiErrorMessage(e, 'Error al cargar el menú');
            }
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getItemById(id);
            selectedItem.value = MenuItemAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar el producto');
        } finally {
            isLoading.value = false;
        }
    }

    async function create(itemData) {
        const { imageFile, ...fields } = itemData;
        const item = fields instanceof MenuItem ? fields : new MenuItem(fields);
        const cat = categoriesData.value.find(c => c.id === item.categoryId);
        const optimisticId = Date.now();
        const snapshot = [...items.value];
        const optimistic = new MenuItem({
            ...item,
            id:       optimisticId,
            category: cat?.name ?? '',
        });
        items.value.push(optimistic);
        try {
            const response = await api.createItem(MenuItemAssembler.toCreateResource(item));
            const saved = MenuItemAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                const idx = items.value.findIndex(i => i.id === optimisticId);
                if (idx !== -1) items.value.splice(idx, 1, saved);
            }
            return { ok: true };
        } catch (e) {
            return fail(e, 'No se pudo crear el producto', () => { items.value = snapshot; });
        }
    }

    async function update(id, itemData) {
        const { imageFile, ...fields } = itemData;
        const item = fields instanceof MenuItem ? fields : new MenuItem(fields);
        const snapshot = [...items.value];
        const idx = items.value.findIndex(i => i.id === id);
        if (idx !== -1) {
            const cat = categoriesData.value.find(c => c.id === item.categoryId);
            items.value[idx] = new MenuItem({
                ...items.value[idx],
                ...item,
                category: cat?.name ?? items.value[idx].category,
            });
        }
        try {
            await api.updateItem(id, MenuItemAssembler.toUpdateResource(item));
            return { ok: true };
        } catch (e) {
            return fail(e, 'No se pudo actualizar el producto', () => { items.value = snapshot; });
        }
    }

    async function remove(id) {
        const snapshot = [...items.value];
        items.value = items.value.filter(i => i.id !== id);
        try {
            await api.deleteItem(id);
            return { ok: true };
        } catch (e) {
            return fail(e, 'No se pudo eliminar el producto', () => { items.value = snapshot; });
        }
    }

    async function setItemAvailability(id, isAvailable) {
        const item = items.value.find(i => i.id === id);
        if (!item) return { ok: false, message: 'Producto no encontrado' };
        const prev = item.isAvailable;
        item.isAvailable = isAvailable;
        try {
            await api.updateItem(id, MenuItemAssembler.toUpdateResource({ isAvailable }));
            return { ok: true };
        } catch (e) {
            item.isAvailable = prev;
            return { ok: false, message: getApiErrorMessage(e, 'No se pudo cambiar la disponibilidad') };
        }
    }

    function selectCategory(id) {
        selectedCategoryId.value = selectedCategoryId.value === id ? null : id;
    }

    async function createCategory(data) {
        const category = data instanceof Category ? data : new Category(data);
        let branchId;
        try {
            branchId = requireActiveBranchId();
        } catch (e) {
            return { ok: false, message: e?.message ?? 'Selecciona una sucursal activa para continuar.' };
        }
        const optimisticId = `temp-${Date.now()}`;
        const snapshot = [...categoriesData.value];
        categoriesData.value.push(new Category({ id: optimisticId, ...category }));
        try {
            const response = await api.createCategory(
                CategoryAssembler.toResourceFromEntity(category, branchId, snapshot),
            );
            const saved = CategoryAssembler.toEntityFromResponse(response);
            if (saved?.id && isValidCategoryId(saved.id)) {
                const idx = categoriesData.value.findIndex(c => c.id === optimisticId);
                if (idx !== -1) categoriesData.value.splice(idx, 1, saved);
            } else {
                categoriesData.value = snapshot;
                await fetchAll();
            }
            categoriesData.value = sortBySortOrder(categoriesData.value);
            return { ok: true };
        } catch (e) {
            return fail(e, 'No se pudo crear la categoría', () => { categoriesData.value = snapshot; });
        }
    }

    async function updateCategory(id, data) {
        const categoryId = id ?? (data instanceof Category ? data.id : data?.id);
        if (!isValidCategoryId(categoryId)) {
            return {
                ok: false,
                message: 'No se pudo identificar la categoría. Recarga el menú e intenta de nuevo.',
            };
        }
        const category = data instanceof Category
            ? data
            : new Category({ ...data, id: categoryId });
        const snapshot = [...categoriesData.value];
        try {
            await api.updateCategory(categoryId, CategoryAssembler.toUpdateResource(category));
            await reloadCategories();
            return { ok: true };
        } catch (e) {
            return fail(e, 'No se pudo actualizar la categoría', () => { categoriesData.value = snapshot; });
        }
    }

    async function removeCategory(id) {
        if (!isValidCategoryId(id)) {
            return { ok: false, message: 'No se pudo identificar la categoría. Recarga el menú e intenta de nuevo.' };
        }
        const snapshot = [...categoriesData.value];
        categoriesData.value = categoriesData.value.filter(c => c.id !== id);
        try {
            await api.deleteCategory(id);
            return { ok: true };
        } catch (e) {
            return fail(e, 'No se pudo eliminar la categoría', () => { categoriesData.value = snapshot; });
        }
    }

    return {
        items, categoriesData, selectedCategoryId, searchQuery, isLoading, error, selectedItem,
        totalItems, availableItems, unavailableItems, totalCategories, categories, allCategories, filteredItems,
        fetchAll, hydrateFromCache, fetchById, create, update, remove,
        setItemAvailability, selectCategory, createCategory, updateCategory, removeCategory,
    };
});
