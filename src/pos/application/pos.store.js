import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PosApi } from '../infrastructure/api/pos.api.js';
import { SaleAssembler } from '../infrastructure/assemblers/sale.assembler.js';
import { Sale, SALE_STATUS, SALE_TYPE } from '../domain/models/sale.entity.js';
import { SaleItem }          from '../domain/models/sale-item.entity.js';
import { useTablesStore }    from '../../tables/application/tables.store.js';
import { useMenuStore }      from '../../menu/application/menu.store.js';
import { useStationsStore }  from '../../stations/application/stations.store.js';
import { usePaymentsStore }  from '../../payments/application/payments.store.js';
import { useIamStore }       from '../../iam/application/iam.store.js';
import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';
import { MOCK_SALES }        from '../infrastructure/pos.mock.js';

const api = new PosApi();
const _isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const usePosStore = defineStore('pos', () => {

    // ── Stores externos ───────────────────────────────────────────────────
    const tablesStore       = useTablesStore();
    const menuStore         = useMenuStore();
    const iamStore          = useIamStore();
    const cashRegisterStore = useCashRegisterStore();
    // ── State ─────────────────────────────────────────────────────────────
    const sales                   = ref([]);
    const currentSale             = ref(null);
    const currentSaleIsRecovered  = ref(false); // true si la orden ya existía (Pendiente)
    const isLoading               = ref(false);
    const error                   = ref(null);
    const _posSearch              = ref('');
    const _posCategoryId          = ref(null);
    const _takeawayCounter        = ref(0);     // Correlativo diario para tickets para llevar

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
                // Solo cargar mock data la primera vez; las mutaciones locales son fuente de verdad
                if (sales.value.length === 0) {
                    const branchId = localStorage.getItem('gs_branch_id');
                    sales.value = branchId ? MOCK_SALES.filter(s => s.sucursalId === branchId) : [...MOCK_SALES];
                }
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
        if (_isMock) return;
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
        if (_isMock) return;
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
        if (_isMock) return;
        try {
            await api.update(id, SaleAssembler.toResourceFromEntity(sale));
        } catch { /* local state kept */ }
    }

    async function remove(id) {
        const snapshot = [...sales.value];
        sales.value = sales.value.filter(s => s.id !== id);
        if (_isMock) return;
        try {
            await api.delete(id);
        } catch {
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

    /**
     * Crea una nueva venta para llevar (sin mesa ni zona).
     * Asigna un ticketNumber correlativo y opcionalmente un nombre de cliente.
     * @param {string} [customerName='']
     * @returns {Sale} La venta creada
     */
    async function openTakeawaySale(customerName = '') {
        _takeawayCounter.value += 1;
        const tempId  = -(Date.now());
        const newSale = new Sale({
            id:           tempId,
            tableId:      null,
            zoneId:       null,
            saleType:     SALE_TYPE.TAKEAWAY,
            customerName,
            ticketNumber: _takeawayCounter.value,
            status:       SALE_STATUS.ACTIVE,
            cashierId:    iamStore.currentUser?.id ?? null,
            sucursalId:   iamStore.activeBranchId ?? null,
        });
        sales.value.push(newSale);
        currentSale.value = newSale;
        currentSaleIsRecovered.value = false;
        try {
            await create(newSale);
        } catch {
            sales.value = sales.value.filter(s => s.id !== tempId);
            currentSale.value = null;
            currentSaleIsRecovered.value = false;
            throw new Error('No se pudo crear la orden para llevar. Por favor intenta de nuevo.');
        }
        return newSale;
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
        // Asegurar que estaciones estén cargadas antes de despachar;
        // si no, fetchAll() posterior sobrescribiría los tickets nuevos.
        await stationsStore.fetchAll();
        const sale = currentSale.value;
        const tableLabel = sale.isTakeaway
            ? `PLL #${sale.ticketNumber}${sale.customerName ? ` (${sale.customerName})` : ''}`
            : (tablesStore.tables.find(t => t.id === sale.tableId)?.number ?? null);
        stationsStore.sendSaleToStations(
            { id: sale.id, items: pending, sucursalId: sale.sucursalId },
            tableLabel,
        );
        // Mark items as sent locally
        pending.forEach(item => { item.isSent = true; });
        // Persist updated isSent flags to backend
        if (!_isMock) {
            try {
                await api.update(currentSale.value.id, SaleAssembler.toResourceFromEntity(currentSale.value));
            } catch {
                // Rollback: mark items as NOT sent so next attempt re-dispatches them
                pending.forEach(item => { item.isSent = false; });
            }
        }
        return pending.length;
    }

    /**
     * Cancela la orden activa: marca como CANCELLED y libera la mesa (solo dine-in).
     */
    async function cancelCurrentSale() {
        if (!currentSale.value) return;
        const saleId  = currentSale.value.id;
        const tableId = currentSale.value.tableId;
        currentSale.value.status = SALE_STATUS.CANCELLED;
        if (!currentSale.value.isTakeaway && tableId) {
            tablesStore.freeTable(tableId);
        }
        currentSale.value = null;
        currentSaleIsRecovered.value = false;
        // Persist cancellation — fire-and-forget, local state already updated
        if (!_isMock) {
            try {
                await api.cancel(saleId);
            } catch { /* local state kept */ }
        }
    }

    /**
     * Transfiere la orden activa de una mesa a otra.
     * Libera la mesa origen y ocupa la mesa destino.
     *
     * @param {number} newTableId  - ID de la nueva mesa
     * @param {number|null} newZoneId - ID de la nueva zona (detectado si null)
     * @returns {boolean}
     */
    async function transferSale(newTableId, newZoneId = null) {
        if (!currentSale.value) return false;

        const sale       = currentSale.value;
        const oldTableId = sale.tableId;
        const oldZoneId  = sale.zoneId;

        // No transferir a la misma mesa
        if (newTableId === oldTableId) return false;

        // Verificar que la mesa destino no tenga una orden activa
        const existingSale = sales.value.find(
            s => s.tableId === newTableId && s.status === SALE_STATUS.ACTIVE
        );
        if (existingSale) {
            error.value = 'La mesa destino ya tiene una orden activa.';
            return false;
        }

        // Detectar zona de la mesa destino si no se proporcionó
        const destTable = tablesStore.tables.find(t => t.id === newTableId);
        const resolvedZoneId = newZoneId ?? destTable?.zoneId ?? oldZoneId;

        // 1. Actualizar entidad de dominio
        sale.transferToTable(newTableId, resolvedZoneId);

        // 2. Liberar mesa origen → ocupar mesa destino
        tablesStore.freeTable(oldTableId);
        tablesStore.assignTable(newTableId, destTable?.seatedGuests || 0);

        // 3. Persistir al backend
        if (!_isMock) {
            try {
                await api.transfer(sale.id, { tableId: newTableId, zoneId: resolvedZoneId });
            } catch {
                // Rollback
                sale.transferToTable(oldTableId, oldZoneId);
                tablesStore.freeTable(newTableId);
                tablesStore.assignTable(oldTableId, 0);
                error.value = 'Error al transferir la orden. Se revirtió el cambio.';
                return false;
            }
        }

        error.value = null;
        return true;
    }

    /**
     * Confirma el cobro de la orden activa.
     * Registra el pago en el módulo de pagos, marca la venta como PAID,
     * libera la mesa y limpia el estado local.
     *
     * Valida que exista un turno de caja abierto antes de procesar.
     * Si el pago es en efectivo, registra el ingreso en caja.
     *
     * @param {{ method: string, amountReceived: number, receiptType: string, receiptData: object }} paymentData
     * @returns {boolean}
     */
    async function confirmPayment({ method, amountReceived, receiptType, receiptData }) {
        if (!currentSale.value) return false;

        // 0. Validar turno de caja abierto
        if (!cashRegisterStore.hasOpenSession) {
            error.value = 'No hay un turno de caja abierto. Abre un turno en el módulo de Caja antes de cobrar.';
            return false;
        }

        const sale    = currentSale.value;
        const saleId  = sale.id;
        const tableId = sale.tableId;
        const table   = sale.isTakeaway ? null : tablesStore.tables.find(t => t.id === tableId);
        const zone    = sale.isTakeaway ? null : tablesStore.zones.find(z => z.id === sale.zoneId);
        const saleLabel = sale.isTakeaway
            ? `Para Llevar #${sale.ticketNumber}${sale.customerName ? ` (${sale.customerName})` : ''}`
            : `Mesa ${table?.number ?? '?'}`;

        // 1. Saga: persistir PAID en backend PRIMERO (punto de commit)
        if (!_isMock) {
            try {
                await api.pay(saleId, { method, amountReceived, receiptType });
            } catch {
                return false;
            }
        }

        // 2. Backend confirmó — actualizar estado local
        sale.status = SALE_STATUS.PAID;
        if (!sale.isTakeaway && tableId) {
            try {
                tablesStore.freeTable(tableId);
            } catch {
                console.warn(`[POS] freeTable(${tableId}) falló tras confirmar pago de venta ${saleId}`);
            }
        }
        currentSale.value = null;
        currentSaleIsRecovered.value = false;

        // 3. Registrar pago en módulo de pagos (fire-and-forget para UI)
        const paymentsStore = usePaymentsStore();
        const sessionId = cashRegisterStore.currentSession?.id ?? null;
        const payment = await paymentsStore.registerPayment({
            saleId,
            sessionId,
            tableNumber:    table?.number ?? null,
            zoneName:       sale.isTakeaway ? 'Para Llevar' : (zone?.name ?? null),
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
            note:           sale.isTakeaway ? `Para Llevar #${sale.ticketNumber}` : '',
            cashierId:      iamStore.currentUser?.id ?? null,
            sucursalId:     iamStore.activeBranchId ?? null,
        });

        // 4. Registrar movimiento en caja — efectivo como VENTA, digital como VENTA_DIGITAL
        const paymentId = payment?.id ?? null;
        if (method === 'cash') {
            cashRegisterStore.registerSaleMovement({
                amount:      sale.total,
                description: `Venta ${saleLabel} — Efectivo`,
                category:    'venta',
                paymentId,
            });
        } else {
            cashRegisterStore.registerSaleMovement({
                amount:      sale.total,
                description: `Venta ${saleLabel} — ${method.charAt(0).toUpperCase() + method.slice(1)}`,
                category:    'venta_digital',
                paymentId,
            });
        }

        return true;
    }

    /**
     * Confirma el cobro dividido de la orden activa.
     * Recibe un array de splits, cada uno con su método de pago.
     * Registra N pagos parciales y un solo cierre de venta.
     *
     * @param {{ splits: Array<{ total: number, method: string, label: string }>, receiptType: string, receiptData: object }} splitData
     * @returns {boolean}
     */
    async function confirmSplitPayment({ splits, receiptType, receiptData }) {
        if (!currentSale.value) return false;

        if (!cashRegisterStore.hasOpenSession) {
            error.value = 'No hay un turno de caja abierto. Abre un turno en el módulo de Caja antes de cobrar.';
            return false;
        }

        const sale    = currentSale.value;
        const saleId  = sale.id;
        const tableId = sale.tableId;
        const table   = sale.isTakeaway ? null : tablesStore.tables.find(t => t.id === tableId);
        const zone    = sale.isTakeaway ? null : tablesStore.zones.find(z => z.id === sale.zoneId);
        const saleLabel = sale.isTakeaway
            ? `Para Llevar #${sale.ticketNumber}${sale.customerName ? ` (${sale.customerName})` : ''}`
            : `Mesa ${table?.number ?? '?'}`;

        // 1. Persistir PAID en backend
        if (!_isMock) {
            try {
                await api.pay(saleId, {
                    method: 'split',
                    amountReceived: sale.total,
                    receiptType,
                    splits: splits.map(s => ({ total: s.total, method: s.method, label: s.label })),
                });
            } catch {
                error.value = 'Error al procesar el pago dividido.';
                return false;
            }
        }

        // 2. Actualizar estado local
        sale.status = SALE_STATUS.PAID;
        if (!sale.isTakeaway && tableId) {
            try { tablesStore.freeTable(tableId); } catch { /* non-critical */ }
        }
        currentSale.value = null;
        currentSaleIsRecovered.value = false;

        // 3. Registrar cada split como pago individual
        const paymentsStore = usePaymentsStore();
        const sessionId = cashRegisterStore.currentSession?.id ?? null;
        const splitGroupId = crypto.randomUUID();
        const splitCount   = splits.length;

        for (let idx = 0; idx < splits.length; idx++) {
            const split = splits[idx];

            // En modo BY_ITEMS usa los ítems del split; en EQUAL reparte los ítems completos
            const splitItems = (split.items && split.items.length > 0)
                ? split.items.map(i => ({ name: i.name ?? i.menuItemName, qty: i.qty ?? i.quantity, subtotal: i.subtotal }))
                : sale.items.map(i => ({ name: i.menuItemName, qty: i.quantity, subtotal: i.subtotal }));

            const payment = await paymentsStore.registerPayment({
                saleId,
                sessionId,
                tableNumber:    table?.number ?? null,
                zoneName:       sale.isTakeaway ? 'Para Llevar' : (zone?.name ?? null),
                items:          splitItems,
                subtotal:       parseFloat((split.total / (1 + 0.18)).toFixed(2)),
                tax:            parseFloat((split.total - split.total / (1 + 0.18)).toFixed(2)),
                discount:       0,
                total:          split.total,
                method:         split.method,
                amountReceived: split.total,
                change:         0,
                receiptType,
                receiptData,
                cashierId:      iamStore.currentUser?.id ?? null,
                sucursalId:     iamStore.activeBranchId ?? null,
                note:           `División: ${split.label}`,
                splitGroupId,
                isSplit:        true,
                splitIndex:     idx,
                splitCount,
            });

            // 4. Movimiento de caja por cada split
            const paymentId = payment?.id ?? null;
            if (split.method === 'cash') {
                cashRegisterStore.registerSaleMovement({
                    amount:      split.total,
                    description: `Venta ${saleLabel} — ${split.label} (Efectivo)`,
                    category:    'venta',
                    paymentId,
                });
            } else {
                cashRegisterStore.registerSaleMovement({
                    amount:      split.total,
                    description: `Venta ${saleLabel} — ${split.label} (${split.method})`,
                    category:    'venta_digital',
                    paymentId,
                });
            }
        }

        error.value = null;
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
        openSaleForTable, openTakeawaySale,
        addItemToCurrentSale, removeItemFromCurrentSale,
        updateItemQuantity, updateItemNote, updateItemDiscount, updateOrderDiscount, clearOrderDiscount, duplicateItemInCurrentSale,
        sendCurrentSaleToStations, cancelCurrentSale, transferSale, confirmPayment, confirmSplitPayment,
        // Catálogo
        setCatalogCategory, setCatalogSearch,
    };
});
