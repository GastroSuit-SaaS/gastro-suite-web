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

    // TODO: add stations-specific methods (updateOrderStatus, assignStation, etc.)
}

export const stationsApi = new StationsApi();
