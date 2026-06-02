/**
 * Dashboard Infrastructure - API Service
 *
 * Responsabilidad: Comunicación HTTP con el backend del módulo Dashboard.
 * NO contiene lógica de negocio.
 *
 * NOTA: Actualmente NO se usa — el dashboard agrega datos de sub-stores.
 * Reservada para cuando el backend provea GET /dashboard/metrics
 * con métricas pre-calculadas server-side.
 */

import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrustructure/env.js';

export class DashboardApi extends BaseApi {
    #endpoint;

    constructor() {
        super();
        this.#endpoint = new BaseEndpoint(this, apiEnv.dashboard);
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
}

export const dashboardApi = new DashboardApi();
