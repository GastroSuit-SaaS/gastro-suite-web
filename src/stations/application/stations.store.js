import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { StationsApi } from '../infrastructure/api/stations.api.js';
import { StationAssembler } from '../infrastructure/assemblers/station.assembler.js';
import { StationTicketAssembler } from '../infrastructure/assemblers/station-ticket.assembler.js';
import { Station } from '../domain/models/station.entity.js';
import { StationTicket, StationTicketItem, TICKET_STATUS } from '../domain/models/station-ticket.entity.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error.js';
import { storeSuccess, storeFailure, storeFailureMessage } from '../../shared/application/store-result.js';
import * as historyDisplay from './stations-history-display.js';
import { useStationsFacade } from './stations.facade.js';

export { TICKET_STATUS };

const api = new StationsApi();

/** Statuses that belong in the active kanban board (not history). */
const ACTIVE_STATUSES = new Set([
    TICKET_STATUS.RECEIVED,
    TICKET_STATUS.PREPARING,
    TICKET_STATUS.READY,
    TICKET_STATUS.DELIVERED,
]);


export const useStationsStore = defineStore('stations', () => {
    const facade = useStationsFacade();

    // ── State ─────────────────────────────────────────────────────────────
    const stations          = ref([]);

    const tickets           = ref([]);

    // ── History (delivered + cancelled — never deleted) ───────────────────
    const ticketHistory     = ref([]);
    // Persistent counter so totalToday never decreases
    const ticketCountToday  = ref(0);

    const selectedStationId = ref(null);
    const isLoading         = ref(false);
    const error             = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const activeStations = computed(() => stations.value.filter(s => s.isActive));

    const filteredTickets = computed(() =>
        selectedStationId.value === null
            ? tickets.value
            : tickets.value.filter(t => t.stationId === selectedStationId.value)
    );

    const receivedTickets  = computed(() => filteredTickets.value.filter(t => t.status === TICKET_STATUS.RECEIVED));
    const preparingTickets = computed(() => filteredTickets.value.filter(t => t.status === TICKET_STATUS.PREPARING));
    const readyTickets     = computed(() => filteredTickets.value.filter(t => t.status === TICKET_STATUS.READY));
    const deliveredTickets = computed(() => filteredTickets.value.filter(t => t.status === TICKET_STATUS.DELIVERED));

    // Real "total hoy" — monotonically increasing, never decreases when tickets are archived
    const totalToday  = computed(() => ticketCountToday.value);
    const readyCount  = computed(() => tickets.value.filter(t => t.status === TICKET_STATUS.READY).length);

    // History filtered by station selection
    const filteredHistory  = computed(() =>
        selectedStationId.value === null
            ? ticketHistory.value
            : ticketHistory.value.filter(t => t.stationId === selectedStationId.value)
    );

    // ── Station Actions ───────────────────────────────────────────────────
    /** Solo estaciones (menú, inventario, etc.) — sin tickets de cocina. */
    async function fetchStations() {
        try {
            const branchId = requireActiveBranchId();
            const stationsResp = await api.listStationsByBranch(branchId);
            stations.value = StationAssembler.toEntitiesFromResponse(stationsResp);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar las estaciones');
            throw e;
        }
    }

    function _applyTicketList(fetched) {
        tickets.value       = fetched.filter(t => ACTIVE_STATUSES.has(t.status) && t.status !== TICKET_STATUS.DELIVERED);
        ticketHistory.value = fetched.filter(t => t.status === TICKET_STATUS.DELIVERED || t.status === TICKET_STATUS.CANCELLED);
        ticketCountToday.value = Math.max(ticketCountToday.value, tickets.value.length + ticketHistory.value.length);
    }

    function _upsertTicket(entity) {
        if (!entity?.id) return;
        const id = String(entity.id);
        tickets.value = tickets.value.filter(t => String(t.id) !== id);
        ticketHistory.value = ticketHistory.value.filter(t => String(t.id) !== id);

        if (entity.status === TICKET_STATUS.DELIVERED || entity.status === TICKET_STATUS.CANCELLED) {
            ticketHistory.value.unshift(entity);
        } else if (ACTIVE_STATUSES.has(entity.status)) {
            tickets.value.push(entity);
            ticketCountToday.value = Math.max(ticketCountToday.value, tickets.value.length + ticketHistory.value.length);
        }
    }

    async function fetchTicketsSilent() {
        try {
            const branchId = requireActiveBranchId();
            const ticketsResp = await api.listTicketsByBranch(branchId);
            const fetched = StationTicketAssembler.toEntitiesFromResponse(ticketsResp);
            _applyTicketList(fetched);
        } catch { /* mantener último estado */ }
    }

    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const branchId = requireActiveBranchId();
            const [, ticketsResp] = await Promise.all([
                fetchStations(),
                api.listTicketsByBranch(branchId),
            ]);
            const fetched  = StationTicketAssembler.toEntitiesFromResponse(ticketsResp);
            _applyTicketList(fetched);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar las estaciones');
        } finally {
            isLoading.value = false;
        }
    }

    async function handleOperationalEvent(event) {
        const ticketId = event?.entityId ?? event?.payload?.ticketId;
        if (!ticketId) {
            await fetchTicketsSilent();
            return;
        }
        try {
            const response = await api.getTicket(ticketId);
            const entity = StationTicketAssembler.toEntityFromResponse(response);
            if (entity) _upsertTicket(entity);
        } catch {
            await fetchTicketsSilent();
        }
    }

    async function createStation(data) {
        const optimisticId = Math.max(0, ...stations.value.map(s => s.id)) + 1;
        const snapshot = [...stations.value];
        stations.value.push(new Station({ id: optimisticId, ...data }));
        try {
            const branchId = requireActiveBranchId();
            const entity = new Station({ id: optimisticId, ...data });
            const response = await api.createStation(StationAssembler.toResourceFromEntity(entity, branchId));
            if (response.status === 201 || response.status === 200) {
                const saved = StationAssembler.toEntityFromResponse(response);
                if (saved?.id) {
                    const idx = stations.value.findIndex(s => s.id === optimisticId);
                    if (idx !== -1) stations.value.splice(idx, 1, saved);
                }
            }
            return storeSuccess();
        } catch (e) {
            stations.value = snapshot;
            return storeFailure(e, 'No se pudo crear la estación');
        }
    }

    async function updateStation(id, data) {
        const idx = stations.value.findIndex(s => s.id === id);
        if (idx === -1) return storeFailureMessage('Estación no encontrada');
        const snapshot = [...stations.value];
        stations.value[idx] = new Station({ ...stations.value[idx], ...data });
        tickets.value.forEach(t => {
            if (t.stationId === id) t.stationName = data.name ?? t.stationName;
        });
        try {
            await api.updateStation(id, {
                stationName: data.name,
                stationDescription: data.description,
                stationColor: data.color,
                isActive: data.isActive,
            });
            return storeSuccess();
        } catch (e) {
            stations.value = snapshot;
            return storeFailure(e, 'No se pudo actualizar la estación');
        }
    }

    async function removeStation(id) {
        const hasActiveTickets = tickets.value.some(
            t => t.stationId === id &&
                (t.status === TICKET_STATUS.RECEIVED || t.status === TICKET_STATUS.PREPARING)
        );
        if (hasActiveTickets) {
            return storeFailureMessage('No se puede eliminar una estación con tickets activos');
        }
        const snapshot = [...stations.value];
        stations.value = stations.value.filter(s => s.id !== id);
        try {
            await api.deleteStation(id);
            return storeSuccess();
        } catch (e) {
            stations.value = snapshot;
            return storeFailure(e, 'No se pudo eliminar la estación');
        }
    }

    function selectStation(id) {
        selectedStationId.value = selectedStationId.value === id ? null : id;
    }

    function _mergeTicketFromApi(local, saved) {
        if (!local || !saved) return;
        local.status       = saved.status;
        local.startedAt    = saved.startedAt ?? local.startedAt;
        local.readyAt      = saved.readyAt ?? local.readyAt;
        local.deliveredAt  = saved.deliveredAt ?? local.deliveredAt;
        local.cancelledAt  = saved.cancelledAt ?? local.cancelledAt;
        local.cancelReason = saved.cancelReason ?? local.cancelReason;
        local.stationName  = saved.stationName || local.stationName;
        local.tableNumber  = saved.tableNumber ?? local.tableNumber;
        if (saved.items?.length) local.items = saved.items;
    }

    async function _persistTicketStatus(ticketId, status) {
        const response = await api.updateTicket(
            ticketId,
            StationTicketAssembler.toUpdateBffResource({ status }),
        );
        return StationTicketAssembler.toEntityFromResponse(response);
    }

    // ── Ticket Actions ────────────────────────────────────────────────────
    /**
     * Avanza received → preparing → ready → delivered.
     * Al llegar a 'delivered' el ticket pasa al historial en lugar de borrarse.
     */
    async function advanceTicket(ticketId) {
        const ticket = tickets.value.find(t => t.id === ticketId);
        if (!ticket) return;

        const snapshot = {
            status:       ticket.status,
            startedAt:    ticket.startedAt,
            readyAt:      ticket.readyAt,
            deliveredAt:  ticket.deliveredAt,
            readyToArchive: ticket.readyToArchive,
        };

        let targetStatus = ticket.status;
        if (ticket.status === TICKET_STATUS.RECEIVED) {
            targetStatus       = TICKET_STATUS.PREPARING;
            ticket.startedAt   = new Date();
        } else if (ticket.status === TICKET_STATUS.PREPARING) {
            targetStatus     = TICKET_STATUS.READY;
            ticket.readyAt   = new Date();
        } else if (ticket.status === TICKET_STATUS.READY) {
            targetStatus         = TICKET_STATUS.DELIVERED;
            ticket.deliveredAt   = new Date();
            ticket.readyToArchive = true;
        } else {
            return;
        }

        ticket.status = targetStatus;

        try {
            const saved = await _persistTicketStatus(ticketId, targetStatus);
            _mergeTicketFromApi(ticket, saved);
            if (targetStatus === TICKET_STATUS.DELIVERED && saved?.status === TICKET_STATUS.DELIVERED) {
                ticket.readyToArchive = true;
            }
        } catch (e) {
            ticket.status         = snapshot.status;
            ticket.startedAt      = snapshot.startedAt;
            ticket.readyAt        = snapshot.readyAt;
            ticket.deliveredAt    = snapshot.deliveredAt;
            ticket.readyToArchive = snapshot.readyToArchive;
            error.value = getApiErrorMessage(e, 'No se pudo actualizar el estado del ticket');
            throw e;
        }
    }

    /**
     * Cancela un ticket activo (received | preparing) con motivo opcional.
     * Lo mueve al historial inmediatamente.
     */
    async function cancelTicket(ticketId, reason = '') {
        const ticket = tickets.value.find(t => t.id === ticketId);
        if (!ticket || ticket.status === TICKET_STATUS.DELIVERED || ticket.status === TICKET_STATUS.CANCELLED) return;

        const snapshot = { status: ticket.status };
        ticket.status       = TICKET_STATUS.CANCELLED;
        ticket.cancelledAt  = new Date();
        ticket.cancelReason = reason;
        ticketHistory.value.unshift(new StationTicket({ ...ticket }));
        tickets.value = tickets.value.filter(t => t.id !== ticketId);

        try {
            const saved = await api.updateTicket(
                ticketId,
                StationTicketAssembler.toUpdateBffResource({
                    status: TICKET_STATUS.CANCELLED,
                    cancelReason: reason,
                }),
            );
            const parsed = StationTicketAssembler.toEntityFromResponse(saved);
            if (parsed) {
                ticket.cancelledAt  = parsed.cancelledAt ?? ticket.cancelledAt;
                ticket.cancelReason = parsed.cancelReason ?? ticket.cancelReason;
            }
        } catch (e) {
            tickets.value.push(ticket);
            ticketHistory.value = ticketHistory.value.filter(t => t.id !== ticketId);
            ticket.status = snapshot.status;
            error.value = getApiErrorMessage(e, 'No se pudo cancelar el ticket');
            throw e;
        }
    }

    /** Moves a delivered ticket to history (called internally after delay). */
    function archiveTicket(ticketId) {
        const ticket = tickets.value.find(t => t.id === ticketId);
        if (!ticket) return;
        ticketHistory.value.unshift(new StationTicket({ ...ticket }));
        tickets.value = tickets.value.filter(t => t.id !== ticketId);
    }

    /**
     * Crea un ticket en cocina por cada estación con ítems pendientes.
     * @returns {Promise<void>}
     */
    async function sendSaleToStations(sale, tableNumber) {
        if (!sale?.id || sale.items.length === 0) return;

        const groups = {};
        sale.items.forEach(item => {
            const key = item.stationId ?? 'unassigned';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        const newTickets = [];
        for (const [key, items] of Object.entries(groups)) {
            const stationId = key === 'unassigned' ? null : key;
            const station   = stationId
                ? stations.value.find(s => String(s.id) === String(stationId))
                : null;
            const ticket = new StationTicket({
                id:          crypto.randomUUID(),
                stationId,
                stationName: station?.name ?? '⚠ Sin estación asignada',
                saleId:      sale.id,
                tableNumber: tableNumber ?? null,
                items:       items.map(i => new StationTicketItem({
                    menuItemId:   i.menuItemId,
                    menuItemName: i.menuItemName,
                    quantity:     i.quantity,
                    note:         i.note,
                })),
                status:     TICKET_STATUS.RECEIVED,
                createdAt:  new Date(),
                sucursalId: sale.sucursalId ?? null,
            });
            tickets.value.push(ticket);
            newTickets.push(ticket);
            ticketCountToday.value++;
        }

        const failures = [];
        for (const ticket of newTickets) {
            if (!ticket.stationId) {
                failures.push('Hay productos sin estación asignada en el menú.');
                continue;
            }
            try {
                const response = await api.createTicket(
                    StationTicketAssembler.toCreateBffResource({
                        saleId:    sale.id,
                        stationId: ticket.stationId,
                    }),
                );
                const saved = StationTicketAssembler.toEntityFromResponse(response);
                if (saved?.id) ticket.id = saved.id;
            } catch (e) {
                failures.push(getApiErrorMessage(e, 'Error al crear ticket de cocina'));
            }
        }

        if (failures.length > 0) {
            throw new Error([...new Set(failures)].join(' '));
        }
    }

    /** @deprecated Use cancelTicket() instead — removeTicket hard-deletes with no history. */
    function removeTicket(ticketId) {
        tickets.value = tickets.value.filter(t => t.id !== ticketId);
    }

    /**
     * Notifica la cancelación de un ítem enviado desde POS.
     * Elimina el ítem del ticket correspondiente; si el ticket queda vacío, lo cancela.
     */
    function notifyItemCancelled(saleId, menuItemId) {
        const relatedTickets = tickets.value.filter(t => t.saleId === saleId);
        for (const ticket of relatedTickets) {
            const itemIdx = ticket.items.findIndex(i => i.menuItemId === menuItemId);
            if (itemIdx !== -1) {
                ticket.items.splice(itemIdx, 1);
                if (ticket.items.length === 0) {
                    cancelTicket(ticket.id, 'Ítem cancelado desde POS');
                }
                break;
            }
        }
    }

    function filterTicketHistory(filters) {
        return historyDisplay.filterHistoryTickets(ticketHistory.value, filters);
    }

    function ticketHistoryStats(tickets = ticketHistory.value) {
        return historyDisplay.historySummaryStats(tickets);
    }

    return {
        // State
        stations, tickets, ticketHistory, selectedStationId, isLoading, error,
        // Getters
        activeStations, filteredTickets, filteredHistory,
        receivedTickets, preparingTickets, readyTickets, deliveredTickets,
        totalToday, readyCount,
        // Station actions
        fetchAll, fetchTicketsSilent, fetchStations, createStation, updateStation, removeStation, selectStation,
        handleOperationalEvent,
        // Ticket actions
        advanceTicket, cancelTicket, archiveTicket, sendSaleToStations, removeTicket, notifyItemCancelled,
        ticketsFromResponse: (response) => StationTicketAssembler.toEntitiesFromResponse(response),
        ticketFromResource: (r) => StationTicketAssembler.toEntityFromResource(r),
        // History display (application layer)
        filterTicketHistory,
        ticketHistoryStats,
        ticketDisplayRef: historyDisplay.ticketDisplayRef,
        ticketOrderRef: historyDisplay.ticketOrderRef,
        ticketTableLabel: historyDisplay.ticketTableLabel,
        formatHistoryDateTime: historyDisplay.formatHistoryDateTime,
        ensureMenuLoaded: facade.ensureMenuLoaded,
        availableMenuItemsCount: facade.availableMenuItemsCount,
    };
});
