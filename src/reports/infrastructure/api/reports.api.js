import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class ReportsApi extends BaseApi {
    #crud;

    constructor() {
        super();
        this.#crud = new BaseEndpoint(this, import.meta.env.VITE_REPORTS_ENDPOINT ?? '/reports');
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
