export class PlatformCompanyOverview {
    constructor({
        companyId = null,
        companyName = '',
        companyRuc = '',
        subscriptionId = null,
        planName = '',
        subscriptionType = '',
        accessState = 'NONE',
        endDate = null,
        pendingRequestId = null,
    } = {}) {
        this.companyId = companyId;
        this.companyName = companyName;
        this.companyRuc = companyRuc;
        this.subscriptionId = subscriptionId;
        this.planName = planName;
        this.subscriptionType = subscriptionType;
        this.accessState = accessState;
        this.endDate = endDate;
        this.pendingRequestId = pendingRequestId;
    }
}
