/**
 * Kitchen Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Kitchen.
 * Maneja endpoints de órdenes, preparación, estaciones, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class KitchenApi extends BaseApi {
    #endpoint;

    constructor() {
        super();
        // TODO: set the correct environment variable for this endpoint path
        this.#endpoint = new BaseEndpoint(this, import.meta.env.VITE_KITCHEN_ENDPOINT ?? '/kitchen/orders');
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

    // TODO: add kitchen-specific methods (updateOrderStatus, assignStation, etc.)
}

export const kitchenApi = new KitchenApi();
