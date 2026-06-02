import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrustructure/env.js';

export class PaymentsApi extends BaseApi {
    #crud;

    constructor() {
        super();
        this.#crud = new BaseEndpoint(this, apiEnv.payments);
    }

    listByBranch(branchId, params) {
        return this.#crud.listAt(`/branches/${branchId}/payments`, params);
    }

    getById(paymentId)      { return this.#crud.getById(paymentId); }
    create(resource)        { return this.#crud.create(resource); }
    update(paymentId, body) { return this.#crud.update(paymentId, body); }

    createRefund(paymentId, body) {
        return this.#crud.postAt(`${this.#crud.endpointPath}/${paymentId}/refunds`, body);
    }

    previewRefund(paymentId, body) {
        return this.#crud.postAt(`${this.#crud.endpointPath}/${paymentId}/refunds/preview`, body);
    }

    listRefunds(paymentId) {
        return this.#crud.getAt(`${this.#crud.endpointPath}/${paymentId}/refunds`);
    }
}

export const paymentsApi = new PaymentsApi();
