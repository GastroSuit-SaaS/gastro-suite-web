/**
 * POS Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo POS.
 * Maneja endpoints de ventas, tickets, productos en venta, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class PosApi extends BaseApi {
    #endpoint;
    #path;

    constructor() {
        super();
        this.#path     = import.meta.env.VITE_POS_ENDPOINT ?? '/pos/sales';
        this.#endpoint = new BaseEndpoint(this, this.#path);
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

    /** PATCH /pos/sales/:id/cancel — cierra la venta por cancelación. */
    cancel(id) {
        return this.http.patch(`${this.#path}/${id}/cancel`);
    }

    /** PATCH /pos/sales/:id/pay — marca la venta como PAID en el backend. */
    pay(id, paymentSummary) {
        return this.http.patch(`${this.#path}/${id}/pay`, paymentSummary);
    }
}

export const posApi = new PosApi();
