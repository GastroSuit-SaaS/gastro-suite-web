/**
 * Tables Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Tables.
 * Maneja endpoints de mesas, reservas, asignaciones, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class TablesApi extends BaseApi {
    #endpoint;

    constructor() {
        super();
        // TODO: set the correct environment variable for this endpoint path
        this.#endpoint = new BaseEndpoint(this, import.meta.env.VITE_TABLES_ENDPOINT ?? '/tables');
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

    // ── Status transitions ────────────────────────────────────────────────
    updateStatus(id, status) {
        return this.http.patch(`${import.meta.env.VITE_TABLES_ENDPOINT ?? '/tables'}/${id}/status`, { status });
    }

    assign(id, { seatedGuests }) {
        return this.http.patch(`${import.meta.env.VITE_TABLES_ENDPOINT ?? '/tables'}/${id}/assign`, { seatedGuests });
    }

    free(id) {
        return this.http.patch(`${import.meta.env.VITE_TABLES_ENDPOINT ?? '/tables'}/${id}/free`);
    }

    // ── Zones ─────────────────────────────────────────────────────────────
    getZones() {
        return this.http.get(import.meta.env.VITE_ZONES_ENDPOINT ?? '/zones');
    }

    createZone(data) {
        return this.http.post(import.meta.env.VITE_ZONES_ENDPOINT ?? '/zones', data);
    }

    updateZone(id, data) {
        return this.http.put(`${import.meta.env.VITE_ZONES_ENDPOINT ?? '/zones'}/${id}`, data);
    }

    deleteZone(id) {
        return this.http.delete(`${import.meta.env.VITE_ZONES_ENDPOINT ?? '/zones'}/${id}`);
    }
}

export const tablesApi = new TablesApi();
