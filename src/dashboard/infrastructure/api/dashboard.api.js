import { BaseApi } from '../../../shared/infrustructure/base-api.js';

/** GET /api/v1/branches/{branchId}/dashboard/metrics */
export class DashboardApi extends BaseApi {
    getMetrics(branchId, date) {
        const params = date ? { date } : undefined;
        return this.http.get(`/branches/${branchId}/dashboard/metrics`, { params });
    }

    /** GET /api/v1/branches/{branchId}/dashboard/comparison */
    getComparison(branchId, { date, compare } = {}) {
        const params = {};
        if (date) params.date = date;
        if (compare) params.compare = compare;
        return this.http.get(`/branches/${branchId}/dashboard/comparison`, { params });
    }
}

export const dashboardApi = new DashboardApi();
