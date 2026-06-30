import { PlatformPlan } from '../../domain/models/platform-plan.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

export class PlatformPlanAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new PlatformPlan({
            subscriptionId: r.subscriptionId ?? r.id ?? null,
            subscriptionName: r.subscriptionName ?? r.name ?? '',
            subscriptionPriceMontly: r.subscriptionPriceMontly ?? r.subscriptionPriceMonthly ?? 0,
            subscriptionPriceAnnual: r.subscriptionPriceAnnual ?? 0,
            subscriptionMaxBranches: r.subscriptionMaxBranches ?? 1,
            subscriptionMaxUsers: r.subscriptionMaxUsers ?? 1,
            subscriptionMaxTables: r.subscriptionMaxTables ?? 1,
            subscriptionMaxMenuItems: r.subscriptionMaxMenuItems ?? 1,
            subscriptionHasInventory: r.subscriptionHasInventory === true,
            subscriptionHasReports: r.subscriptionHasReports !== false,
            subscriptionHasReservations: r.subscriptionHasReservations !== false,
            subscriptionHasKitchen: r.subscriptionHasKitchen !== false,
            subscriptionHasDashboardComparison: r.subscriptionHasDashboardComparison === true,
            subscriptionHasExcelExport: r.subscriptionHasExcelExport !== false,
            subscriptionHasPushNotifications: r.subscriptionHasPushNotifications !== false,
            isActive: r.isActive !== false,
            createdAt: r.createdAt ?? null,
            updatedAt: r.updatedAt ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, PlatformPlanAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, PlatformPlanAssembler.toEntityFromResource);
    }
}
