import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryApi } from '../infrastructure/api/inventory.api.js';
import { ProductAssembler } from '../infrastructure/assemblers/product.assembler.js';
import { Product, STOCK_STATUS } from '../domain/models/product.entity.js';
import { InventoryCategory } from '../domain/models/inventory-category.entity.js';
import { StockMovement, MOVEMENT_TYPE, MOVEMENT_DIRECTION } from '../domain/models/stock-movement.entity.js';
import { MOCK_PRODUCTS, MOCK_INVENTORY_CATEGORIES, MOCK_STOCK_MOVEMENTS } from '../infrastructure/inventory.mock.js';
import { withMockFallback, withMockMutation } from '../../shared/infrustructure/mock-fallback.js';
import { useIamStore } from '../../iam/application/iam.store.js';

const api = new InventoryApi();

export const useInventoryStore = defineStore('inventory', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const products        = ref([]);
    const categoriesData  = ref([]);
    const movements       = ref([]);
    const selectedProduct = ref(null);
    const isLoading       = ref(false);
    const error           = ref(null);
    const searchQuery     = ref('');
    const filterCategory  = ref('');
    const filterStatus    = ref(null); // null | 'in_stock' | 'low_stock' | 'out_of_stock'
    const movementSearch  = ref('');
    const movementFilterType      = ref('');
    const movementFilterDirection = ref('');

    // ── Getters ───────────────────────────────────────────────────────────
    const totalProducts  = computed(() => products.value.length);
    const activeProducts = computed(() => products.value.filter(p => p.isActive));
    const lowStockProducts  = computed(() => products.value.filter(p => p.stockStatus === STOCK_STATUS.LOW_STOCK));
    const outOfStockProducts = computed(() => products.value.filter(p => p.stockStatus === STOCK_STATUS.OUT_OF_STOCK));
    const inStockProducts    = computed(() => products.value.filter(p => p.stockStatus === STOCK_STATUS.IN_STOCK));

    // ── Category getters (entity-based, same pattern as menu) ─────────
    const activeCategoryIds = computed(() =>
        new Set(categoriesData.value.filter(c => c.isActive).map(c => c.id))
    );

    const categories = computed(() => {
        const countMap = {};
        products.value.forEach(p => { if (p.categoryId) countMap[p.categoryId] = (countMap[p.categoryId] ?? 0) + 1; });
        return categoriesData.value
            .filter(c => c.isActive)
            .map(c => new InventoryCategory({ ...c, count: countMap[c.id] ?? 0 }));
    });

    const allCategories = computed(() => {
        const countMap = {};
        products.value.forEach(p => { if (p.categoryId) countMap[p.categoryId] = (countMap[p.categoryId] ?? 0) + 1; });
        return categoriesData.value
            .map(c => new InventoryCategory({ ...c, count: countMap[c.id] ?? 0 }));
    });

    const totalCategories = computed(() => categories.value.length);

    /** String-based category list for backward compat (dropdown in create-and-edit-product). */
    const categoryNames = computed(() => {
        return categories.value.map(c => c.name).sort();
    });

    const filteredProducts = computed(() => {
        let list = products.value;

        if (filterStatus.value) {
            list = list.filter(p => p.stockStatus === filterStatus.value);
        }

        if (filterCategory.value) {
            list = list.filter(p => p.category === filterCategory.value);
        }

        const q = searchQuery.value.trim().toLowerCase();
        if (q) {
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.description ?? '').toLowerCase().includes(q)
            );
        }

        return list;
    });

    const totalStockValue = computed(() =>
        products.value.reduce((sum, p) => sum + (p.cost * p.stock), 0)
    );

    // ── Movement getters ──────────────────────────────────────────────────
    const totalMovements = computed(() => movements.value.length);
    const entryMovements = computed(() => movements.value.filter(m => m.direction === MOVEMENT_DIRECTION.IN));
    const exitMovements  = computed(() => movements.value.filter(m => m.direction === MOVEMENT_DIRECTION.OUT));

    const filteredMovements = computed(() => {
        let list = [...movements.value];

        if (movementFilterType.value) {
            list = list.filter(m => m.type === movementFilterType.value);
        }
        if (movementFilterDirection.value) {
            list = list.filter(m => m.direction === movementFilterDirection.value);
        }

        const q = movementSearch.value.trim().toLowerCase();
        if (q) {
            list = list.filter(m =>
                m.productName.toLowerCase().includes(q) ||
                m.productSku.toLowerCase().includes(q) ||
                (m.notes ?? '').toLowerCase().includes(q) ||
                (m.reason ?? '').toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const [prodResponse, catResponse, movResponse] = await Promise.all([
                withMockFallback(
                    () => api.getAll(),
                    () => {
                        const branchId = localStorage.getItem('gs_branch_id');
                        return branchId
                            ? MOCK_PRODUCTS.filter(p => p.sucursalId === branchId)
                            : [...MOCK_PRODUCTS];
                    },
                ),
                withMockFallback(
                    () => api.getCategories(),
                    () => {
                        const branchId = localStorage.getItem('gs_branch_id');
                        return branchId
                            ? MOCK_INVENTORY_CATEGORIES.filter(c => c.sucursalId === branchId)
                            : [...MOCK_INVENTORY_CATEGORIES];
                    },
                ),
                withMockFallback(
                    () => api.getMovements(),
                    () => {
                        const branchId = localStorage.getItem('gs_branch_id');
                        return branchId
                            ? MOCK_STOCK_MOVEMENTS.filter(m => m.sucursalId === branchId)
                            : [...MOCK_STOCK_MOVEMENTS];
                    },
                ),
            ]);
            products.value = Array.isArray(prodResponse)
                ? prodResponse
                : ProductAssembler.toEntitiesFromResponse(prodResponse);
            categoriesData.value = Array.isArray(catResponse)
                ? catResponse
                : catResponse?.data?.map?.(r => new InventoryCategory(r)) ?? [];
            movements.value = Array.isArray(movResponse)
                ? movResponse
                : movResponse?.data?.map?.(r => new StockMovement(r)) ?? [];
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar productos';
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedProduct.value = ProductAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al obtener el producto';
        } finally {
            isLoading.value = false;
        }
    }

    async function create(productData) {
        const optimisticId = Math.max(0, ...products.value.map(p => p.id)) + 1;
        const optimistic = new Product({ id: optimisticId, ...productData });
        products.value.push(optimistic);
        try {
            const response = await withMockMutation(
                () => api.create(ProductAssembler.toResourceFromEntity(productData)),
            );
            if (response) {
                const saved = ProductAssembler.toEntityFromResponse(response);
                if (saved?.id) {
                    const idx = products.value.findIndex(p => p.id === optimisticId);
                    if (idx !== -1) products.value.splice(idx, 1, saved);
                }
            }
        } catch (e) {
            products.value = products.value.filter(p => p.id !== optimisticId);
            error.value = e?.response?.data?.message ?? 'Error al crear el producto';
        }
    }

    async function update(id, productData) {
        const snapshot = [...products.value];
        products.value = products.value.map(p =>
            p.id === id ? new Product({ ...p, ...productData, id }) : p
        );
        try {
            await withMockMutation(
                () => api.update(id, ProductAssembler.toResourceFromEntity(productData)),
            );
        } catch (e) {
            products.value = snapshot;
            error.value = e?.response?.data?.message ?? 'Error al actualizar el producto';
        }
    }

    async function remove(id) {
        const snapshot = [...products.value];
        products.value = products.value.filter(p => p.id !== id);
        try {
            await withMockMutation(() => api.delete(id));
        } catch (e) {
            products.value = snapshot;
            error.value = e?.response?.data?.message ?? 'Error al eliminar el producto';
        }
    }

    async function updateStock(id, quantity) {
        const product = products.value.find(p => p.id === id);
        if (!product) return;
        const prevStock = product.stock;
        product.stock = quantity;
        try {
            await withMockMutation(() => api.updateStock(id, quantity));
        } catch (e) {
            product.stock = prevStock;
            error.value = e?.response?.data?.message ?? 'Error al actualizar stock';
        }
    }

    // ── Movement Actions ──────────────────────────────────────────────────
    async function registerMovement(data) {
        const product = products.value.find(p => p.id === data.productId);
        if (!product) return;

        const iamStore = useIamStore();
        const user = iamStore.currentUser;

        const previousStock = product.stock;
        const qty = Number(data.quantity);
        const newStock = data.direction === MOVEMENT_DIRECTION.IN
            ? previousStock + qty
            : Math.max(0, previousStock - qty);

        const optimisticId = Math.max(0, ...movements.value.map(m => m.id)) + 1;
        const movement = new StockMovement({
            id: optimisticId,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            type: data.type,
            direction: data.direction,
            quantity: qty,
            previousStock,
            newStock,
            reason: data.reason ?? '',
            notes: data.notes ?? '',
            userId: user?.id ?? null,
            userName: user?.fullName || user?.username || '',
            sucursalId: product.sucursalId,
        });

        // Optimistic: update stock + push movement
        product.stock = newStock;
        movements.value.push(movement);

        try {
            await withMockMutation(
                () => api.createMovement({
                    product_id: data.productId,
                    type: data.type,
                    direction: data.direction,
                    quantity: qty,
                    reason: data.reason,
                    notes: data.notes,
                }),
            );
        } catch (e) {
            // Rollback
            product.stock = previousStock;
            movements.value = movements.value.filter(m => m.id !== optimisticId);
            error.value = e?.response?.data?.message ?? 'Error al registrar movimiento';
        }
    }

    // ── Category Actions ─────────────────────────────────────────────────
    async function createCategory(data) {
        const optimisticId = Math.max(0, ...categoriesData.value.map(c => c.id)) + 1;
        categoriesData.value.push(new InventoryCategory({ id: optimisticId, ...data }));
        try {
            const response = await withMockMutation(
                () => api.createCategory({ name: data.name, description: data.description, color: data.color, is_active: data.isActive }),
            );
            if (response) {
                const saved = response?.data?.data ?? response?.data;
                if (saved?.id) {
                    const idx = categoriesData.value.findIndex(c => c.id === optimisticId);
                    if (idx !== -1) categoriesData.value.splice(idx, 1, new InventoryCategory({ ...data, id: saved.id }));
                }
            }
        } catch { /* optimistic entry stays */ }
    }

    async function updateCategory(id, data) {
        const snapshot = [...categoriesData.value];
        categoriesData.value = categoriesData.value.map(c =>
            c.id === id ? new InventoryCategory({ ...c, ...data, id }) : c
        );
        // Also update the category name string on products that reference this category
        const updatedCat = categoriesData.value.find(c => c.id === id);
        if (updatedCat) {
            products.value.forEach(p => {
                if (p.categoryId === id) p.category = updatedCat.name;
            });
        }
        try {
            await withMockMutation(
                () => api.updateCategory(id, { name: data.name, description: data.description, color: data.color, is_active: data.isActive }),
            );
        } catch {
            categoriesData.value = snapshot;
        }
    }

    async function removeCategory(id) {
        const snapshot = [...categoriesData.value];
        categoriesData.value = categoriesData.value.filter(c => c.id !== id);
        try {
            await withMockMutation(() => api.deleteCategory(id));
        } catch {
            categoriesData.value = snapshot;
        }
    }

    return {
        products, categoriesData, movements, selectedProduct, isLoading, error,
        searchQuery, filterCategory, filterStatus,
        movementSearch, movementFilterType, movementFilterDirection,
        totalProducts, activeProducts, lowStockProducts, outOfStockProducts, inStockProducts,
        categories, allCategories, totalCategories, categoryNames,
        filteredProducts, totalStockValue,
        totalMovements, entryMovements, exitMovements, filteredMovements,
        fetchAll, fetchById, create, update, remove, updateStock, registerMovement,
        createCategory, updateCategory, removeCategory,
    };
});
