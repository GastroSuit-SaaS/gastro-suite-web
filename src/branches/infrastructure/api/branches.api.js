import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

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
