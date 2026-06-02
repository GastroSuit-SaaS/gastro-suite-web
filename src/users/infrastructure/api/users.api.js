import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';

export class UsersApi extends BaseApi {
    #crud;

    constructor() {
        super();
        this.#crud = new BaseEndpoint(this, import.meta.env.VITE_USERS_ENDPOINT ?? '/employees');
    }

    listByCompany(companyId, params) {
        return this.#crud.listAt(`/companies/${companyId}/employees`, params);
    }

    getById(employeeId)      { return this.#crud.getById(employeeId); }
    create(resource)           { return this.#crud.create(resource); }
    update(employeeId, body)   { return this.#crud.update(employeeId, body); }
    delete(employeeId)         { return this.#crud.delete(employeeId); }
}

export const usersApi = new UsersApi();
