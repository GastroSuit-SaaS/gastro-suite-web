import { computed } from 'vue';
import { useShellFacade } from '../../application/shell.facade.js';
import {
    RESTRICTED_ENTITLEMENTS,
    isReportTypeAllowed,
    isRouteAllowedByPlan,
    resolvePlanEntitlements,
} from '../constants/subscription-entitlements.constants.js';

export function useSubscriptionEntitlements() {
    const shell = useShellFacade();

    const entitlements = computed(() =>
        resolvePlanEntitlements(
            shell.subscriptionSummary.value,
            shell.features.value,
        ),
    );

    const subscriptionLoaded = computed(() => shell.subscriptionFetchAttempted.value);

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
    };
}
