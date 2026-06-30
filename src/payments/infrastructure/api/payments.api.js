import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

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
    delete(paymentId)       { return this.#crud.delete(paymentId); }

    createRefund(paymentId, body) {
        return this.#crud.postAt(`${this.#crud.endpointPath}/${paymentId}/refunds`, body);
    }

    previewRefund(paymentId, body) {
        return this.#crud.postAt(`${this.#crud.endpointPath}/${paymentId}/refunds/preview`, body);
    }

    listRefunds(paymentId) {
        return this.#crud.listAt(`${this.#crud.endpointPath}/${paymentId}/refunds`);
    }
}

export const paymentsApi = new PaymentsApi();
