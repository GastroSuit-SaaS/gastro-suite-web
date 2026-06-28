import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrustructure/env.js';

export class CompanyApi extends BaseApi {
    #crud;

    constructor() {
        super();
        this.#crud = new BaseEndpoint(this, apiEnv.companies);
    }

    getById(companyId) {
        return this.#crud.getById(companyId);
    }

    update(companyId, body) {
        return this.#crud.update(companyId, body);
    }

    getSubscriptionSummary(companyId) {
        return this.http.get(`${apiEnv.companies}/${companyId}/owner/subscription-summary`);
    }

    listSubscriptionPlans(companyId) {
        return this.http.get(`${apiEnv.companies}/${companyId}/owner/subscription-plans`);
    }

    chooseSubscriptionPlan(companyId, body) {
        return this.http.post(`${apiEnv.companies}/${companyId}/owner/subscription`, body);
    }
}

export const companyApi = new CompanyApi();
