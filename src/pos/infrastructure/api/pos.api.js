import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

export class PosApi extends BaseApi {
    #sales;
    #tickets;

    constructor() {
        super();
        this.#sales = new BaseEndpoint(this, apiEnv.posSales);
        this.#tickets = new BaseEndpoint(this, apiEnv.posTickets);
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
        return this.#sales.postSub(saleId, 'transfer-table', { tableId, zoneId });
    }

    /** Despacho atómico a cocina (tickets + marcar isSent). */
    dispatchToStations(saleId) {
        return this.#sales.postSub(saleId, 'dispatch-to-stations');
    }

    updateDeliveryStatus(saleId, deliveryStatus) {
        return this.#sales.patchSub(saleId, 'delivery-status', {
            deliveryStatus: String(deliveryStatus).toUpperCase(),
        });
    }

    /** Tickets de cocina de una venta (estado RECEIVED → PREPARING → READY…). */
    listKitchenTicketsBySale(branchId, saleId) {
        return this.#tickets.listAt(`/branches/${branchId}/pos/tickets`, { saleId });
    }

    getOperationsConfig() {
        return this.http.get(apiEnv.posOperationsConfig);
    }
}

export const posApi = new PosApi();
