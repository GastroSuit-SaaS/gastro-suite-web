import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrastructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrastructure/env.js';

export class UsersApi extends BaseApi {
    #crud;

    constructor() {
        super();
        this.#crud = new BaseEndpoint(this, apiEnv.employees);
    }

    listByCompany(companyId, params) {
        return this.#crud.listAt(`/companies/${companyId}/employees`, params);
    }

    listByBranch(branchId, params) {
        return this.#crud.listAt(`/branches/${branchId}/employees`, params);
    }

    getById(employeeId)      { return this.#crud.getById(employeeId); }
    create(resource)           { return this.#crud.create(resource); }
    update(employeeId, body)   { return this.#crud.update(employeeId, body); }
    delete(employeeId)         { return this.#crud.delete(employeeId); }
}

export const usersApi = new UsersApi();
