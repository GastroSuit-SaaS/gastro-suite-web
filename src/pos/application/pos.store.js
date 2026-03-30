import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PosApi } from '../infrastructure/api/pos.api.js';
import { SaleAssembler } from '../infrastructure/assemblers/sale.assembler.js';
import { Sale, SALE_STATUS } from '../domain/models/sale.entity.js';
import { SaleItem }          from '../domain/models/sale-item.entity.js';
import { useTablesStore }    from '../../tables/application/tables.store.js';
import { useMenuStore }      from '../../menu/application/menu.store.js';
import { useStationsStore }  from '../../stations/application/stations.store.js';
import { usePaymentsStore }  from '../../payments/application/payments.store.js';

const api = new PosApi();

// ── Mock sales (DEV fallback) ──────────────────────────────────────────────
// Órdenes activas vinculadas a las mesas ocupadas del tables.store mock data
// (Table id:2 → orderId:1201, id:4 → orderId:1215, id:8 → orderId:1246)
const agno = (min) => new Date(Date.now() - min * 60000);

const MOCK_SALES = (() => {
    const s1 = new Sale({
        id: 1201, tableId: 2, zoneId: 1, status: SALE_STATUS.ACTIVE, createdAt: agno(45),
        items: [
            new SaleItem({ id: 9001, menuItemId: 1, menuItemName: 'Ceviche Clásico',   quantity: 1, unitPrice: 28, stationId: 2, stationName: 'Cocina Fría',     isSent: true }),
            new SaleItem({ id: 9002, menuItemId: 2, menuItemName: 'Tequeños de Queso', quantity: 1, unitPrice: 18, stationId: 2, stationName: 'Cocina Fría',     isSent: true }),
        ],
    });
    s1._recalculate(); // subtotal:46  tax:8.28  total:54.28

    const s2 = new Sale({
        id: 1215, tableId: 4, zoneId: 1, status: SALE_STATUS.ACTIVE, createdAt: agno(72),
        items: [
            new SaleItem({ id: 9003, menuItemId: 3, menuItemName: 'Lomo Saltado',      quantity: 2, unitPrice: 45, stationId: 1, stationName: 'Cocina Caliente', isSent: true  }),
            new SaleItem({ id: 9004, menuItemId: 6, menuItemName: 'Pasta Alfredo',     quantity: 1, unitPrice: 32, stationId: 5, stationName: 'Pastas',          isSent: true  }),
            new SaleItem({ id: 9005, menuItemId: 2, menuItemName: 'Tequeños de Queso', quantity: 3, unitPrice: 18, stationId: 2, stationName: 'Cocina Fría',     isSent: false }),
        ],
    });
    s2._recalculate(); // subtotal:176  tax:31.68  total:207.68 (3 tequeños pendientes de enviar)

    const s3 = new Sale({
        id: 1246, tableId: 8, zoneId: 2, status: SALE_STATUS.ACTIVE, createdAt: agno(38),
        items: [
            new SaleItem({ id: 9006, menuItemId: 4, menuItemName: 'Pollo a la Brasa',  quantity: 1, unitPrice: 52, stationId: 1, stationName: 'Cocina Caliente', isSent: true }),
            new SaleItem({ id: 9007, menuItemId: 1, menuItemName: 'Ceviche Clásico',   quantity: 1, unitPrice: 28, stationId: 2, stationName: 'Cocina Fría',     isSent: true }),
        ],
    });
    s3._recalculate(); // subtotal:80  tax:14.40  total:94.40

    return [s1, s2, s3];
})();

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
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getAll();
            sales.value = SaleAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            if (import.meta.env.DEV && sales.value.length === 0) {
                sales.value = [...MOCK_SALES];
            } else if (!import.meta.env.DEV) {
                error.value = e?.response?.data?.message ?? 'Error al cargar las órdenes';
            }
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            const sale = SaleAssembler.toEntityFromResponse(response);
            const idx  = sales.value.findIndex(s => s.id === id);
            if (idx !== -1) sales.value.splice(idx, 1, sale);
            else sales.value.push(sale);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar la orden';
        } finally {
            isLoading.value = false;
        }
    }

    async function create(sale) {
        try {
            const response = await api.create(SaleAssembler.toResourceFromEntity(sale));
            if (response.status === 201 || response.status === 200) {
                const saved = SaleAssembler.toEntityFromResponse(response);
                if (saved?.id) {
                    // Replace the optimistic/temp sale with the persisted one
                    const idx = sales.value.findIndex(s => s.id === sale.id);
                    if (idx !== -1) sales.value.splice(idx, 1, saved);
                    if (currentSale.value?.id === sale.id) currentSale.value = saved;
                }
            }
        } catch { /* keep optimistic sale — retry on next sync */ }
    }

    async function update(id, sale) {
        try {
            await api.update(id, SaleAssembler.toResourceFromEntity(sale));
        } catch { /* local state kept */ }
    }

    async function remove(id) {
        sales.value = sales.value.filter(s => s.id !== id);
        try {
            await api.delete(id);
        } catch { /* local change kept */ }
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
            // Use a temporary negative ID — replaced with backend ID after api.create()
            const tempId  = -(Date.now());
            const newSale = new Sale({ id: tempId, tableId, zoneId, status: SALE_STATUS.ACTIVE });
            sales.value.push(newSale);
            currentSale.value = newSale;
            currentSaleIsRecovered.value = false;
            tablesStore.assignTable(tableId, seatedGuests);
            // Persist to backend — replaces tempId with real backend ID
            create(newSale);
        }
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

    function updateOrderDiscount(type, value) {
        if (!currentSale.value) return;
        currentSale.value.updateOrderDiscount(type, value);
    }

    function clearOrderDiscount() {
        if (!currentSale.value) return;
        currentSale.value.clearOrderDiscount();
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
        updateItemQuantity, updateItemNote, updateItemDiscount, updateOrderDiscount, clearOrderDiscount, duplicateItemInCurrentSale,
        sendCurrentSaleToStations, cancelCurrentSale, confirmPayment,
        // Catálogo
        setCatalogCategory, setCatalogSearch,
    };
});
