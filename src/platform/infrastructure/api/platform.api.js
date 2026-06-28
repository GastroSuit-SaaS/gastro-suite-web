import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { apiEnv } from '../../../shared/infrustructure/env.js';

export class PlatformApi extends BaseApi {
    getBootstrapStatus() {
        return this.get(`${apiEnv.platform}/bootstrap/status`);
    }

    bootstrap(payload) {
        return this.post(`${apiEnv.platform}/bootstrap`, payload);
    }

    listAdmins() {
        return this.get(`${apiEnv.platform}/admins`);
    }

    createAdmin(payload) {
        return this.post(`${apiEnv.platform}/admins`, payload);
    }

    listCompanies() {
        return this.get(`${apiEnv.platform}/companies`);
    }

    listSubscriptionPlans() {
        return this.get(apiEnv.subscriptions);
    }

    createSubscriptionPlan(payload) {
        return this.post(apiEnv.subscriptions, payload);
    }

    updateSubscriptionPlan(id, payload) {
        return this.patch(`${apiEnv.subscriptions}/${id}`, payload);
    }

    deleteSubscriptionPlan(id) {
        return this.delete(`${apiEnv.subscriptions}/${id}`);
    }

    assignCompanySubscription(payload) {
        return this.post(`${apiEnv.subscriptions}/companies`, payload);
    }

    updateCompanySubscription(companyId, payload) {
        return this.patch(`${apiEnv.subscriptions}/companies/${companyId}`, payload);
    }
}
