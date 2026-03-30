/**
 * Payments Infrastructure - API Service
 * 
 * Responsabilidad: Comunicación HTTP con el backend del módulo Payments.
 * Maneja endpoints de pagos, métodos de pago, transacciones, etc.
 * NO contiene lógica de negocio.
 * 
 * Usa assemblers para transformar datos API ⇄ Dominio.
 */

import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class PaymentsApi extends BaseApi {
    #endpoint;
    #path;

    constructor() {
        super();
        this.#path     = import.meta.env.VITE_PAYMENTS_ENDPOINT ?? '/payments';
        this.#endpoint = new BaseEndpoint(this, this.#path);
    }

    getAll() {
        return this.#endpoint.getAll();
    }

    getById(id) {
        return this.#endpoint.getById(id);
    }

    /** Endpoint dedicado para registrar un pago procesado desde el POS. */
    processPayment(resource) {
        return this.#endpoint.create(resource);
    }

    /**
     * Emite un reembolso sobre un pago existente.
     * @param {number|string} id  - ID del pago original
     * @param {string} reason     - Motivo del reembolso
     */
    refund(id, reason = '') {
        return this.http.post(`${this.#path}/${id}/refund`, { reason });
    }

    /**
     * Recupera pagos en un rango de fechas (ISO strings).
     * @param {string} from - fecha inicio (YYYY-MM-DD)
     * @param {string} to   - fecha fin   (YYYY-MM-DD)
     */
    getByDateRange(from, to) {
        return this.http.get(this.#path, { params: { from, to } });
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

export const paymentsApi = new PaymentsApi();
