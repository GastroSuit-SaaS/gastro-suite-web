import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { StationsApi } from '../infrastructure/api/stations.api.js';
import { StationAssembler } from '../infrastructure/assemblers/station.assembler.js';
import { StationTicketAssembler } from '../infrastructure/assemblers/station-ticket.assembler.js';
import { Station } from '../domain/models/station.entity.js';
import { StationTicket, StationTicketItem, TICKET_STATUS } from '../domain/models/station-ticket.entity.js';
import { MOCK_STATIONS, MOCK_TICKETS } from '../infrastructure/stations.mock.js';

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
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                const branchId = localStorage.getItem('gs_branch_id');
                stations.value = branchId ? MOCK_STATIONS.filter(s => s.sucursalId === branchId) : [...MOCK_STATIONS];
                const mockTickets = branchId ? MOCK_TICKETS.filter(t => t.sucursalId === branchId) : [...MOCK_TICKETS];
                tickets.value  = mockTickets;
                ticketCountToday.value = Math.max(ticketCountToday.value, mockTickets.length);
                return;
            }
            const [stationsResp, ticketsResp] = await Promise.all([
                api.getAll(),
                api.getTickets({ status: 'active' }),
            ]);
            stations.value = StationAssembler.toEntitiesFromResponse(stationsResp);
            const fetched  = StationTicketAssembler.toEntitiesFromResponse(ticketsResp);
            tickets.value       = fetched.filter(t => ACTIVE_STATUSES.has(t.status) && t.status !== TICKET_STATUS.DELIVERED);
            ticketHistory.value = fetched.filter(t => t.status === TICKET_STATUS.DELIVERED || t.status === TICKET_STATUS.CANCELLED);
            ticketCountToday.value = Math.max(ticketCountToday.value, tickets.value.length + ticketHistory.value.length);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar las estaciones';
        } finally {
            isLoading.value = false;
        }
    }

    async function createStation(data) {
        const optimisticId = Math.max(0, ...stations.value.map(s => s.id)) + 1;
        stations.value.push(new Station({ id: optimisticId, ...data }));
        try {
            const entity = new Station({ id: optimisticId, ...data });
            const response = await api.create(StationAssembler.toResourceFromEntity(entity));
            if (response.status === 201 || response.status === 200) {
                const saved = StationAssembler.toEntityFromResponse(response);
                if (saved?.id) {
                    const idx = stations.value.findIndex(s => s.id === optimisticId);
                    if (idx !== -1) stations.value.splice(idx, 1, saved);
                }
            }
        } catch { /* optimistic entry stays */ }
    }

    async function updateStation(id, data) {
        const idx = stations.value.findIndex(s => s.id === id);
        if (idx !== -1) stations.value[idx] = new Station({ ...stations.value[idx], ...data });
        tickets.value.forEach(t => {
            if (t.stationId === id) t.stationName = data.name ?? t.stationName;
        });
        try {
            await api.update(id, { name: data.name, description: data.description, color: data.color, is_active: data.isActive });
        } catch { /* local change kept */ }
    }

    async function removeStation(id) {
        // Guard: cannot remove a station that has active (received/preparing) tickets
        const hasActiveTickets = tickets.value.some(
            t => t.stationId === id &&
                (t.status === TICKET_STATUS.RECEIVED || t.status === TICKET_STATUS.PREPARING)
        );
        if (hasActiveTickets) return;
        stations.value = stations.value.filter(s => s.id !== id);
        try {
            await api.delete(id);
        } catch { /* local change kept */ }
    }

    function selectStation(id) {
        selectedStationId.value = selectedStationId.value === id ? null : id;
    }

    // ── Ticket Actions ────────────────────────────────────────────────────
    /**
     * Avanza received → preparing → ready → delivered.
     * Al llegar a 'delivered' el ticket pasa al historial en lugar de borrarse.
     */
    function advanceTicket(ticketId) {
        const ticket = tickets.value.find(t => t.id === ticketId);
        if (!ticket) return;
        if (ticket.status === TICKET_STATUS.RECEIVED) {
            ticket.status    = TICKET_STATUS.PREPARING;
            ticket.startedAt = new Date();
        } else if (ticket.status === TICKET_STATUS.PREPARING) {
            ticket.status  = TICKET_STATUS.READY;
            ticket.readyAt = new Date();
        } else if (ticket.status === TICKET_STATUS.READY) {
            ticket.status      = TICKET_STATUS.DELIVERED;
            ticket.deliveredAt = new Date();
            // Persist DELIVERED immediately so a page refresh still shows it in history.
            // The brief UI delay is purely visual — the API call happens synchronously here.
            api.updateTicketStatus(ticketId, TICKET_STATUS.DELIVERED).catch(() => {});
            // Mark as ready to archive — the view layer handles the visual delay
            ticket.readyToArchive = true;
            return; // API call already fired above — skip the generic call below
        }
        api.updateTicketStatus(ticketId, ticket.status).catch(() => { /* local change kept */ });
    }

    /**
     * Cancela un ticket activo (received | preparing) con motivo opcional.
     * Lo mueve al historial inmediatamente.
     */
    function cancelTicket(ticketId, reason = '') {
        const ticket = tickets.value.find(t => t.id === ticketId);
        if (!ticket || ticket.status === TICKET_STATUS.DELIVERED || ticket.status === TICKET_STATUS.CANCELLED) return;
        ticket.status       = TICKET_STATUS.CANCELLED;
        ticket.cancelledAt  = new Date();
        ticket.cancelReason = reason;
        ticketHistory.value.unshift(new StationTicket({ ...ticket }));
        tickets.value = tickets.value.filter(t => t.id !== ticketId);
        api.cancelTicket(ticketId, reason).catch(() => { /* local change kept */ });
    }

    /** Moves a delivered ticket to history (called internally after delay). */
    function archiveTicket(ticketId) {
        const ticket = tickets.value.find(t => t.id === ticketId);
        if (!ticket) return;
        ticketHistory.value.unshift(new StationTicket({ ...ticket }));
        tickets.value = tickets.value.filter(t => t.id !== ticketId);
    }

    /**
     * Recibe los ítems de una venta agrupados por estación y crea tickets.
     * Ítems sin stationId van a la estación "Sin estación asignada" y generan
     * una advertencia (visible en el panel de cocina) en lugar de perderse.
     */
    function sendSaleToStations(sale, tableNumber) {
        if (!sale || sale.items.length === 0) return;

        const groups = {};
        sale.items.forEach(item => {
            const key = item.stationId ?? 'unassigned';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        const newTickets = [];
        Object.entries(groups).forEach(([key, items]) => {
            const sid     = key === 'unassigned' ? null : Number(key);
            const station = sid !== null ? stations.value.find(s => s.id === sid) : null;
            const ticket  = new StationTicket({
                id:          crypto.randomUUID(),
                stationId:   sid,
                stationName: station?.name ?? '⚠ Sin estación asignada',
                saleId:      sale.id,
                tableNumber: tableNumber ?? null,
                items:       items.map(i => new StationTicketItem({
                    menuItemId:   i.menuItemId,
                    menuItemName: i.menuItemName,
                    quantity:     i.quantity,
                    note:         i.note,
                })),
                status:    TICKET_STATUS.RECEIVED,
                createdAt: new Date(),
            });
            tickets.value.push(ticket);
            newTickets.push(ticket);
            ticketCountToday.value++;
        });
        // Reconcile temporary UUIDs with backend IDs when the API responds
        api.sendToStations(sale.id, newTickets)
            .then(response => {
                const saved = response?.data?.data ?? response?.data ?? [];
                if (Array.isArray(saved)) {
                    newTickets.forEach((ticket, idx) => {
                        if (saved[idx]?.id) ticket.id = saved[idx].id;
                    });
                }
            })
            .catch(() => { /* local tickets kept with temporary UUIDs */ });
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
                } else {
                    api.updateTicketStatus(ticket.id, ticket.status).catch(() => {});
                }
                break;
            }
        }
    }

    return {
        // State
        stations, tickets, ticketHistory, selectedStationId, isLoading, error,
        // Getters
        activeStations, filteredTickets, filteredHistory,
        receivedTickets, preparingTickets, readyTickets, deliveredTickets,
        totalToday, readyCount,
        // Station actions
        fetchAll, createStation, updateStation, removeStation, selectStation,
        // Ticket actions
        advanceTicket, cancelTicket, archiveTicket, sendSaleToStations, removeTicket, notifyItemCancelled,
    };
});
