import { watch, onMounted, onUnmounted } from 'vue';
import { useShellFacade } from '../../application/shell.facade.js';
import { ROLES } from '../../domain/roles.js';
import { resolvePlanEntitlements } from '../constants/subscription-entitlements.constants.js';

/**
 * Polling de notificaciones in-app, registro push opcional (FCM web) y STOMP por usuario.
 */
export function useNotificationsBootstrap() {
    const shell = useShellFacade();

    function shouldRun() {
        return shell.isAuthenticated.value && shell.currentUser.value?.id;
    }

    async function bootstrap() {
        if (!shouldRun()) {
            shell.stopNotificationsPolling();
            return;
        }
        await shell.fetchUnreadCount();
        shell.startNotificationsPolling();
        const entitlements = resolvePlanEntitlements(
            shell.subscriptionSummary.value,
            shell.features.value,
        );
        const pushAllowed = shell.userRole.value === ROLES.SYSTEM
            || entitlements.hasPushNotifications
            || import.meta.env.DEV;
        if (pushAllowed) {
            shell.registerPushTokenIfAvailable();
        }
    }

    onMounted(() => bootstrap());

    onUnmounted(() => {
        shell.stopNotificationsPolling();
    });

    watch(
        () => [
            shell.isAuthenticated.value,
            shell.currentUser.value?.id,
            shell.userRole.value,
            shell.subscriptionSummary.value,
            shell.features.value,
        ],
        () => bootstrap(),
    );

    watch(
        () => shell.isAuthenticated.value,
        (authenticated) => {
            if (!authenticated) {
                shell.stopNotificationsPolling();
            }
        },
    );
}
