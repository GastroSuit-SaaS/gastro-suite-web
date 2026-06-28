import { watch, onMounted, onUnmounted } from 'vue';
import { useIamStore } from '../../iam/application/iam.store.js';
import { useCompanyStore } from '../../company/application/company.store.js';
import { ROLES } from '../presentation/constants/roles.constants.js';
import { resolvePlanEntitlements } from '../presentation/constants/subscription-entitlements.constants.js';
import { useNotificationsStore } from '../../communication/application/notifications.store.js';

/**
 * Polling de notificaciones in-app y registro push opcional (FCM web).
 */
export function useNotificationsBootstrap() {
    const iamStore = useIamStore();
    const companyStore = useCompanyStore();
    const notificationsStore = useNotificationsStore();

    function shouldRun() {
        return iamStore.isAuthenticated
            && iamStore.currentUser?.id
            && iamStore.userRole !== ROLES.SYSTEM;
    }

    async function bootstrap() {
        if (!shouldRun()) {
            notificationsStore.stopPolling();
            return;
        }
        await notificationsStore.fetchUnreadCount();
        notificationsStore.startPolling();
        const pushAllowed = resolvePlanEntitlements(
            companyStore.subscriptionSummary,
            companyStore.features,
        ).hasPushNotifications;
        if (pushAllowed) {
            notificationsStore.registerPushTokenIfAvailable();
        }
    }

    onMounted(() => bootstrap());

    onUnmounted(() => {
        notificationsStore.stopPolling();
    });

    watch(
        () => [
            iamStore.isAuthenticated,
            iamStore.currentUser?.id,
            iamStore.userRole,
            companyStore.subscriptionSummary,
            companyStore.features,
        ],
        () => bootstrap(),
    );

    watch(
        () => iamStore.isAuthenticated,
        (authenticated) => {
            if (!authenticated) notificationsStore.$reset();
        },
    );
}
