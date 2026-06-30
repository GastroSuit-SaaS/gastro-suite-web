export class Company {
    constructor({
        id = null,
        companyRuc = '',
        companyName = '',
        companyTradeName = '',
        companyAddress = '',
        companyPhone = '',
        companyEmail = '',
        isActive = true,
    } = {}) {
        this.id = id;
        this.companyRuc = companyRuc;
        this.companyName = companyName;
        this.companyTradeName = companyTradeName;
        this.companyAddress = companyAddress;
        this.companyPhone = companyPhone;
        this.companyEmail = companyEmail;
        this.isActive = isActive;
    }
}
