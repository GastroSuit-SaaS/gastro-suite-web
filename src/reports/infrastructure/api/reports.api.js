import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

export class ReportsApi extends BaseApi {
    #crud;

    constructor() {
        super();
        this.#crud = new BaseEndpoint(this, apiEnv.reports);
    }

    listByBranch(branchId, params) {
        return this.#crud.listAt(`/branches/${branchId}/reports`, params);
    }

    getById(reportId)      { return this.#crud.getById(reportId); }
    create(resource)       { return this.#crud.create(resource); }
    update(reportId, body) { return this.#crud.update(reportId, body); }
    delete(reportId)       { return this.#crud.delete(reportId); }
}

export const reportsApi = new ReportsApi();
