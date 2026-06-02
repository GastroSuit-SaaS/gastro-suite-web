import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class PosApi extends BaseApi {
    #sales;
    #tickets;

    constructor() {
        super();
        this.#sales = new BaseEndpoint(this, import.meta.env.VITE_POS_ENDPOINT ?? '/pos/sales');
        this.#tickets = new BaseEndpoint(this, import.meta.env.VITE_TICKETS_ENDPOINT ?? '/pos/tickets');
    }

    listByBranch(branchId, params) {
        return this.#sales.listAt(`/branches/${branchId}/pos/sales`, params);
    }

    getById(saleId)           { return this.#sales.getById(saleId); }
    create(resource)          { return this.#sales.create(resource); }
    update(saleId, resource)  { return this.#sales.update(saleId, resource); }
    delete(saleId)            { return this.#sales.delete(saleId); }

    cancel(saleId) {
        return this.#sales.update(saleId, { saleStatus: 'CANCELLED' });
    }

    pay(saleId) {
        return this.#sales.update(saleId, { saleStatus: 'PAID' });
    }

    /** Checkout atómico: pago + venta PAID. */
    checkout(saleId, paymentResource) {
        return this.#sales.postSub(saleId, 'checkout', paymentResource);
    }

    checkoutSplit(saleId, body) {
        return this.#sales.postSub(saleId, 'checkout-split', body);
    }

    transfer(saleId, { tableId, zoneId }) {
        return this.#sales.update(saleId, { tableId, zoneId });
    }

    /** Despacho atómico a cocina (tickets + marcar isSent). */
    dispatchToStations(saleId) {
        return this.#sales.postSub(saleId, 'dispatch-to-stations');
    }

    /** Tickets de cocina de una venta (estado RECEIVED → PREPARING → READY…). */
    listKitchenTicketsBySale(branchId, saleId) {
        return this.#tickets.listAt(`/branches/${branchId}/pos/tickets`, { saleId });
    }

    getOperationsConfig() {
        return this.http.get('/pos/operations-config');
    }
}

export const posApi = new PosApi();
