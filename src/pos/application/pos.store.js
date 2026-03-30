import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PosApi } from '../infrastructure/api/pos.api.js';
// SaleAssembler: reserved for API integration (fetchAll / create / update)
// import { SaleAssembler } from '../infrastructure/assemblers/sale.assembler.js';
import { Sale, SALE_STATUS } from '../domain/models/sale.entity.js';
import { useTablesStore }    from '../../tables/application/tables.store.js';
import { useMenuStore }      from '../../menu/application/menu.store.js';
import { useStationsStore }  from '../../stations/application/stations.store.js';
import { usePaymentsStore }  from '../../payments/application/payments.store.js';

const api = new PosApi();

export const usePosStore = defineStore('pos', () => {

    // ── Stores externos ───────────────────────────────────────────────────
    const tablesStore    = useTablesStore();
    const menuStore      = useMenuStore();

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
    function openSaleForTable(tableId, zoneId, seatedGuests = 0) {
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
            tablesStore.assignTable(tableId, seatedGuests);
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

    /**
     * Envía a las estaciones de cocina únicamente los ítems que todavía no
     * fueron enviados (isSent === false). Tras el envío los marca como enviados
     * para que rondas posteriores solo despachen el delta nuevo.
     * @returns {number} Cantidad de ítems despachados (0 si no había nada pendiente)
     */
    function sendCurrentSaleToStations() {
        if (!currentSale.value) return 0;
        const pending = currentSale.value.items.filter(i => !i.isSent);
        if (pending.length === 0) return 0;
        // Lazy call — se llama dentro de la acción para evitar problemas de
        // orden de inicialización entre stores en Pinia
        const stationsStore = useStationsStore();
        const table = tablesStore.tables.find(t => t.id === currentSale.value.tableId);
        stationsStore.sendSaleToStations(
            { id: currentSale.value.id, items: pending },
            table?.number ?? null,
        );
        pending.forEach(item => { item.isSent = true; });
        // TODO: persist via api.update(currentSale.value.id, ...)
        return pending.length;
    }

    /**
     * Cancela la orden activa: marca como CANCELLED y libera la mesa.
     */
    function cancelCurrentSale() {
        if (!currentSale.value) return;
        const tableId = currentSale.value.tableId;
        currentSale.value.status = SALE_STATUS.CANCELLED;
        tablesStore.freeTable(tableId);
        currentSale.value = null;
        currentSaleIsRecovered.value = false;
        // TODO: persist via api.cancel(sale.id)
    }

    /**
     * Confirma el cobro de la orden activa.
     * Registra el pago en el módulo de pagos, marca la venta como PAID,
     * libera la mesa y limpia el estado local.
     * @param {{ method: string, amountReceived: number, receiptType: string, receiptData: object }} paymentData
     * @returns {boolean}
     */
    function confirmPayment({ method, amountReceived, receiptType, receiptData }) {
        if (!currentSale.value) return false;
        const sale    = currentSale.value;
        const tableId = sale.tableId;
        const table   = tablesStore.tables.find(t => t.id === tableId);
        const zone    = tablesStore.zones.find(z => z.id === sale.zoneId);

        // Registrar en el módulo de pagos (lazy — evita problemas de orden de init)
        const paymentsStore = usePaymentsStore();
        paymentsStore.registerPayment({
            saleId:         sale.id,
            tableNumber:    table?.number ?? null,
            zoneName:       zone?.name   ?? null,
            items:          sale.items.map(i => ({
                name:     i.menuItemName,
                qty:      i.quantity,
                subtotal: i.subtotal,
            })),
            subtotal:       sale.subtotal,
            tax:            sale.tax,
            discount:       sale.discount,
            total:          sale.total,
            method,
            amountReceived,
            change:         parseFloat((amountReceived - sale.total).toFixed(2)),
            receiptType,
            receiptData,
        });

        sale.status = SALE_STATUS.PAID;
        tablesStore.freeTable(tableId);
        currentSale.value = null;
        currentSaleIsRecovered.value = false;
        return true;
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
        sendCurrentSaleToStations, cancelCurrentSale, confirmPayment,
        // Catálogo
        setCatalogCategory, setCatalogSearch,
    };
});
