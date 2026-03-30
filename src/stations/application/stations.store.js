import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { StationsApi } from '../infrastructure/api/stations.api.js';
import { StationAssembler } from '../infrastructure/assemblers/station.assembler.js';
import { StationTicketAssembler } from '../infrastructure/assemblers/station-ticket.assembler.js';
import { Station } from '../domain/models/station.entity.js';
import { StationTicket, StationTicketItem, TICKET_STATUS } from '../domain/models/station-ticket.entity.js';

export { TICKET_STATUS };

const api = new StationsApi();

// Statuses that are still active on the live kanban
const ACTIVE_STATUSES = new Set([TICKET_STATUS.RECEIVED, TICKET_STATUS.PREPARING, TICKET_STATUS.READY, TICKET_STATUS.DELIVERED]);

export const useStationsStore = defineStore('stations', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const stations          = ref([
        new Station({ id: 1, name: 'Cocina Caliente', description: 'Platos salteados, fritos y a la plancha', color: '#ef4444', isActive: true }),
        new Station({ id: 2, name: 'Cocina Fría',     description: 'Ceviches, ensaladas y entradas frías',   color: '#10b981', isActive: true }),
        new Station({ id: 3, name: 'Pastelería',      description: 'Postres, pasteles y repostería',         color: '#ec4899', isActive: true }),
        new Station({ id: 4, name: 'Bar',             description: 'Bebidas frías, calientes y cócteles',    color: '#8b5cf6', isActive: true }),
        new Station({ id: 5, name: 'Pastas',          description: 'Pastas, arroces y risottos',             color: '#f59e0b', isActive: true }),
    ]);

    const tickets           = ref([
        // Mesa 2 — Orden 1201 (45 min)
        new StationTicket({ id: 1, stationId: 1, stationName: 'Cocina Caliente', saleId: 1201, tableNumber: 2, items: [{ menuItemId: 3, menuItemName: 'Lomo Saltado',     quantity: 2, note: '' }, { menuItemId: 4, menuItemName: 'Pollo a la Brasa', quantity: 1, note: 'Bien cocido' }], status: TICKET_STATUS.PREPARING, createdAt: new Date(Date.now() - 43 * 60000), startedAt: new Date(Date.now() - 30 * 60000) }),
        new StationTicket({ id: 2, stationId: 2, stationName: 'Cocina Fría',     saleId: 1201, tableNumber: 2, items: [{ menuItemId: 1, menuItemName: 'Ceviche Clásico',  quantity: 2, note: '' }],                                                                                             status: TICKET_STATUS.READY,     createdAt: new Date(Date.now() - 43 * 60000), startedAt: new Date(Date.now() - 38 * 60000), readyAt: new Date(Date.now() - 22 * 60000) }),
        new StationTicket({ id: 3, stationId: 4, stationName: 'Bar',             saleId: 1201, tableNumber: 2, items: [{ menuItemId: 10, menuItemName: 'Limonada de la Casa', quantity: 2, note: 'Sin azúcar' }],                                                                              status: TICKET_STATUS.READY,     createdAt: new Date(Date.now() - 43 * 60000), startedAt: new Date(Date.now() - 42 * 60000), readyAt: new Date(Date.now() - 38 * 60000) }),
        // Mesa 4 — Orden 1215 (72 min)
        new StationTicket({ id: 4, stationId: 1, stationName: 'Cocina Caliente', saleId: 1215, tableNumber: 4, items: [{ menuItemId: 3, menuItemName: 'Lomo Saltado',     quantity: 1, note: '' }, { menuItemId: 5, menuItemName: 'Salmón al Limón', quantity: 2, note: '' }],               status: TICKET_STATUS.READY,     createdAt: new Date(Date.now() - 70 * 60000), startedAt: new Date(Date.now() - 65 * 60000), readyAt: new Date(Date.now() - 45 * 60000) }),
        new StationTicket({ id: 5, stationId: 5, stationName: 'Pastas',          saleId: 1215, tableNumber: 4, items: [{ menuItemId: 6, menuItemName: 'Pasta Alfredo',    quantity: 2, note: '' }, { menuItemId: 7, menuItemName: 'Lasagna Boloñesa', quantity: 1, note: '' }],              status: TICKET_STATUS.PREPARING, createdAt: new Date(Date.now() - 70 * 60000), startedAt: new Date(Date.now() - 50 * 60000) }),
        // Mesa 8 — Orden 1246 (38 min)
        new StationTicket({ id: 6, stationId: 1, stationName: 'Cocina Caliente', saleId: 1246, tableNumber: 8, items: [{ menuItemId: 4, menuItemName: 'Pollo a la Brasa', quantity: 2, note: '' }],                                                                                           status: TICKET_STATUS.RECEIVED,  createdAt: new Date(Date.now() -  5 * 60000) }),
        new StationTicket({ id: 7, stationId: 4, stationName: 'Bar',             saleId: 1246, tableNumber: 8, items: [{ menuItemId: 10, menuItemName: 'Limonada de la Casa', quantity: 3, note: '' }],                                                                                       status: TICKET_STATUS.PREPARING, createdAt: new Date(Date.now() -  5 * 60000), startedAt: new Date(Date.now() -  3 * 60000) }),
    ]);

    // ── History (delivered + cancelled — never deleted) ───────────────────
    const ticketHistory     = ref([]);
    // Persistent counter so totalToday never decreases
    const ticketCountToday  = ref(tickets.value.length);

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
            const [stationsResp, ticketsResp] = await Promise.all([
                api.getAll(),
                api.getTickets({ status: 'active' }),
            ]);
            stations.value = StationAssembler.toEntitiesFromResponse(stationsResp);
            const fetched  = StationTicketAssembler.toEntitiesFromResponse(ticketsResp);
            // Separate active kanban tickets from archived ones
            tickets.value       = fetched.filter(t => ACTIVE_STATUSES.has(t.status) && t.status !== TICKET_STATUS.DELIVERED);
            ticketHistory.value = fetched.filter(t => t.status === TICKET_STATUS.DELIVERED || t.status === TICKET_STATUS.CANCELLED);
            ticketCountToday.value = Math.max(ticketCountToday.value, tickets.value.length + ticketHistory.value.length);
        } catch (e) {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                // mock data already set in initial refs
            } else {
                error.value = e?.response?.data?.message ?? 'Error al cargar las estaciones';
            }
        } finally {
            isLoading.value = false;
        }
    }

    async function createStation(data) {
        const optimisticId = Math.max(0, ...stations.value.map(s => s.id)) + 1;
        stations.value.push(new Station({ id: optimisticId, ...data }));
        try {
            const response = await api.create({ name: data.name, description: data.description, color: data.color, is_active: data.isActive });
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
            // Move to history after a brief delay so the transition is visible
            setTimeout(() => archiveTicket(ticketId), 3000);
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
        ticketHistory.value.unshift({ ...ticket });
        tickets.value = tickets.value.filter(t => t.id !== ticketId);
        api.cancelTicket(ticketId, reason).catch(() => { /* local change kept */ });
    }

    /** Moves a delivered ticket to history (called internally after delay). */
    function archiveTicket(ticketId) {
        const ticket = tickets.value.find(t => t.id === ticketId);
        if (!ticket) return;
        ticketHistory.value.unshift({ ...ticket });
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

        const baseId = Date.now();
        const newTickets = [];
        Object.entries(groups).forEach(([key, items], idx) => {
            const sid     = key === 'unassigned' ? null : Number(key);
            const station = sid !== null ? stations.value.find(s => s.id === sid) : null;
            const ticket  = new StationTicket({
                id:          baseId + idx,
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
        api.sendToStations(sale.id, newTickets).catch(() => { /* local change kept */ });
    }

    /** @deprecated Use cancelTicket() instead — removeTicket hard-deletes with no history. */
    function removeTicket(ticketId) {
        tickets.value = tickets.value.filter(t => t.id !== ticketId);
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
        advanceTicket, cancelTicket, archiveTicket, sendSaleToStations, removeTicket,
    };
});
