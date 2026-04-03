import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { MenuApi } from '../infrastructure/api/menu.api.js';
import { MenuItemAssembler } from '../infrastructure/assemblers/menu-item.assembler.js';
import { CategoryAssembler } from '../infrastructure/assemblers/category.assembler.js';
import { MenuItem } from '../domain/models/menu-item.entity.js';
import { Category } from '../domain/models/category.entity.js';
import { MOCK_CATEGORIES, MOCK_ITEMS } from '../infrastructure/menu.mock.js';

const api = new MenuApi();


export const useMenuStore = defineStore('menu', () => {

    const categoriesData = ref([]);

    const selectedCategoryId = ref(null);
    const searchQuery         = ref('');
    const items        = ref([]);
    const isLoading    = ref(false);
    const error        = ref(null);
    const selectedItem = ref(null);

    // ── Computeds ─────────────────────────────────────────────────────────
    // categories → solo activas (filtros catálogo, POS, dropdowns)
    const categories = computed(() =>
        categoriesData.value
            .filter(cat => cat.isActive)
            .map(cat => new Category({
                ...cat,
                count: items.value.filter(i => i.categoryId === cat.id).length,
            }))
    );

    // allCategories → todas (tab gestión)
    const allCategories = computed(() =>
        categoriesData.value.map(cat => new Category({
            ...cat,
            count: items.value.filter(i => i.categoryId === cat.id).length,
        }))
    );

    const activeCategoryIds = computed(() =>
        new Set(categoriesData.value.filter(c => c.isActive).map(c => c.id))
    );

    const totalItems       = computed(() => items.value.filter(i => activeCategoryIds.value.has(i.categoryId)).length);
    const availableItems   = computed(() => items.value.filter(i => activeCategoryIds.value.has(i.categoryId) && i.isAvailable).length);
    const unavailableItems = computed(() => items.value.filter(i => activeCategoryIds.value.has(i.categoryId) && !i.isAvailable).length);
    const totalCategories  = computed(() => categories.value.length);

    const filteredItems = computed(() => {
        const query = searchQuery.value.trim().toLowerCase();
        return items.value.filter(i => {
            if (!activeCategoryIds.value.has(i.categoryId)) return false;
            const matchesCategory = selectedCategoryId.value === null || i.categoryId === selectedCategoryId.value;
            const matchesSearch   = !query || i.name.toLowerCase().includes(query) || i.description.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    });

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                // Solo cargar mock data la primera vez; las mutaciones locales son fuente de verdad
                if (items.value.length === 0) {
                    const branchId = localStorage.getItem('gs_branch_id');
                    categoriesData.value = branchId ? MOCK_CATEGORIES.filter(c => c.sucursalId === branchId) : [...MOCK_CATEGORIES];
                    items.value          = branchId ? MOCK_ITEMS.filter(i => i.sucursalId === branchId)      : [...MOCK_ITEMS];
                }
                return;
            }
            const [itemsResp, catsResp] = await Promise.all([
                api.getAll(),
                api.getCategories(),
            ]);
            categoriesData.value = CategoryAssembler.toEntitiesFromResponse(catsResp);
            items.value          = MenuItemAssembler.toEntitiesFromResponse(itemsResp);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar el menú';
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedItem.value = MenuItemAssembler.toEntityFromResource(response.data?.data ?? response.data);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar el ítem';
        } finally {
            isLoading.value = false;
        }
    }

    async function create(itemData) {
        const { imageFile, ...fields } = itemData;
        const cat = categoriesData.value.find(c => c.id === fields.categoryId);
        const optimisticId = Date.now();
        const optimistic = new MenuItem({
            ...fields,
            id:       optimisticId,
            category: cat?.name ?? '',
        });
        items.value.push(optimistic);
        try {
            const response = await api.create(MenuItemAssembler.toResourceFromEntity ? MenuItemAssembler.toResourceFromEntity(fields) : fields);
            if (response.status === 201 || response.status === 200) {
                const saved = MenuItemAssembler.toEntityFromResource(response.data?.data ?? response.data);
                if (saved?.id) {
                    const idx = items.value.findIndex(i => i.id === optimisticId);
                    if (idx !== -1) items.value.splice(idx, 1, saved);
                }
            }
        } catch { /* optimistic entry stays */ }
    }

    async function update(id, itemData) {
        const { imageFile, ...fields } = itemData;
        const idx = items.value.findIndex(i => i.id === id);
        if (idx !== -1) {
            const cat = categoriesData.value.find(c => c.id === fields.categoryId);
            items.value[idx] = new MenuItem({
                ...items.value[idx],
                ...fields,
                category: cat?.name ?? items.value[idx].category,
            });
        }
        try {
            await api.update(id, MenuItemAssembler.toResourceFromEntity ? MenuItemAssembler.toResourceFromEntity(fields) : fields);
        } catch { /* local change kept */ }
    }

    async function remove(id) {
        items.value = items.value.filter(i => i.id !== id);
        try {
            await api.delete(id);
        } catch { /* local change kept */ }
    }

    async function setItemAvailability(id, isAvailable) {
        const item = items.value.find(i => i.id === id);
        if (!item) return;
        const prev = item.isAvailable;
        item.isAvailable = isAvailable;
        try {
            await api.update(id, { is_available: isAvailable });
        } catch {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            item.isAvailable = prev;
        }
    }

    function selectCategory(id) {
        selectedCategoryId.value = selectedCategoryId.value === id ? null : id;
    }

    async function createCategory(data) {
        const optimisticId = Math.max(0, ...categoriesData.value.map(c => c.id)) + 1;
        categoriesData.value.push(new Category({ id: optimisticId, ...data }));
        try {
            const response = await api.createCategory(CategoryAssembler.toResourceFromEntity(data));
            if (response.status === 201 || response.status === 200) {
                const saved = CategoryAssembler.toEntityFromResource(response.data?.data ?? response.data);
                if (saved?.id) {
                    const idx = categoriesData.value.findIndex(c => c.id === optimisticId);
                    if (idx !== -1) categoriesData.value.splice(idx, 1, saved);
                }
            }
        } catch { /* optimistic entry stays */ }
    }

    async function updateCategory(id, data) {
        const idx = categoriesData.value.findIndex(c => c.id === id);
        if (idx !== -1) categoriesData.value[idx] = new Category({ ...categoriesData.value[idx], ...data });
        try {
            await api.updateCategory(id, CategoryAssembler.toResourceFromEntity(data));
        } catch { /* local change kept */ }
    }

    async function removeCategory(id) {
        categoriesData.value = categoriesData.value.filter(c => c.id !== id);
        try {
            await api.deleteCategory(id);
        } catch { /* local change kept */ }
    }

    return {
        items, categoriesData, selectedCategoryId, searchQuery, isLoading, error, selectedItem,
        totalItems, availableItems, unavailableItems, totalCategories, categories, allCategories, filteredItems,
        fetchAll, fetchById, create, update, remove,
        setItemAvailability, selectCategory, createCategory, updateCategory, removeCategory,
    };
});
