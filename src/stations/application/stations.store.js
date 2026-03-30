import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Station } from '../domain/models/station.entity.js';
import { StationTicket, StationTicketItem, TICKET_STATUS } from '../domain/models/station-ticket.entity.js';

export { TICKET_STATUS };

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

    const totalToday       = computed(() => tickets.value.length);
    const readyCount       = computed(() => tickets.value.filter(t => t.status === TICKET_STATUS.READY).length);

    // ── Station Actions ───────────────────────────────────────────────────
    function createStation(data) {
        const id = Math.max(0, ...stations.value.map(s => s.id)) + 1;
        stations.value.push(new Station({ id, ...data }));
        // TODO: call api.createStation(data)
    }

    function updateStation(id, data) {
        const idx = stations.value.findIndex(s => s.id === id);
        if (idx !== -1) stations.value[idx] = new Station({ ...stations.value[idx], ...data });
        // Update stationName on existing tickets
        tickets.value.forEach(t => {
            if (t.stationId === id) t.stationName = data.name ?? t.stationName;
        });
        // TODO: call api.updateStation(id, data)
    }

    function removeStation(id) {
        stations.value = stations.value.filter(s => s.id !== id);
        // TODO: call api.deleteStation(id)
    }

    function selectStation(id) {
        selectedStationId.value = selectedStationId.value === id ? null : id;
    }

    // ── Ticket Actions ────────────────────────────────────────────────────
    /**
     * Avanza el ticket al siguiente estado: received → preparing → ready.
     * En estado 'ready' no hace nada.
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
        }
        // TODO: call api.updateTicketStatus(ticketId, ticket.status)
    }

    /**
     * Recibe los ítems de una venta agrupados por estación y crea tickets.
     * Llamado desde el POS al "Enviar a Estaciones".
     * @param {import('../../pos/domain/models/sale.entity.js').Sale} sale
     * @param {number|null} tableNumber
     */
    function sendSaleToStations(sale, tableNumber) {
        if (!sale || sale.items.length === 0) return;

        // Agrupar ítems por stationId
        const groups = {};
        sale.items.forEach(item => {
            const key = item.stationId ?? 0; // 0 = sin estación
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        const baseId = Date.now();
        Object.entries(groups).forEach(([key, items], idx) => {
            const sid     = Number(key) || null;
            const station = stations.value.find(s => s.id === sid);
            tickets.value.push(new StationTicket({
                id:          baseId + idx,
                stationId:   sid,
                stationName: station?.name ?? 'Sin estación',
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
            }));
        });
        // TODO: call api.sendToStations(sale.id, tickets)
    }

    function removeTicket(ticketId) {
        tickets.value = tickets.value.filter(t => t.id !== ticketId);
    }

    return {
        // State
        stations, tickets, selectedStationId, isLoading, error,
        // Getters
        activeStations, filteredTickets,
        receivedTickets, preparingTickets, readyTickets,
        totalToday, readyCount,
        // Station actions
        createStation, updateStation, removeStation, selectStation,
        // Ticket actions
        advanceTicket, sendSaleToStations, removeTicket,
    };
});
