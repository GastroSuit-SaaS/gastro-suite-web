export class SubscriptionRequest {
    constructor({
        requestId = null,
        companyId = null,
        companyName = '',
        companyRuc = '',
        requestType = '',
        planName = '',
        subscriptionType = '',
        paymentReference = '',
        submittedAt = null,
        status = '',
    } = {}) {
        this.requestId = requestId;
        this.companyId = companyId;
        this.companyName = companyName;
        this.companyRuc = companyRuc;
        this.requestType = requestType;
        this.planName = planName;
        this.subscriptionType = subscriptionType;
        this.paymentReference = paymentReference;
        this.submittedAt = submittedAt;
        this.status = status;
    }
}
