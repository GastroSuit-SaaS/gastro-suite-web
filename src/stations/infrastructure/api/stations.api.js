/**
 * Stations Infrastructure - API Service
 *
 * Responsabilidad: Comunicación HTTP con el backend del módulo de Estaciones.
 * Maneja endpoints de estaciones de preparación y tickets.
 * NO contiene lógica de negocio.
 *
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class StationsApi extends BaseApi {
    #endpoint;

    constructor() {
        super();
        this.#endpoint = new BaseEndpoint(this, import.meta.env.VITE_STATIONS_ENDPOINT ?? '/stations');
    }

    getAll() {
        return this.#endpoint.getAll();
    }

    getById(id) {
        return this.#endpoint.getById(id);
    }

    create(resource) {
        return this.#endpoint.create(resource);
    }

    update(id, resource) {
        return this.#endpoint.update(id, resource);
    }

    delete(id) {
        return this.#endpoint.delete(id);
    }

    // ── Tickets ───────────────────────────────────────────────────────────
    getTickets(params = {}) {
        return this.http.get(import.meta.env.VITE_TICKETS_ENDPOINT ?? '/stations/tickets', { params });
    }

    updateTicketStatus(id, status) {
        return this.http.patch(`${import.meta.env.VITE_TICKETS_ENDPOINT ?? '/stations/tickets'}/${id}/status`, { status });
    }

    cancelTicket(id, reason) {
        return this.http.patch(`${import.meta.env.VITE_TICKETS_ENDPOINT ?? '/stations/tickets'}/${id}/cancel`, { reason });
    }

    sendToStations(saleId, tickets) {
        return this.http.post(import.meta.env.VITE_TICKETS_ENDPOINT ?? '/stations/tickets', { saleId, tickets });
    }
}

export const stationsApi = new StationsApi();
