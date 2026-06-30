export class PlatformPlan {
    constructor({
        subscriptionId = null,
        subscriptionName = '',
        subscriptionPriceMontly = 0,
        subscriptionPriceAnnual = 0,
        subscriptionMaxBranches = 1,
        subscriptionMaxUsers = 1,
        subscriptionMaxTables = 1,
        subscriptionMaxMenuItems = 1,
        subscriptionHasInventory = false,
        subscriptionHasReports = false,
        subscriptionHasReservations = false,
        subscriptionHasKitchen = false,
        subscriptionHasDashboardComparison = false,
        subscriptionHasExcelExport = false,
        subscriptionHasPushNotifications = false,
        isActive = true,
        createdAt = null,
        updatedAt = null,
    } = {}) {
        this.subscriptionId = subscriptionId;
        this.subscriptionName = subscriptionName;
        this.subscriptionPriceMontly = subscriptionPriceMontly;
        this.subscriptionPriceAnnual = subscriptionPriceAnnual;
        this.subscriptionMaxBranches = subscriptionMaxBranches;
        this.subscriptionMaxUsers = subscriptionMaxUsers;
        this.subscriptionMaxTables = subscriptionMaxTables;
        this.subscriptionMaxMenuItems = subscriptionMaxMenuItems;
        this.subscriptionHasInventory = subscriptionHasInventory;
        this.subscriptionHasReports = subscriptionHasReports;
        this.subscriptionHasReservations = subscriptionHasReservations;
        this.subscriptionHasKitchen = subscriptionHasKitchen;
        this.subscriptionHasDashboardComparison = subscriptionHasDashboardComparison;
        this.subscriptionHasExcelExport = subscriptionHasExcelExport;
        this.subscriptionHasPushNotifications = subscriptionHasPushNotifications;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
