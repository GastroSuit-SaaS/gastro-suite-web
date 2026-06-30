import { BaseApi } from '../../../shared/infrastructure/base-api.js';

/** GET /api/v1/roles — catálogo de roles (support; puede no existir fuera de profile dev). */
export class RolesApi extends BaseApi {
    list() {
        return this.http.get('/roles', { skipSessionLogout: true });
    }
}

export const rolesApi = new RolesApi();
