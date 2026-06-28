import { computed } from 'vue';
import { useCompanyStore } from '../../company/application/company.store.js';
import {
    DEFAULT_ENTITLEMENTS,
    RESTRICTED_ENTITLEMENTS,
    isReportTypeAllowed,
    isRouteAllowedByPlan,
    resolvePlanEntitlements,
} from '../presentation/constants/subscription-entitlements.constants.js';

export function useSubscriptionEntitlements() {
    const companyStore = useCompanyStore();

    const entitlements = computed(() =>
        resolvePlanEntitlements(
            companyStore.subscriptionSummary,
            companyStore.features,
        ),
    );

    const subscriptionLoaded = computed(() => companyStore.subscriptionSummary != null);

    function canAccessRoute(path) {
        return isRouteAllowedByPlan(path, entitlements.value);
    }

    function canUseReportType(type) {
        return isReportTypeAllowed(type, entitlements.value);
    }

    return {
        entitlements,
        subscriptionLoaded,
        canAccessRoute,
        canUseReportType,
        restricted: RESTRICTED_ENTITLEMENTS,
        defaults: DEFAULT_ENTITLEMENTS,
    };
}
