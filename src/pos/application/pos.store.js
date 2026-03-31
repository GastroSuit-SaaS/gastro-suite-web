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
import { useIamStore }       from '../../iam/application/iam.store.js';
import { MOCK_SALES }        from '../infrastructure/pos.mock.js';

const api = new PosApi();

export const usePosStore = defineStore('pos', () => {

    // ── Stores externos ───────────────────────────────────────────────────
    const tablesStore    = useTablesStore();
    const menuStore      = useMenuStore();    const iamStore       = useIamStore();
    // ── State ─────────────────────────────────────────────────────────────
    const sales                   = ref([]);
    const currentSale             = ref(null);
    const currentSaleIsRecovered  = ref(false); // true si la orden ya existía (Pendiente)
    const isLoading               = ref(false);
    const error                   = ref(null);
    const _posSearch              = ref('');
    const _posCategoryId          = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const activeOrders   = computed(() => sales.value.filter(s => s.status === SALE_STATUS.ACTIVE));
    const totalInProcess = computed(() => activeOrders.value.reduce((sum, s) => sum + s.total, 0));
    const currentTotal   = computed(() => currentSale.value?.total ?? 0);

    // Catálogo — filtrado local; POS gestiona su propio search/category sin mutar menuStore
    const menuCategories  = computed(() => menuStore.categories);
    const filteredCatalog = computed(() => {
        const q    = _posSearch.value.trim().toLowerCase();
        const catId = _posCategoryId.value;
        return menuStore.items.filter(i => {
            if (!i.isAvailable) return false;
            if (catId !== null && i.categoryId !== catId) return false;
            if (q && !i.name.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q)) return false;
            return true;
        });
    });
    const catalogSearch   = computed(() => _posSearch.value);
    const catalogCategory = computed(() => _posCategoryId.value);

    function setCatalogSearch(q) {
        _posSearch.value = q;
    }
    function setCatalogCategory(categoryId) {
        _posCategoryId.value = categoryId === null ? null : categoryId;
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
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                const branchId = localStorage.getItem('gs_branch_id');
                sales.value = branchId ? MOCK_SALES.filter(s => s.sucursalId === branchId) : [...MOCK_SALES];
                await Promise.all([tablesStore.fetchAll(), menuStore.fetchAll()]);
                return;
            }
            await Promise.all([
                api.getAll().then(response => {
                    sales.value = SaleAssembler.toEntitiesFromResponse(response);
                }),
                tablesStore.fetchAll(),
                menuStore.fetchAll(),
            ]);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar las órdenes';
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
        const snapshot = [...sales.value];
        sales.value = sales.value.filter(s => s.id !== id);
        try {
            await api.delete(id);
        } catch {
            if (import.meta.env.VITE_USE_MOCK === 'true') return;
            sales.value = snapshot;
        }
    }

    /**
     * Inicia o recupera la venta activa asociada a una mesa.
     * Si la mesa ya tiene una orden activa la asigna como currentSale;
     * si no, crea una nueva Sale en estado ACTIVE y marca la mesa como ocupada.
     */
    async function openSaleForTable(tableId, zoneId, seatedGuests = 0) {
        const existing = sales.value.find(
            s => s.tableId === tableId && s.status === SALE_STATUS.ACTIVE
        );
        if (existing) {
            currentSale.value = existing;
            currentSaleIsRecovered.value = true;
        } else {
            // Use a temporary negative ID — replaced with backend ID after api.create()
            const tempId  = -(Date.now());
            const newSale = new Sale({ id: tempId, tableId, zoneId, status: SALE_STATUS.ACTIVE, cashierId: iamStore.currentUser?.id ?? null });
            sales.value.push(newSale);
            currentSale.value = newSale;
            currentSaleIsRecovered.value = false;
            await tablesStore.assignTable(tableId, seatedGuests);
            // Persist to backend — await ensures real ID is set before any dispatch to stations
            try {
                await create(newSale);
            } catch {
                // Rollback: remove the optimistic sale and restore table to AVAILABLE
                // (table was never truly occupied with an order)
                sales.value = sales.value.filter(s => s.id !== tempId);
                currentSale.value = null;
                currentSaleIsRecovered.value = false;
                const rollbackTable = tablesStore.tables.find(t => t.id === tableId);
                if (rollbackTable) {
                    rollbackTable.seatedGuests  = 0;
                    rollbackTable.occupiedSince = null;
                }
                tablesStore.setTableStatus(tableId, 'available');
                throw new Error('No se pudo crear la orden. Por favor intenta de nuevo.');
            }
        }
    }

    // ── Orden actual — gestión de ítems ──────────────────────────────────

    function addItemToCurrentSale(menuItem) {
        if (!currentSale.value) return;
        currentSale.value.addItem(menuItem);
    }

    function removeItemFromCurrentSale(itemId) {
        if (!currentSale.value) return;
        const item = currentSale.value.items.find(i => i.id === itemId);
        if (item?.isSent) {
            const stationsStore = useStationsStore();
            stationsStore.notifyItemCancelled(currentSale.value.id, item.menuItemId);
        }
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
    async function sendCurrentSaleToStations() {
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
        // Persist updated isSent flags to backend — mark AFTER ACK
        try {
            pending.forEach(item => { item.isSent = true; });
            await api.update(currentSale.value.id, SaleAssembler.toResourceFromEntity(currentSale.value));
        } catch {
            // Rollback: mark items as NOT sent so next attempt re-dispatches them
            pending.forEach(item => { item.isSent = false; });
        }
        return pending.length;
    }

    /**
     * Cancela la orden activa: marca como CANCELLED y libera la mesa.
     */
    async function cancelCurrentSale() {
        if (!currentSale.value) return;
        const saleId  = currentSale.value.id;
        const tableId = currentSale.value.tableId;
        currentSale.value.status = SALE_STATUS.CANCELLED;
        tablesStore.freeTable(tableId);
        currentSale.value = null;
        currentSaleIsRecovered.value = false;
        // Persist cancellation — fire-and-forget, local state already updated
        try {
            await api.cancel(saleId);
        } catch { /* local state kept */ }
    }

    /**
     * Confirma el cobro de la orden activa.
     * Registra el pago en el módulo de pagos, marca la venta como PAID,
     * libera la mesa y limpia el estado local.
     * @param {{ method: string, amountReceived: number, receiptType: string, receiptData: object }} paymentData
     * @returns {boolean}
     */
    async function confirmPayment({ method, amountReceived, receiptType, receiptData }) {
        if (!currentSale.value) return false;
        const sale    = currentSale.value;
        const saleId  = sale.id;
        const tableId = sale.tableId;
        const table   = tablesStore.tables.find(t => t.id === tableId);
        const zone    = tablesStore.zones.find(z => z.id === sale.zoneId);

        // 1. Saga: persistir PAID en backend PRIMERO (punto de commit)
        try {
            await api.pay(saleId, { method, amountReceived, receiptType });
        } catch {
            if (import.meta.env.VITE_USE_MOCK !== 'true') return false;
            // Mock mode: continuar sin confirmación del backend
        }

        // 2. Backend confirmó — actualizar estado local
        sale.status = SALE_STATUS.PAID;
        try {
            tablesStore.freeTable(tableId);
        } catch {
            // Mesa no se pudo liberar — el pago ya fue registrado en backend.
            // Se resolverá en el próximo fetchAll o manualmente.
            console.warn(`[POS] freeTable(${tableId}) falló tras confirmar pago de venta ${saleId}`);
        }
        currentSale.value = null;
        currentSaleIsRecovered.value = false;

        // 3. Registrar pago en módulo de pagos (fire-and-forget para UI)
        const paymentsStore = usePaymentsStore();
        paymentsStore.registerPayment({
            saleId,
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
