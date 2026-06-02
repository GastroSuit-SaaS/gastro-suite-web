import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrustructure/env.js';

export class BranchesApi extends BaseApi {
    #crud;

    constructor() {
        super();
        this.#crud = new BaseEndpoint(this, apiEnv.branches);
    }

    listByCompany(companyId, params) {
        return this.#crud.listAt(`/companies/${companyId}/branches`, params);
    }

    getById(branchId)       { return this.#crud.getById(branchId); }
    create(resource)        { return this.#crud.create(resource); }
    update(branchId, body)  { return this.#crud.update(branchId, body); }
    delete(branchId)        { return this.#crud.delete(branchId); }
}

export const branchesApi = new BranchesApi();
