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
    #tablesPath;
    #zonesPath;

    constructor() {
        super();
        this.#tablesPath = import.meta.env.VITE_TABLES_ENDPOINT ?? '/tables';
        this.#zonesPath  = import.meta.env.VITE_ZONES_ENDPOINT  ?? '/zones';
        this.#endpoint = new BaseEndpoint(this, this.#tablesPath);
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
        return this.http.patch(`${this.#tablesPath}/${id}/status`, { status });
    }

    assign(id, { seatedGuests }) {
        return this.http.patch(`${this.#tablesPath}/${id}/assign`, { seatedGuests });
    }

    free(id) {
        return this.http.patch(`${this.#tablesPath}/${id}/free`);
    }

    // ── Zones ─────────────────────────────────────────────────────────────
    getZones() {
        return this.http.get(this.#zonesPath);
    }

    createZone(data) {
        return this.http.post(this.#zonesPath, data);
    }

    updateZone(id, data) {
        return this.http.put(`${this.#zonesPath}/${id}`, data);
    }

    deleteZone(id) {
        return this.http.delete(`${this.#zonesPath}/${id}`);
    }
}
