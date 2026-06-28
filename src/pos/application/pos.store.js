import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PosApi } from '../infrastructure/api/pos.api.js';
import { SaleAssembler, isPersistedSaleId } from '../infrastructure/assemblers/sale.assembler.js';
import { Sale, SALE_STATUS, SALE_TYPE, DELIVERY_STATUS, SALE_TAX_RATE } from '../domain/models/sale.entity.js';
import { SaleItem }          from '../domain/models/sale-item.entity.js';
import { useTablesStore }    from '../../tables/application/tables.store.js';
import { useMenuStore }      from '../../menu/application/menu.store.js';
import { useStationsStore }  from '../../stations/application/stations.store.js';
import { usePaymentsStore }  from '../../payments/application/payments.store.js';
import { useIamStore }       from '../../iam/application/iam.store.js';
import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';
import { useCompanyStore } from '../../company/application/company.store.js';
import { resolvePlanEntitlements } from '../../shared/presentation/constants/subscription-entitlements.constants.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';
import { debounce } from '../../shared/utils/debounce.js';
import { StationTicketAssembler } from '../../stations/infrastructure/assemblers/station-ticket.assembler.js';
import { PaymentAssembler } from '../../payments/infrastructure/assemblers/payment.assembler.js';
import { Payment, PAYMENT_STATUS } from '../../payments/domain/models/payment.entity.js';
import { TICKET_STATUS } from '../../stations/domain/models/station-ticket.entity.js';
import {
    isNetworkOnline,
    queueCreateSale,
    queueUpdateSale,
    queueDispatchToStations,
    replayOfflineOutbox,
} from './pos-offline-sync.js';
import {
    loadPosOpsReadCache,
    savePosOpsReadCache,
} from '../../shared/infrustructure/offline/read-cache.js';
import { apiEnv } from '../../shared/infrustructure/env.js';

const api = new PosApi();
const ITEM_SYNC_DEBOUNCE_MS = 450;

function computeTipAmount(consumptionTotal, tipType, tipValue) {
    const consumption = Number(consumptionTotal) || 0;
    const value       = Number(tipValue) || 0;
    if (!tipType || tipType === 'none' || value <= 0) return 0;
    if (tipType === 'percent') {
        return parseFloat((consumption * value / 100).toFixed(2));
    }
    if (tipType === 'fixed') {
        return parseFloat(value.toFixed(2));
    }
    return 0;
}

/** Descompone consumo en subtotal + IGV garantizando que sumen exactamente el consumo. */
function splitConsumptionTax(consumptionAmount) {
    const consumption = parseFloat(Number(consumptionAmount).toFixed(2));
    const subtotal = parseFloat((consumption / (1 + SALE_TAX_RATE)).toFixed(2));
    const tax = parseFloat((consumption - subtotal).toFixed(2));
    return { consumption, subtotal, tax };
}

function offPremiseSaleLabel(sale) {
    const num = sale.saleDisplayNumber ?? sale.ticketNumber ?? '';
    const who = sale.customerName ? ` (${sale.customerName})` : '';
    if (sale.isDelivery) return `Delivery #${num}${who}`;
    if (sale.isTakeaway) return `Para Llevar #${num}${who}`;
    return null;
}

function offPremiseZoneName(sale) {
    if (sale.isDelivery) return 'Delivery';
    if (sale.isTakeaway) return 'Para Llevar';
    return null;
}

function canSyncSaleItems(sale) {
    if (!sale) return false;
    if (sale.status !== SALE_STATUS.ACTIVE) return false;
    if ((sale.amountPaid ?? 0) > 0.009) return false;
    return true;
}

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
    let _itemSyncInFlight         = false;
    /** Todos los tickets de la venta (incl. entregados) para enlazar cada línea con su ticket. */
    const kitchenTicketsAll       = ref([]);
    /** Alineado con gastro-suite.pos.billable-requires-sent (API). */
    const billableRequiresSent    = ref(apiEnv.posBillableRequiresSent);
    const requireOpenCashSessionForSales = ref(false);

    function assertCashSessionForNewSale() {
        if (!requireOpenCashSessionForSales.value) return;
        if (!cashRegisterStore.hasOpenSession) {
            throw new Error('No hay turno de caja abierto. Abre caja antes de crear una orden.');
        }
    }

    function planHasKitchen() {
        try {
            const companyStore = useCompanyStore();
            return resolvePlanEntitlements(
                companyStore.subscriptionSummary,
                companyStore.features,
            ).hasKitchen;
        } catch {
            return true;
        }
    }

    /** Sin cocina en el plan → todo lo agregado es cobrable al instante. */
    function effectiveBillableRequiresSent() {
        if (!planHasKitchen()) return false;
        return billableRequiresSent.value;
    }

    // ── Getters ───────────────────────────────────────────────────────────
    const activeOrders   = computed(() =>
        sales.value.filter(s => s.isOpenForPayment),
    );
    const totalInProcess = computed(() => activeOrders.value.reduce((sum, s) => sum + s.total, 0));
    const currentTotal   = computed(() => currentOrderTotals.value.total);

    /** Línea cobrable: pendiente de envío o enviada sin ticket cancelado en cocina. */
    function isItemBillable(item) {
        if (!item) return false;
        if (item.billable === false) return false;
        if (item.billable === true) return true;
        if (effectiveBillableRequiresSent() && !item.isSent) return false;
        if (!item.isSent) return true;
        const ticket = getKitchenTicketForItem(item);
        return !ticket || ticket.status !== TICKET_STATUS.CANCELLED;
    }

    const currentOrderTotals = computed(() => {
        const sale = currentSale.value;
        if (!sale?.items?.length) {
            return { subtotal: 0, tax: 0, discount: 0, total: 0 };
        }
        const billable     = sale.items.filter(isItemBillable);
        const itemsTotal   = parseFloat(
            billable.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2),
        );
        const fullItemsTotal = parseFloat(
            sale.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2),
        );
        const ratio    = fullItemsTotal > 0 ? itemsTotal / fullItemsTotal : 1;
        const discount = parseFloat((sale.discount * ratio).toFixed(2));
        const total    = parseFloat(Math.max(0, itemsTotal - discount).toFixed(2));
        const subtotal = parseFloat((total / (1 + SALE_TAX_RATE)).toFixed(2));
        const tax      = parseFloat((total - subtotal).toFixed(2));
        return { subtotal, tax, discount, total };
    });

    const kitchenTickets = computed(() =>
        kitchenTicketsAll.value.filter(t =>
            t.status !== TICKET_STATUS.DELIVERED && t.status !== TICKET_STATUS.CANCELLED,
        ),
    );

    const kitchenOrderStatus = computed(() => _aggregateKitchenStatusFromItems());

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
        if (zoneId == null) return [];
        const key = String(zoneId);
        return tablesStore.tables.filter(t => String(t.zoneId) === key);
    }
    function tableById(id) {
        return tablesStore.tables.find(t => t.id === id) ?? null;
    }
    function zoneById(id) {
        return tablesStore.zones.find(z => z.id === id) ?? null;
    }

    /** Resumen de cocina según el estado real de cada línea enviada (soporta estados mixtos). */
    function _aggregateKitchenStatusFromItems() {
        const sale = currentSale.value;
        const sent = sale?.items?.filter(i => i.isSent) ?? [];
        if (!sent.length) return null;

        const forSummary = sent.filter(i => isItemBillable(i));
        const keys = (forSummary.length ? forSummary : sent)
            .map(i => getItemKitchenStatusKey(i))
            .filter(k => k && k !== 'pending' && k !== 'sent');
        if (!keys.length) return null;

        const unique = [...new Set(keys)];
        if (unique.length === 1) return unique[0];
        return 'mixed';
    }

    function getKitchenTicketForItem(item) {
        if (!item?.isSent) return null;
        const saleItemId = item.saleItemId ?? item.id;
        if (!saleItemId) return null;

        const saleId = currentSale.value?.id;
        const byDispatch = kitchenTicketsAll.value.find(t =>
            (!saleId || String(t.saleId) === String(saleId))
            && (t.dispatchedSaleItemIds ?? []).some(id => String(id) === String(saleItemId)),
        );
        if (byDispatch) return byDispatch;

        // Tickets legacy sin dispatchedSaleItemIds: solo si hay un ticket activo en esa estación
        if (!item.stationId || !saleId) return null;
        const stationTickets = kitchenTicketsAll.value.filter(t =>
            String(t.saleId) === String(saleId)
            && String(t.stationId) === String(item.stationId)
            && t.status !== TICKET_STATUS.CANCELLED,
        );
        return stationTickets.length === 1 ? stationTickets[0] : null;
    }

    /** Clave de estado cocina por ítem: pending | sent | received | preparing | ready | delivered | cancelled */
    function getItemKitchenStatusKey(item) {
        if (!item?.isSent) return 'pending';
        if (!item.stationId) return 'direct';
        const ticket = getKitchenTicketForItem(item);
        return ticket?.status ?? 'sent';
    }

    function getItemKitchenCancelReason(item) {
        const ticket = getKitchenTicketForItem(item);
        if (ticket?.status !== TICKET_STATUS.CANCELLED) return '';
        return (ticket.cancelReason ?? '').trim();
    }

    /** Línea editable: alineado con SaleKitchenModificationGuard en API. */
    function canModifySaleLine(item) {
        if (!item) return false;
        if (!item.isSent) return true;
        const key = getItemKitchenStatusKey(item);
        if (key === 'direct' || key === 'sent' || key === 'pending') return true;
        const locked = ['received', 'preparing', 'ready', 'delivered', 'cancelled'];
        return !locked.includes(key);
    }

    function getSaleLineBlockMessage(item) {
        if (!item) return '';
        const key = getItemKitchenStatusKey(item);
        if (key === 'cancelled') {
            const reason = getItemKitchenCancelReason(item);
            return reason
                ? `Cancelado en cocina: ${reason}`
                : 'Cancelado en cocina. La línea permanece en la cuenta sin cobro.';
        }
        if (key === 'preparing') {
            return 'En preparación en cocina. Anule la comanda en la estación si corresponde.';
        }
        if (key === 'ready') {
            return 'Listo en cocina. No puede modificarse desde el POS.';
        }
        if (key === 'delivered') {
            return 'Ya entregado desde cocina. No puede modificarse desde el POS.';
        }
        if (item.isSent) {
            return 'Enviado a cocina. Espere o coordine con la estación.';
        }
        return '';
    }

    function _mergeKitchenTickets(incoming) {
        if (!incoming?.length) return;
        const map = new Map(kitchenTicketsAll.value.map(t => [String(t.id), t]));
        for (const t of incoming) {
            if (t?.id) map.set(String(t.id), t);
        }
        kitchenTicketsAll.value = [...map.values()];
    }

    async function handleOperationalEvent(event) {
        if (!event?.type) return;

        if (event.type.startsWith('kitchen.')) {
            const saleId = event.payload?.saleId;
            if (!currentSale.value?.id) return;
            if (!saleId || String(currentSale.value.id) === String(saleId)) {
                await refreshKitchenTickets();
            }
            return;
        }

        if (event.type === 'sale.updated') {
            const saleId = event.payload?.saleId ?? event.entityId;
            if (!saleId) return;
            try {
                const response = await api.getById(saleId);
                const entity = SaleAssembler.toEntityFromResponse(response);
                if (!entity) return;
                const idx = sales.value.findIndex(s => String(s.id) === String(saleId));
                if (idx >= 0) sales.value[idx] = entity;
                if (currentSale.value && String(currentSale.value.id) === String(saleId)) {
                    applySaleToStore(entity, saleId);
                }
            } catch { /* conservar estado */ }
        }
    }

    async function refreshKitchenTickets() {
        const sale = currentSale.value;
        if (!sale?.id || !isPersistedSaleId(sale.id)) {
            kitchenTicketsAll.value = [];
            return;
        }
        try {
            const branchId = requireActiveBranchId();
            const response = await api.listKitchenTicketsBySale(branchId, sale.id);
            const all = StationTicketAssembler.toEntitiesFromResponse(response);
            kitchenTicketsAll.value = all.filter(t => String(t.saleId) === String(sale.id));
        } catch {
            /* conservar último estado conocido */
        }
    }
    function saleByTableId(tableId) {
        return sales.value.find(
            s => s.tableId === tableId && s.isOpenForPayment
        ) ?? null;
    }

    // ── Actions ───────────────────────────────────────────────────────────
    function applyOperationsConfig(cfg) {
        if (cfg && typeof cfg.billableRequiresSent === 'boolean') {
            billableRequiresSent.value = cfg.billableRequiresSent;
        }
        if (cfg && typeof cfg.requireOpenCashSessionForSales === 'boolean') {
            requireOpenCashSessionForSales.value = cfg.requireOpenCashSessionForSales;
        }
    }

    function loadOperationsConfigFromCache() {
        try {
            const branchId = requireActiveBranchId();
            const cfg = loadPosOpsReadCache(branchId);
            if (cfg) applyOperationsConfig(cfg);
            return Boolean(cfg);
        } catch {
            return false;
        }
    }

    async function loadOperationsConfig() {
        if (!isNetworkOnline()) {
            loadOperationsConfigFromCache();
            return;
        }
        try {
            const branchId = requireActiveBranchId();
            const res = await api.getOperationsConfig();
            const cfg = res?.data;
            applyOperationsConfig(cfg);
            if (cfg) savePosOpsReadCache(branchId, cfg);
        } catch {
            loadOperationsConfigFromCache();
        }
    }

    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        if (!isNetworkOnline()) {
            await ensurePosBaseData();
            isLoading.value = false;
            return;
        }
        try {
            const branchId = requireActiveBranchId();
            await Promise.all([
                api.listByBranch(branchId).then((response) => {
                    sales.value = SaleAssembler.toEntitiesFromResponse(response);
                }),
                tablesStore.fetchAll(),
                menuStore.fetchAll(),
                cashRegisterStore.fetchAll(),
                loadOperationsConfig(),
            ]);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar las órdenes');
        } finally {
            isLoading.value = false;
        }
    }

    function applySaleToStore(saved, previousId = null) {
        if (!saved?.id) return;
        const prev = previousId != null ? previousId : saved.id;
        const idx = sales.value.findIndex(s =>
            s.id === prev
            || s.id === saved.id
            || (saved.tableId && s.tableId === saved.tableId && s.isOpenForPayment),
        );
        if (idx !== -1) sales.value.splice(idx, 1, saved);
        else sales.value.push(saved);

        if (currentSale.value && (
            currentSale.value.id === prev
            || currentSale.value.id === saved.id
            || (saved.tableId && currentSale.value.tableId === saved.tableId)
        )) {
            currentSale.value = saved;
        }
    }

    async function fetchActiveSaleByTable(tableId) {
        if (!tableId) return null;
        try {
            const branchId = requireActiveBranchId();
            for (const saleStatus of ['ACTIVE', 'PARTIALLY_PAID']) {
                const response = await api.listByBranch(branchId, { tableId, saleStatus });
                const list = SaleAssembler.toEntitiesFromResponse(response);
                if (list[0]) return list[0];
            }
            return null;
        } catch {
            return null;
        }
    }

    async function fetchById(id) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            const sale = SaleAssembler.toEntityFromResponse(response);
            if (!sale?.id) return null;
            applySaleToStore(sale, id);
            currentSale.value = sale;
            return sale;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar la orden');
            return null;
        } finally {
            isLoading.value = false;
        }
    }

    function findLocalSale(routeKey) {
        if (!routeKey) return null;
        const key = String(routeKey);
        return sales.value.find(s =>
            String(s.id) === key
            || (s.tableId != null && String(s.tableId) === key),
        ) ?? null;
    }

    /** Menú, mesas y config POS (necesario tras F5 en orden/pago). */
    async function ensurePosBaseData() {
        if (!isNetworkOnline()) {
            const menuOk = menuStore.hydrateFromCache?.() ?? false;
            const tablesOk = tablesStore.hydrateFromCache?.() ?? false;
            loadOperationsConfigFromCache();
            if (!menuOk && !menuStore.items?.length) {
                error.value = 'Sin conexión y sin menú en caché. Conéctate al menos una vez en esta sucursal.';
            } else if (!tablesOk && !tablesStore.tables?.length) {
                error.value = 'Sin conexión y sin mesas en caché. Conéctate al menos una vez en esta sucursal.';
            }
            return;
        }
        const jobs = [];
        if (!menuStore.items?.length) jobs.push(menuStore.fetchAll());
        if (!tablesStore.tables?.length) jobs.push(tablesStore.fetchAll());
        await Promise.all([...jobs, loadOperationsConfig()]);
    }

    /**
     * Restaura currentSale desde la ruta (saleId UUID) o desde mesa (tableId en URL legacy).
     */
    async function loadSaleContext(routeSaleId) {
        try {
            requireActiveBranchId();
        } catch {
            return null;
        }

        await ensurePosBaseData();

        const raw = routeSaleId != null ? String(routeSaleId).trim() : '';
        if (!raw) {
            return currentSale.value && isPersistedSaleId(currentSale.value.id)
                ? currentSale.value
                : null;
        }

        const local = findLocalSale(raw);
        if (local) {
            currentSale.value = local;
            if (!isPersistedSaleId(local.id)) {
                const fromApi = local.tableId ? await fetchActiveSaleByTable(local.tableId) : null;
                if (fromApi) {
                    applySaleToStore(fromApi, local.id);
                    currentSale.value = fromApi;
                } else if (local.tableId && local.zoneId) {
                    try {
                        await create(local);
                    } catch {
                        return null;
                    }
                } else {
                    return null;
                }
            } else if (isNetworkOnline()) {
                const fresh = await fetchById(local.id);
                if (fresh) {
                    currentSaleIsRecovered.value = true;
                    await refreshKitchenTickets();
                    return fresh;
                }
            }
            currentSaleIsRecovered.value = true;
            return currentSale.value;
        }

        if (currentSale.value) {
            const cs = currentSale.value;
            const matchesRoute =
                String(cs.id) === raw
                || (cs.tableId != null && String(cs.tableId) === raw);
            if (matchesRoute) {
                if (isPersistedSaleId(cs.id)) {
                    if (isNetworkOnline()) {
                        const fresh = await fetchById(cs.id);
                        if (fresh) {
                            currentSaleIsRecovered.value = true;
                            await refreshKitchenTickets();
                            return fresh;
                        }
                    }
                    currentSaleIsRecovered.value = true;
                    return cs;
                }
                try {
                    const persisted = await ensureCurrentSalePersisted();
                    if (persisted) {
                        currentSaleIsRecovered.value = true;
                        return persisted;
                    }
                } catch {
                    return null;
                }
            }
        }

        if (isPersistedSaleId(raw)) {
            const sale = await fetchById(raw);
            if (sale) {
                currentSaleIsRecovered.value = true;
                await refreshKitchenTickets();
                return sale;
            }
        }

        const fromTable = await fetchActiveSaleByTable(raw);
        if (fromTable) {
            applySaleToStore(fromTable);
            currentSale.value = fromTable;
            currentSaleIsRecovered.value = true;
            await refreshKitchenTickets();
            return fromTable;
        }

        return null;
    }

    async function ensureCurrentSalePersisted() {
        const sale = currentSale.value;
        if (!sale) return null;
        if (isNetworkOnline()) {
            await syncOfflineQueue();
        }
        if (isPersistedSaleId(sale.id)) return sale;

        const fromApi = sale.tableId ? await fetchActiveSaleByTable(sale.tableId) : null;
        if (fromApi) {
            applySaleToStore(fromApi, sale.id);
            currentSale.value = fromApi;
            return fromApi;
        }

        if (sale.tableId && sale.zoneId) {
            const created = await create(sale);
            currentSale.value = created;
            return created;
        }

        throw new Error('La orden no está guardada. Abre la mesa de nuevo e intenta otra vez.');
    }

    async function create(sale) {
        if (!isNetworkOnline()) {
            queueCreateSale(sale, requireActiveBranchId());
            return sale;
        }
        const response = await api.create(SaleAssembler.toCreateResource(sale));
        const saved = SaleAssembler.toEntityFromResponse(response);
        if (!saved?.id || !isPersistedSaleId(saved.id)) {
            throw new Error('La orden se creó pero no se recibió un identificador válido.');
        }
        applySaleToStore(saved, sale.id);
        return saved;
    }

    async function update(id, sale, opts = {}) {
        if (!isPersistedSaleId(id)) {
            throw new Error('La orden aún no está guardada en el servidor.');
        }
        const response = await api.update(id, SaleAssembler.toUpdateResource(sale, opts));
        const saved = SaleAssembler.toEntityFromResponse(response);
        if (saved?.id) applySaleToStore(saved, id);
        return saved;
    }

    async function remove(id) {
        const snapshot = [...sales.value];
        sales.value = sales.value.filter(s => s.id !== id);
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
        const tableKey = String(tableId);
        let existing = sales.value.find(
            s => String(s.tableId) === tableKey && s.isOpenForPayment,
        );
        if (!existing || !isPersistedSaleId(existing.id)) {
            const fromApi = await fetchActiveSaleByTable(tableId);
            if (fromApi && isPersistedSaleId(fromApi.id)) {
                existing = fromApi;
            } else if (existing && !isPersistedSaleId(existing.id)) {
                sales.value = sales.value.filter(s => s.id !== existing.id);
                existing = null;
            }
        }
        if (existing && isPersistedSaleId(existing.id)) {
            applySaleToStore(existing);
            currentSale.value = existing;
            currentSaleIsRecovered.value = true;
        } else {
            const activeOnServer = await fetchActiveSaleByTable(tableId);
            if (activeOnServer) {
                applySaleToStore(activeOnServer);
                currentSale.value = activeOnServer;
                currentSaleIsRecovered.value = true;
                return currentSale.value;
            }
            assertCashSessionForNewSale();
            // Use a temporary negative ID — replaced with backend ID after api.create()
            const tempId  = -(Date.now());
            const newSale = new Sale({ id: tempId, tableId, zoneId, status: SALE_STATUS.ACTIVE, cashierId: iamStore.currentUser?.id ?? null });
            sales.value.push(newSale);
            currentSale.value = newSale;
            currentSaleIsRecovered.value = false;
            await tablesStore.assignTable(tableId, seatedGuests);
            // Persist to backend — await ensures real ID is set before any dispatch to stations
            try {
                const created = await create(newSale);
                if (isPersistedSaleId(created.id)) {
                    currentSale.value = created;
                }
            } catch {
                if (!isNetworkOnline()) {
                    return currentSale.value;
                }
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
        return currentSale.value;
    }

    /**
     * Crea una nueva venta para llevar (sin mesa ni zona).
     * Asigna un ticketNumber correlativo y opcionalmente un nombre de cliente.
     * @param {string} [customerName='']
     * @returns {Sale} La venta creada
     */
    async function openTakeawaySale(customerName = '') {
        assertCashSessionForNewSale();
        const tempId  = -(Date.now());
        const newSale = new Sale({
            id:           tempId,
            tableId:      null,
            zoneId:       null,
            saleType:     SALE_TYPE.TAKEAWAY,
            customerName,
            ticketNumber: null,
            status:       SALE_STATUS.ACTIVE,
            cashierId:    iamStore.currentUser?.id ?? null,
            sucursalId:   iamStore.activeBranchId ?? null,
        });
        sales.value.push(newSale);
        currentSale.value = newSale;
        currentSaleIsRecovered.value = false;
        try {
            const created = await create(newSale);
            currentSale.value = created ?? newSale;
        } catch {
            if (!isNetworkOnline()) {
                return currentSale.value;
            }
            sales.value = sales.value.filter(s => s.id !== tempId);
            currentSale.value = null;
            currentSaleIsRecovered.value = false;
            throw new Error('No se pudo crear la orden para llevar. Por favor intenta de nuevo.');
        }
        return currentSale.value;
    }

    /**
     * Crea una nueva venta delivery (sin mesa; requiere datos de entrega).
     */
    async function openDeliverySale({ customerName = '', customerPhone = '', deliveryAddress = '' } = {}) {
        const address = String(deliveryAddress ?? '').trim();
        if (!address) {
            throw new Error('La dirección de entrega es obligatoria.');
        }
        assertCashSessionForNewSale();
        const tempId = -(Date.now());
        const newSale = new Sale({
            id:              tempId,
            tableId:         null,
            zoneId:          null,
            saleType:        SALE_TYPE.DELIVERY,
            customerName:    String(customerName ?? '').trim(),
            customerPhone:   String(customerPhone ?? '').trim(),
            deliveryAddress: address,
            deliveryStatus:  DELIVERY_STATUS.PENDING,
            ticketNumber:    null,
            status:          SALE_STATUS.ACTIVE,
            cashierId:       iamStore.currentUser?.id ?? null,
            sucursalId:      iamStore.activeBranchId ?? null,
        });
        sales.value.push(newSale);
        currentSale.value = newSale;
        currentSaleIsRecovered.value = false;
        try {
            const created = await create(newSale);
            currentSale.value = created ?? newSale;
        } catch {
            if (!isNetworkOnline()) {
                return currentSale.value;
            }
            sales.value = sales.value.filter(s => s.id !== tempId);
            currentSale.value = null;
            currentSaleIsRecovered.value = false;
            throw new Error('No se pudo crear la orden delivery. Por favor intenta de nuevo.');
        }
        return currentSale.value;
    }

    /**
     * Avanza el estado de reparto de la orden delivery activa o indicada.
     * @param {'dispatched'|'delivered'|'cancelled'} nextStatus
     * @param {string|number|null} [saleId]
     */
    async function advanceDeliveryStatus(nextStatus, saleId = null) {
        const sale = saleId != null
            ? sales.value.find(s => String(s.id) === String(saleId)) ?? currentSale.value
            : currentSale.value;
        if (!sale?.isDelivery) {
            throw new Error('La orden no es delivery.');
        }
        if (!isPersistedSaleId(sale.id)) {
            throw new Error('La orden delivery aún no está sincronizada.');
        }
        const apiStatus = String(nextStatus).toUpperCase();
        const response = await api.updateDeliveryStatus(sale.id, apiStatus);
        const updated = SaleAssembler.toEntityFromResponse(response);
        const idx = sales.value.findIndex(s => String(s.id) === String(sale.id));
        if (idx !== -1) sales.value[idx] = updated;
        if (currentSale.value && String(currentSale.value.id) === String(sale.id)) {
            currentSale.value = updated;
        }
        return updated;
    }

    // ── Orden actual — persistencia con debounce ─────────────────────────

    async function flushSyncCurrentSaleItems() {
        const sale = currentSale.value;
        if (!sale || _itemSyncInFlight) return;
        if (!canSyncSaleItems(sale)) return;
        if (!isNetworkOnline()) {
            queueUpdateSale(sale);
            return;
        }
        if (!isPersistedSaleId(sale.id)) return;
        _itemSyncInFlight = true;
        try {
            await update(sale.id, sale, { includeItems: true });
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al guardar la orden');
            throw e;
        } finally {
            _itemSyncInFlight = false;
        }
    }

    async function syncOfflineQueue() {
        const stationsStore = useStationsStore();
        const result = await replayOfflineOutbox({
            create: (resource) => api.create(resource),
            update: (saleId, resource) => api.update(saleId, resource),
            dispatch: (saleId) => api.dispatchToStations(saleId),
            applySaleToStore,
            mergeKitchenTickets: _mergeKitchenTickets,
            refreshKitchenTickets,
            sales,
        });
        if (result.replayed > 0) {
            try {
                await stationsStore.fetchAll();
            } catch { /* estaciones mostrarán error propio */ }
        }
        return result;
    }

    const scheduleSyncCurrentSaleItems = debounce(() => {
        flushSyncCurrentSaleItems().catch((e) => {
            error.value = getApiErrorMessage(e, 'Error al guardar la orden');
        });
    }, ITEM_SYNC_DEBOUNCE_MS);

    function _touchCurrentSaleItems() {
        if (!currentSale.value || !isPersistedSaleId(currentSale.value.id)) return;
        if (!canSyncSaleItems(currentSale.value)) return;
        scheduleSyncCurrentSaleItems();
    }

    // ── Orden actual — gestión de ítems ──────────────────────────────────

    function addItemToCurrentSale(menuItem) {
        if (!currentSale.value) return;
        currentSale.value.addItem(menuItem);
        _touchCurrentSaleItems();
    }

    function removeItemFromCurrentSale(itemId) {
        if (!currentSale.value) return { ok: false, message: 'No hay orden activa' };
        const item = currentSale.value.items.find(i => i.id === itemId);
        if (!canModifySaleLine(item)) {
            const message = getSaleLineBlockMessage(item);
            error.value = message;
            return { ok: false, message };
        }
        currentSale.value.removeItem(itemId);
        _touchCurrentSaleItems();
        return { ok: true };
    }

    function updateItemQuantity(itemId, qty) {
        if (!currentSale.value) return { ok: false };
        const item = currentSale.value.items.find(i => i.id === itemId);
        if (!canModifySaleLine(item)) {
            error.value = getSaleLineBlockMessage(item);
            return { ok: false, message: error.value };
        }
        currentSale.value.updateQuantity(itemId, qty);
        _touchCurrentSaleItems();
        return { ok: true };
    }

    function updateItemNote(itemId, note) {
        if (!currentSale.value) return { ok: false };
        const item = currentSale.value.items.find(i => i.id === itemId);
        if (!canModifySaleLine(item)) {
            error.value = getSaleLineBlockMessage(item);
            return { ok: false, message: error.value };
        }
        currentSale.value.updateNote(itemId, note);
        _touchCurrentSaleItems();
        return { ok: true };
    }

    function updateItemDiscount(itemId, type, value) {
        if (!currentSale.value) return { ok: false };
        const item = currentSale.value.items.find(i => i.id === itemId);
        if (!canModifySaleLine(item)) {
            error.value = getSaleLineBlockMessage(item);
            return { ok: false, message: error.value };
        }
        currentSale.value.updateDiscount(itemId, type, value);
        _touchCurrentSaleItems();
        return { ok: true };
    }

    function updateOrderDiscount(type, value) {
        if (!currentSale.value) return;
        currentSale.value.updateOrderDiscount(type, value);
        _touchCurrentSaleItems();
    }

    function clearOrderDiscount() {
        if (!currentSale.value) return;
        currentSale.value.clearOrderDiscount();
        _touchCurrentSaleItems();
    }

    function duplicateItemInCurrentSale(itemId) {
        if (!currentSale.value) return { ok: false };
        const item = currentSale.value.items.find(i => i.id === itemId);
        if (!canModifySaleLine(item)) {
            error.value = getSaleLineBlockMessage(item);
            return { ok: false, message: error.value };
        }
        currentSale.value.duplicateItem(itemId);
        _touchCurrentSaleItems();
        return { ok: true };
    }

    /**
     * Envía a las estaciones de cocina únicamente los ítems que todavía no
     * fueron enviados (isSent === false). Tras el envío los marca como enviados
     * para que rondas posteriores solo despachen el delta nuevo.
     * @returns {number} Cantidad de ítems despachados (0 si no había nada pendiente)
     */
    async function sendCurrentSaleToStations() {
        if (!currentSale.value) return { items: 0, queued: false };
        const pendingCount = currentSale.value.items.filter(i => !i.isSent).length;
        if (pendingCount === 0) return { items: 0, queued: false };

        if (!isNetworkOnline()) {
            const sale = currentSale.value;
            queueUpdateSale(sale);
            queueDispatchToStations(sale.id);
            return { items: pendingCount, queued: true };
        }

        const sale = await ensureCurrentSalePersisted();

        try {
            await flushSyncCurrentSaleItems();
            const response = await api.dispatchToStations(sale.id);
            const { sale: saved, itemsDispatched, tickets } = SaleAssembler.fromDispatchResponse(response);
            if (saved) applySaleToStore(saved, sale.id);

            if (tickets?.length) {
                _mergeKitchenTickets(
                    tickets.map(r => StationTicketAssembler.toEntityFromResource(r)),
                );
            }

            const stationsStore = useStationsStore();
            await Promise.all([
                stationsStore.fetchAll(),
                refreshKitchenTickets(),
            ]);

            return { items: itemsDispatched, queued: false };
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al enviar a estaciones');
            throw e;
        }
    }

    /**
     * Cancela la orden activa: marca como CANCELLED y libera la mesa (solo dine-in).
     */
    async function cancelCurrentSale() {
        if (!currentSale.value) return;
        const saleId  = currentSale.value.id;
        const tableId = currentSale.value.tableId;
        currentSale.value.status = SALE_STATUS.CANCELLED;
        if (!currentSale.value.isOffPremise && tableId) {
            tablesStore.freeTable(tableId);
        }
        sales.value = sales.value.filter(s => s.id !== saleId);
        currentSale.value = null;
        currentSaleIsRecovered.value = false;
        // Persist cancellation — fire-and-forget, local state already updated
        if (isPersistedSaleId(saleId)) {
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
            s => s.tableId === newTableId && s.isOpenForPayment
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
        try {
            await ensureCurrentSalePersisted();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'La orden no está guardada en el servidor.');
            return false;
        }
        {
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
     * @param {{ method: string, amountReceived: number, receiptType: string, receiptData: object, tip: object, partialAmount?: number }} paymentData
     * @returns {boolean|'partial'}
     */
    async function confirmPayment({ method, amountReceived, receiptType, receiptData, tip, partialAmount }) {
        if (!currentSale.value) return false;

        if (!isNetworkOnline()) {
            error.value = 'Sin conexión a internet. El cobro requiere conexión; puedes seguir editando la orden.';
            return false;
        }

        await syncOfflineQueue();

        if (!cashRegisterStore.hasOpenSession) {
            error.value = 'No hay un turno de caja abierto. Abre un turno en el módulo de Caja antes de cobrar.';
            return false;
        }

        if (!iamStore.currentUser?.employeeId) {
            const link = await iamStore.ensureEmployeeLink();
            if (!link.ok) {
                error.value = iamStore.employeeLinkMessage
                    ?? 'Tu usuario debe estar vinculado a un empleado para cobrar.';
                return false;
            }
        }

        let sale;
        try {
            sale = await ensureCurrentSalePersisted();
            if (isNetworkOnline() && isPersistedSaleId(sale.id)) {
                const fresh = await fetchById(sale.id);
                if (fresh) sale = fresh;
            }
        } catch (e) {
            error.value = getApiErrorMessage(e, 'La orden no está guardada en el servidor.');
            return false;
        }

        const totals        = currentOrderTotals.value;
        const billableItems = sale.items.filter(isItemBillable);
        if (billableItems.length === 0) {
            error.value = effectiveBillableRequiresSent()
                ? 'No hay ítems enviados a cocina para cobrar. Envía la comanda primero.'
                : 'No hay ítems cobrables en esta orden.';
            return false;
        }
        const consumption   = totals.total;
        const balanceDue    = sale.balanceDue ?? Math.max(0, consumption - (sale.amountPaid ?? 0));
        const isPartialPay  = partialAmount != null && partialAmount > 0
            && partialAmount < balanceDue - 0.009;
        const payConsumption = isPartialPay
            ? parseFloat(Number(partialAmount).toFixed(2))
            : balanceDue;
        const tipAmount     = isPartialPay
            ? 0
            : computeTipAmount(consumption, tip?.type, tip?.value);
        const paymentTotal  = parseFloat((payConsumption + tipAmount).toFixed(2));
        const ratio         = consumption > 0 ? payConsumption / consumption : 1;
        const { subtotal: paySubtotal, tax: payTax } = splitConsumptionTax(payConsumption);

        const saleId  = sale.id;
        const tableId = sale.tableId;
        const table   = sale.isOffPremise ? null : tablesStore.tables.find(t => t.id === tableId);
        const zone    = sale.isOffPremise ? null : tablesStore.zones.find(z => z.id === sale.zoneId);
        const offLabel = offPremiseSaleLabel(sale);
        const saleLabel = offLabel ?? `Mesa ${table?.number ?? '?'}`;

        const paymentsStore = usePaymentsStore();
        const sessionId = cashRegisterStore.currentSession?.id ?? null;
        const paymentDraft = new Payment({
            saleId,
            sessionId,
            tableNumber:    table?.number ?? null,
            zoneName:       offPremiseZoneName(sale) ?? (zone?.name ?? null),
            items:          billableItems.map(i => ({
                name:     i.menuItemName,
                qty:      i.quantity,
                subtotal: i.subtotal,
            })),
            subtotal:       paySubtotal,
            tax:            payTax,
            discount:       parseFloat((totals.discount * ratio).toFixed(2)),
            total:          paymentTotal,
            tipType:        tip?.type ?? 'none',
            tipValue:       tip?.value ?? 0,
            tipAmount,
            method,
            amountReceived,
            change:         parseFloat((amountReceived - paymentTotal).toFixed(2)),
            receiptType,
            receiptData,
            status:         PAYMENT_STATUS.COMPLETED,
            note:           offLabel ?? '',
            cashierId:      iamStore.currentUser?.id ?? null,
            sucursalId:     iamStore.activeBranchId ?? null,
        });

        let payment = null;
        let updatedSale = sale;
        // 1. Sincronizar ítems (solo venta ACTIVE sin cobros previos) y checkout atómico
        {
            try {
                if (canSyncSaleItems(sale)) {
                    await flushSyncCurrentSaleItems();
                }
                const response = await api.checkout(
                    saleId,
                    PaymentAssembler.toCreateBffResource(paymentDraft),
                );
                const checkout = SaleAssembler.fromCheckoutResponse(response);
                payment = checkout.payment;
                if (checkout.sale) {
                    applySaleToStore(checkout.sale);
                    updatedSale = checkout.sale;
                }
            } catch (e) {
                error.value = getApiErrorMessage(e, 'Error al confirmar el pago');
                return false;
            }
        }

        if (updatedSale.status === SALE_STATUS.PARTIALLY_PAID) {
            currentSale.value = updatedSale;
            currentSaleIsRecovered.value = true;
            if (payment) {
                paymentsStore.addCompletedPayment(payment);
            }
            await cashRegisterStore.refreshOpenSession();
            error.value = null;
            return 'partial';
        }

        // 2. Backend confirmó pago total — actualizar estado local
        updatedSale.status = SALE_STATUS.PAID;
        if (!updatedSale.isOffPremise && tableId) {
            try {
                tablesStore.freeTable(tableId);
            } catch {
                console.warn(`[POS] freeTable(${tableId}) falló tras confirmar pago de venta ${saleId}`);
            }
        }
        currentSale.value = null;
        currentSaleIsRecovered.value = false;

        if (payment) {
            paymentsStore.addCompletedPayment(payment);
        }

        await cashRegisterStore.refreshOpenSession();
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
    async function confirmSplitPayment({ splits, receiptType, receiptData, tip }) {
        if (!currentSale.value) return false;

        if (!isNetworkOnline()) {
            error.value = 'Sin conexión a internet. El cobro requiere conexión.';
            return false;
        }
        await syncOfflineQueue();

        if (!cashRegisterStore.hasOpenSession) {
            error.value = 'No hay un turno de caja abierto. Abre un turno en el módulo de Caja antes de cobrar.';
            return false;
        }

        if (!iamStore.currentUser?.employeeId) {
            const link = await iamStore.ensureEmployeeLink();
            if (!link.ok) {
                error.value = iamStore.employeeLinkMessage
                    ?? 'Tu usuario debe estar vinculado a un empleado para cobrar.';
                return false;
            }
        }

        let sale;
        try {
            sale = await ensureCurrentSalePersisted();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'La orden no está guardada en el servidor.');
            return false;
        }

        const orderTotals       = currentOrderTotals.value;
        const billableItems     = sale.items.filter(isItemBillable);
        const consumptionTotal  = orderTotals.total;
        const orderTipAmount      = computeTipAmount(consumptionTotal, tip?.type, tip?.value);
        const splitsConsumption   = parseFloat(
            splits.reduce((sum, s) => sum + s.total, 0).toFixed(2),
        );

        const saleId  = sale.id;
        const tableId = sale.tableId;
        const table   = sale.isOffPremise ? null : tablesStore.tables.find(t => t.id === tableId);
        const zone    = sale.isOffPremise ? null : tablesStore.zones.find(z => z.id === sale.zoneId);
        const offLabel = offPremiseSaleLabel(sale);
        const saleLabel = offLabel ?? `Mesa ${table?.number ?? '?'}`;

        const paymentsStore = usePaymentsStore();
        const sessionId = cashRegisterStore.currentSession?.id ?? null;
        const splitGroupId = crypto.randomUUID();
        const splitCount   = splits.length;
        const paymentPayloads = [];

        for (let idx = 0; idx < splits.length; idx++) {
            const split = splits[idx];
            const splitConsumption = split.total;
            const ratio = splitsConsumption > 0
                ? splitConsumption / splitsConsumption
                : 1 / splits.length;
            const splitDiscount = parseFloat((orderTotals.discount * ratio).toFixed(2));
            const splitTip      = parseFloat((orderTipAmount * ratio).toFixed(2));
            const { subtotal: splitSubtotal, tax: splitTax } = splitConsumptionTax(splitConsumption);
            const splitPaymentTotal = parseFloat((splitConsumption + splitTip).toFixed(2));

            const splitItems = (split.items && split.items.length > 0)
                ? split.items.map(i => ({
                    name:     i.menuItemName ?? i.name,
                    qty:      i.quantity ?? i.qty,
                    subtotal: i.subtotal,
                }))
                : [{ name: split.label, qty: 1, subtotal: splitConsumption }];

            const draft = new Payment({
                saleId,
                sessionId,
                tableNumber:    table?.number ?? null,
                zoneName:       offPremiseZoneName(sale) ?? (zone?.name ?? null),
                items:          splitItems,
                subtotal:       splitSubtotal,
                tax:            splitTax,
                discount:       splitDiscount,
                total:          splitPaymentTotal,
                tipType:        tip?.type ?? 'none',
                tipValue:       tip?.value ?? 0,
                tipAmount:      splitTip,
                method:         split.method,
                amountReceived: splitPaymentTotal,
                change:         0,
                receiptType,
                receiptData,
                status:         PAYMENT_STATUS.COMPLETED,
                cashierId:      iamStore.currentUser?.id ?? null,
                sucursalId:     iamStore.activeBranchId ?? null,
                note:           `División: ${split.label}`,
                splitGroupId,
                isSplit:        true,
                splitIndex:     idx,
                splitCount,
            });
            paymentPayloads.push({ draft, splitConsumption, splitTip, split });
        }

        let savedPayments = [];
        // 1. Sync + checkout dividido atómico
        {
            try {
                if (canSyncSaleItems(sale)) {
                    await flushSyncCurrentSaleItems();
                }
                const response = await api.checkoutSplit(saleId, {
                    payments: paymentPayloads.map(p =>
                        PaymentAssembler.toCreateBffResource(p.draft),
                    ),
                });
                const result = SaleAssembler.fromSplitCheckoutResponse(response);
                savedPayments = result.payments ?? [];
            } catch (e) {
                error.value = getApiErrorMessage(e, 'Error al procesar el pago dividido.');
                return false;
            }
        }

        // 2. Actualizar estado local
        sale.status = SALE_STATUS.PAID;
        if (!sale.isOffPremise && tableId) {
            try { tablesStore.freeTable(tableId); } catch { /* non-critical */ }
        }
        currentSale.value = null;
        currentSaleIsRecovered.value = false;

        for (const p of savedPayments) {
            paymentsStore.addCompletedPayment(p);
        }

        await cashRegisterStore.refreshOpenSession();
        error.value = null;
        return true;
    }

    return {
        // State
        sales, currentSale, currentSaleIsRecovered, kitchenTickets, kitchenOrderStatus, isLoading, error,
        catalogSearch, catalogCategory,
        // Getters
        activeOrders, totalInProcess, currentTotal, currentOrderTotals,
        menuCategories, filteredCatalog,
        zones, occupiedTables, tablesForZone, tableById, zoneById, saleByTableId,
        // Sale CRUD
        fetchAll, loadOperationsConfig, fetchById, fetchActiveSaleByTable, loadSaleContext, ensureCurrentSalePersisted,
        create, update, remove,
        // Orden
        openSaleForTable, openTakeawaySale, openDeliverySale, advanceDeliveryStatus,
        addItemToCurrentSale, removeItemFromCurrentSale,
        updateItemQuantity, updateItemNote, updateItemDiscount, updateOrderDiscount, clearOrderDiscount, duplicateItemInCurrentSale,
        flushSyncCurrentSaleItems,
        sendCurrentSaleToStations, refreshKitchenTickets, handleOperationalEvent,
        getItemKitchenStatusKey, getItemKitchenCancelReason, getKitchenTicketForItem, isItemBillable,
        canModifySaleLine, getSaleLineBlockMessage,
        cancelCurrentSale, transferSale, confirmPayment, confirmSplitPayment, syncOfflineQueue,
        // Catálogo
        setCatalogCategory, setCatalogSearch,
    };
});
