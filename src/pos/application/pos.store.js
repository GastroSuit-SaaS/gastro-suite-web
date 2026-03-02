import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PosApi } from '../infrastructure/api/pos.api.js';
// SaleAssembler: reserved for API integration (fetchAll / create / update)
// import { SaleAssembler } from '../infrastructure/assemblers/sale.assembler.js';
import { Sale, SALE_STATUS } from '../domain/models/sale.entity.js';
import { useTablesStore } from '../../tables/application/tables.store.js';
import { useMenuStore }   from '../../menu/application/menu.store.js';

const api = new PosApi();

export const usePosStore = defineStore('pos', () => {

    // ── Stores externos ───────────────────────────────────────────────────
    const tablesStore = useTablesStore();
    const menuStore   = useMenuStore();

    // ── State ─────────────────────────────────────────────────────────────
    const sales                   = ref([]);
    const currentSale             = ref(null);
    const currentSaleIsRecovered  = ref(false); // true si la orden ya existía (Pendiente)
    const isLoading               = ref(false);
    const error                   = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const activeOrders   = computed(() => sales.value.filter(s => s.status === SALE_STATUS.ACTIVE));
    const totalInProcess = computed(() => activeOrders.value.reduce((sum, s) => sum + s.total, 0));
    const currentTotal   = computed(() => currentSale.value?.total ?? 0);

    // Catálogo — delegado al módulo de menú (fuente de verdad)
    // filteredCatalog filtra además por isAvailable: el POS solo ofrece ítems disponibles
    const menuCategories  = computed(() => menuStore.categories);
    const filteredCatalog = computed(() => menuStore.filteredItems.filter(i => i.isAvailable));
    const catalogSearch   = computed(() => menuStore.searchQuery);
    const catalogCategory = computed(() => menuStore.selectedCategoryId);

    function setCatalogSearch(q) {
        menuStore.searchQuery = q;
    }
    function setCatalogCategory(categoryId) {
        menuStore.selectedCategoryId = categoryId === null ? null : categoryId;
    }

    // Delegación de Tables — POS accede a zonas y mesas a través de su propio store
    const zones          = computed(() => tablesStore.zones);
    const occupiedTables = computed(() => tablesStore.occupiedTables);
    function tablesForZone(zoneId) {
        return tablesStore.tables.filter(t => t.zoneId === zoneId);
    }
    function tableById(id) {
        return tablesStore.tables.find(t => t.id === id) ?? null;
    }
    function zoneById(id) {
        return tablesStore.zones.find(z => z.id === id) ?? null;
    }
    function saleByTableId(tableId) {
        return sales.value.find(
            s => s.tableId === tableId && s.status === SALE_STATUS.ACTIVE
        ) ?? null;
    }

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        // TODO: call api.getAll(), transform via SaleAssembler.toEntitiesFromResponse
    }

    async function fetchById(id) {
        // TODO: call api.getById(id), transform via SaleAssembler.toEntityFromResource
    }

    async function create(sale) {
        // TODO: call api.create(sale), set as currentSale
    }

    async function update(id, sale) {
        // TODO: call api.update(id, sale), refresh list
    }

    async function remove(id) {
        // TODO: call api.delete(id), refresh list
    }

    /**
     * Inicia o recupera la venta activa asociada a una mesa.
     * Si la mesa ya tiene una orden activa la asigna como currentSale;
     * si no, crea una nueva Sale en estado ACTIVE y marca la mesa como ocupada.
     */
    function openSaleForTable(tableId, zoneId) {
        const existing = sales.value.find(
            s => s.tableId === tableId && s.status === SALE_STATUS.ACTIVE
        );
        if (existing) {
            currentSale.value = existing;
            currentSaleIsRecovered.value = true;
        } else {
            const id      = 1200 + sales.value.length + 1;
            const newSale = new Sale({ id, tableId, zoneId, status: SALE_STATUS.ACTIVE });
            sales.value.push(newSale);
            currentSale.value = newSale;
            currentSaleIsRecovered.value = false;
            tablesStore.setTableStatus(tableId, 'occupied');
        }
        // TODO: persist via api.create / api.getByTableId
    }

    // ── Orden actual — gestión de ítems ──────────────────────────────────

    function addItemToCurrentSale(menuItem) {
        if (!currentSale.value) return;
        currentSale.value.addItem(menuItem);
    }

    function removeItemFromCurrentSale(itemId) {
        if (!currentSale.value) return;
        currentSale.value.removeItem(itemId);
    }

    function updateItemQuantity(itemId, qty) {
        if (!currentSale.value) return;
        currentSale.value.updateQuantity(itemId, qty);
    }

    function updateItemNote(itemId, note) {
        if (!currentSale.value) return;
        currentSale.value.updateNote(itemId, note);
    }

    function updateItemDiscount(itemId, type, value) {
        if (!currentSale.value) return;
        currentSale.value.updateDiscount(itemId, type, value);
    }

    function duplicateItemInCurrentSale(itemId) {
        if (!currentSale.value) return;
        currentSale.value.duplicateItem(itemId);
    }

    return {
        // State
        sales, currentSale, currentSaleIsRecovered, isLoading, error,
        catalogSearch, catalogCategory,
        // Getters
        activeOrders, totalInProcess, currentTotal,
        menuCategories, filteredCatalog,
        zones, occupiedTables, tablesForZone, tableById, zoneById, saleByTableId,
        // Sale CRUD
        fetchAll, fetchById, create, update, remove,
        // Orden
        openSaleForTable,
        addItemToCurrentSale, removeItemFromCurrentSale,
        updateItemQuantity, updateItemNote, updateItemDiscount, duplicateItemInCurrentSale,
        // Catálogo
        setCatalogCategory, setCatalogSearch,
    };
});
