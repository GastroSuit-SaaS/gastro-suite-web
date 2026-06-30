import { onMounted, onUnmounted, watch } from 'vue';
import { useShellFacade } from '../../application/shell.facade.js';
import { ROLES } from '../../domain/roles.js';
import { apiEnv } from '../../infrastructure/env.js';

/**
 * Refresca solicitudes y dashboard de plataforma cuando llega una notificación in-app (STOMP).
 */
export function usePlatformNotificationsSync() {
    if (!apiEnv.platformEnabled) return;

    const shell = useShellFacade();

    async function refreshPlatformData() {
        if (shell.userRole.value !== ROLES.SYSTEM) return;
        try {
            await Promise.all([
                shell.reloadPendingRequests(),
                shell.reloadPlatformDashboard(),
            ]);
        } catch {
            /* datos opcionales */
        }
    }

    function onNotificationsUpdated() {
        refreshPlatformData();
    }

    onMounted(() => {
        window.addEventListener('gastro:notifications-updated', onNotificationsUpdated);
    });

    onUnmounted(() => {
        window.removeEventListener('gastro:notifications-updated', onNotificationsUpdated);
    });

    watch(
        () => shell.userRole.value,
        (role) => {
            if (role === ROLES.SYSTEM) {
                refreshPlatformData();
            }
        },
        { immediate: true },
    );
}
