export class PlatformDashboard {
    constructor({
        pendingRequestsCount = 0,
        activeCompaniesCount = 0,
        graceCompaniesCount = 0,
        expiredCompaniesCount = 0,
    } = {}) {
        this.pendingRequestsCount = pendingRequestsCount;
        this.activeCompaniesCount = activeCompaniesCount;
        this.graceCompaniesCount = graceCompaniesCount;
        this.expiredCompaniesCount = expiredCompaniesCount;
    }
}
