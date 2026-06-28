import { BaseApi } from '../../../shared/infrustructure/base-api.js';
import { BaseEndpoint } from '../../../shared/infrustructure/base-endpoint.js';
import { apiEnv } from '../../../shared/infrustructure/env.js';

export class PlatformApi extends BaseApi {
    #platform;
    #subscriptions;

    constructor() {
        super();
        this.#platform = new BaseEndpoint(this, apiEnv.platform);
        this.#subscriptions = new BaseEndpoint(this, apiEnv.subscriptions);
    }

    getBootstrapStatus() {
        return this.http.get(`${apiEnv.platform}/bootstrap/status`);
    }

    bootstrap(payload) {
        return this.http.post(`${apiEnv.platform}/bootstrap`, payload);
    }

    listAdmins() {
        return this.#platform.listAt(`${apiEnv.platform}/admins`);
    }

    createAdmin(payload) {
        return this.#platform.postAt(`${apiEnv.platform}/admins`, payload);
    }

    getDashboard() {
        return this.#platform.listAt(`${apiEnv.platform}/dashboard`);
    }

    listCompanyOverviews() {
        return this.#platform.listAt(`${apiEnv.platform}/companies/overview`);
    }

    listPendingSubscriptionRequests() {
        return this.#platform.listAt(`${apiEnv.platform}/subscription-requests`);
    }

    approveSubscriptionRequest(requestId, adminNotes = '') {
        return this.#platform.postAt(`${apiEnv.platform}/subscription-requests/${requestId}/approve`, { adminNotes });
    }

    rejectSubscriptionRequest(requestId, adminNotes = '') {
        return this.#platform.postAt(`${apiEnv.platform}/subscription-requests/${requestId}/reject`, { adminNotes });
    }

    listAuditLogs() {
        return this.#platform.listAt(`${apiEnv.platform}/audit-logs`);
    }

    listCompanies() {
        return this.#platform.listAt(`${apiEnv.platform}/companies`);
    }

    listSubscriptionPlans() {
        return this.#platform.listAt(`${apiEnv.platform}/subscription-plans`);
    }

    createSubscriptionPlan(payload) {
        return this.#platform.postAt(`${apiEnv.platform}/subscription-plans`, payload);
    }

    updateSubscriptionPlan(id, payload) {
        return this.http.patch(`${apiEnv.platform}/subscription-plans/${id}`, payload);
    }

    deleteSubscriptionPlan(id) {
        return this.http.delete(`${apiEnv.platform}/subscription-plans/${id}`);
    }

    assignCompanySubscription(payload) {
        return this.#subscriptions.postAt(`${apiEnv.subscriptions}/companies`, payload);
    }

    updateCompanySubscription(companyId, payload) {
        return this.http.patch(`${apiEnv.subscriptions}/companies/${companyId}`, payload);
    }
}
