import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryApi } from '../infrastructure/api/inventory.api.js';
import { ProductAssembler } from '../infrastructure/assemblers/product.assembler.js';
import { InventoryCategoryAssembler } from '../infrastructure/assemblers/inventory-category.assembler.js';
import { StockMovementAssembler } from '../infrastructure/assemblers/stock-movement.assembler.js';
import { INVENTORY_MESSAGES } from '../presentation/constants/inventory.constants-ui.js';
import { Product, STOCK_STATUS } from '../domain/models/product.entity.js';
import { InventoryCategory } from '../domain/models/inventory-category.entity.js';
import { StockMovement, MOVEMENT_TYPE, MOVEMENT_DIRECTION } from '../domain/models/stock-movement.entity.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';
import { useIamStore } from '../../iam/application/iam.store.js';

const api = new InventoryApi();

export const useInventoryStore = defineStore('inventory', () => {

    const products        = ref([]);
    const categoriesData  = ref([]);
    const movements       = ref([]);
    const selectedProduct = ref(null);
    const isLoading       = ref(false);
    const error           = ref(null);
    const searchQuery     = ref('');
    const filterCategory  = ref(null);
    const filterStatus    = ref(null);
    const movementSearch  = ref('');
    const movementFilterType      = ref(null);
    const movementFilterDirection = ref(null);

    const totalProducts  = computed(() => products.value.length);
    const activeProducts = computed(() => products.value.filter(p => p.isActive));
    const lowStockProducts  = computed(() => products.value.filter(p => p.stockStatus === STOCK_STATUS.LOW_STOCK));
    const outOfStockProducts = computed(() => products.value.filter(p => p.stockStatus === STOCK_STATUS.OUT_OF_STOCK));
    const inStockProducts    = computed(() => products.value.filter(p => p.stockStatus === STOCK_STATUS.IN_STOCK));

    const categories = computed(() => {
        const countMap = {};
        products.value.forEach(p => {
            if (p.categoryId) countMap[p.categoryId] = (countMap[p.categoryId] ?? 0) + 1;
        });
        return categoriesData.value
            .filter(c => c.isActive)
            .map(c => new InventoryCategory({ ...c, count: countMap[c.id] ?? 0 }));
    });

    const allCategories = computed(() => {
        const countMap = {};
        products.value.forEach(p => {
            if (p.categoryId) countMap[p.categoryId] = (countMap[p.categoryId] ?? 0) + 1;
        });
        return categoriesData.value
            .map(c => new InventoryCategory({ ...c, count: countMap[c.id] ?? 0 }));
    });

    const totalCategories = computed(() => categories.value.length);

    const categorySelectOptions = computed(() =>
        categories.value.map(c => ({ label: c.name, value: c.id })),
    );

    const filteredProducts = computed(() => {
        let list = products.value;

        if (filterStatus.value) {
            list = list.filter(p => p.stockStatus === filterStatus.value);
        }

        if (filterCategory.value) {
            list = list.filter(p => String(p.categoryId) === String(filterCategory.value));
        }

        const q = searchQuery.value.trim().toLowerCase();
        if (q) {
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.description ?? '').toLowerCase().includes(q) ||
                (p.category ?? '').toLowerCase().includes(q),
            );
        }

        return list;
    });

    const totalStockValue = computed(() =>
        products.value.reduce((sum, p) => sum + (p.cost * p.stock), 0),
    );

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
                (m.userName ?? '').toLowerCase().includes(q) ||
                (m.notes ?? '').toLowerCase().includes(q) ||
                (m.reason ?? '').toLowerCase().includes(q),
            );
        }

        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const branchId = requireActiveBranchId();
            const [prodResponse, catResponse, movResponse] = await Promise.all([
                api.listProductsByBranch(branchId),
                api.listCategoriesByBranch(branchId),
                api.listMovementsByBranch(branchId),
            ]);
            products.value = ProductAssembler.toEntitiesFromResponse(prodResponse);
            categoriesData.value = InventoryCategoryAssembler.toEntitiesFromResponse(catResponse);
            movements.value = StockMovementAssembler.toEntitiesFromResponse(movResponse);
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, INVENTORY_MESSAGES.ERROR_LOADING);
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getProductById(id);
            selectedProduct.value = ProductAssembler.toEntityFromResponse(response);
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al obtener el producto');
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function create(productData) {
        const categoryId = ProductAssembler.resolveCategoryId(productData, categoriesData.value);
        if (!categoryId) {
            error.value = 'Selecciona una categoría de inventario válida.';
            return false;
        }

        error.value = null;
        try {
            const response = await api.createProduct(
                ProductAssembler.toCreateResource(
                    { ...productData, categoryId },
                    { categories: categoriesData.value },
                ),
            );
            const saved = ProductAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                products.value.push(saved);
            } else {
                await fetchAll();
            }
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al crear el producto');
            return false;
        }
    }

    async function update(id, productData) {
        error.value = null;
        const snapshot = [...products.value];
        try {
            const response = await api.updateProduct(
                id,
                ProductAssembler.toUpdateResource(productData, {
                    categories: categoriesData.value,
                    includeStock: false,
                }),
            );
            const saved = ProductAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                products.value = products.value.map(p => (p.id === id ? saved : p));
            } else {
                products.value = products.value.map(p =>
                    p.id === id ? new Product({ ...p, ...productData, id }) : p,
                );
            }
            return true;
        } catch (e) {
            products.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al actualizar el producto');
            return false;
        }
    }

    async function remove(id) {
        error.value = null;
        const snapshot = [...products.value];
        products.value = products.value.filter(p => p.id !== id);
        try {
            await api.deleteProduct(id);
            return true;
        } catch (e) {
            products.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al eliminar el producto');
            return false;
        }
    }

    function _currentRegistrarName() {
        const user = useIamStore().currentUser;
        if (!user) return '';
        return user.fullName || [user.nombres, user.apellidos].filter(Boolean).join(' ').trim() || user.username || '';
    }

    async function _ensureEmployeeForMovement() {
        const iamStore = useIamStore();
        let employeeId = iamStore.currentUser?.employeeId ?? null;
        if (!employeeId) {
            await iamStore.ensureEmployeeLink();
            employeeId = iamStore.currentUser?.employeeId ?? null;
        }
        if (!employeeId) {
            error.value = iamStore.employeeLinkMessage ?? INVENTORY_MESSAGES.EMPLOYEE_LINK_REQUIRED;
            return null;
        }
        return employeeId;
    }

    async function registerMovement(data) {
        const product = products.value.find(p => p.id === data.productId);
        if (!product) {
            error.value = 'Producto no encontrado.';
            return false;
        }

        const employeeId = await _ensureEmployeeForMovement();
        if (!employeeId) return false;

        const registrarName = _currentRegistrarName();
        const previousStock = product.stock;
        const qty = Number(data.quantity);
        if (!qty || qty <= 0) {
            error.value = 'La cantidad debe ser mayor a cero.';
            return false;
        }

        const newStock = data.direction === MOVEMENT_DIRECTION.IN
            ? previousStock + qty
            : Math.max(0, previousStock - qty);

        const optimisticId = `opt-${Date.now()}`;
        movements.value.unshift(new StockMovement({
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
            employeeId,
            userName: registrarName,
            sucursalId: product.sucursalId,
        }));

        product.stock = newStock;
        error.value = null;

        try {
            const response = await api.createMovement(
                StockMovementAssembler.toCreateResource(data, { employeeId }),
            );
            const saved = StockMovementAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                movements.value = movements.value.map(m =>
                    m.id === optimisticId ? saved : m,
                );
                const refreshed = products.value.find(p => p.id === product.id);
                if (refreshed && saved.newStock != null) {
                    refreshed.stock = saved.newStock;
                }
            } else {
                await fetchAll();
            }
            return true;
        } catch (e) {
            product.stock = previousStock;
            movements.value = movements.value.filter(m => m.id !== optimisticId);
            error.value = getApiErrorMessage(e, 'Error al registrar movimiento');
            return false;
        }
    }

    async function updateMovement(id, data) {
        error.value = null;
        try {
            const response = await api.updateMovement(
                id,
                StockMovementAssembler.toUpdateResource(data),
            );
            const saved = StockMovementAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                movements.value = movements.value.map(m => m.id === id ? saved : m);
            }
            await fetchAll();
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al actualizar movimiento');
            return false;
        }
    }

    async function removeMovement(id) {
        error.value = null;
        const snapshot = [...movements.value];
        movements.value = movements.value.filter(m => m.id !== id);
        try {
            await api.deleteMovement(id);
            await fetchAll();
            return true;
        } catch (e) {
            movements.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al eliminar movimiento');
            return false;
        }
    }

    async function createCategory(data) {
        error.value = null;
        try {
            const branchId = requireActiveBranchId();
            const response = await api.createCategory(
                InventoryCategoryAssembler.toCreateResource(
                    new InventoryCategory(data),
                    branchId,
                    categoriesData.value,
                ),
            );
            const saved = InventoryCategoryAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                categoriesData.value.push(saved);
            } else {
                await fetchAll();
            }
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al crear la categoría');
            return false;
        }
    }

    async function updateCategory(id, data) {
        error.value = null;
        const snapshot = [...categoriesData.value];
        try {
            const response = await api.updateCategory(
                id,
                InventoryCategoryAssembler.toUpdateResource(new InventoryCategory({ ...data, id })),
            );
            const saved = InventoryCategoryAssembler.toEntityFromResponse(response);
            if (saved?.id) {
                categoriesData.value = categoriesData.value.map(c => (c.id === id ? saved : c));
                products.value.forEach(p => {
                    if (String(p.categoryId) === String(id)) p.category = saved.name;
                });
            } else {
                categoriesData.value = categoriesData.value.map(c =>
                    c.id === id ? new InventoryCategory({ ...c, ...data, id }) : c,
                );
            }
            return true;
        } catch (e) {
            categoriesData.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al actualizar la categoría');
            return false;
        }
    }

    async function removeCategory(id) {
        error.value = null;
        const snapshot = [...categoriesData.value];
        categoriesData.value = categoriesData.value.filter(c => c.id !== id);
        try {
            await api.deleteCategory(id);
            return true;
        } catch (e) {
            categoriesData.value = snapshot;
            error.value = getApiErrorMessage(e, 'Error al eliminar la categoría');
            return false;
        }
    }

    return {
        products, categoriesData, movements, selectedProduct, isLoading, error,
        searchQuery, filterCategory, filterStatus,
        movementSearch, movementFilterType, movementFilterDirection,
        totalProducts, activeProducts, lowStockProducts, outOfStockProducts, inStockProducts,
        categories, allCategories, totalCategories, categorySelectOptions,
        filteredProducts, totalStockValue,
        totalMovements, entryMovements, exitMovements, filteredMovements,
        fetchAll, fetchById, create, update, remove, registerMovement, updateMovement, removeMovement,
        createCategory, updateCategory, removeCategory,
    };
});
