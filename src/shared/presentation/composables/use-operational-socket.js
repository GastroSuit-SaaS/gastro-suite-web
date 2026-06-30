import { watch, onMounted, onUnmounted } from 'vue';
import { useShellFacade } from '../../application/shell.facade.js';
import { requiresBranch } from '../../domain/roles.js';
import { useRoute } from 'vue-router';
import {
    dispatchOperationalEvent,
    resyncOperationalStores,
} from '../../infrastructure/realtime/operational-event-dispatch.js';
import {
    getOperationalSocketClient,
    resetOperationalSocketClient,
} from '../../infrastructure/realtime/operational-socket.js';
import { SESSION_KEYS } from '../../infrastructure/session-storage.js';

/**
 * Conexión STOMP operativa: JWT + sucursal activa, reconexión y resync.
 */
export function useOperationalSocket() {
    const shell = useShellFacade();
    const route = useRoute();

    let client = null;
    let resyncOnConnectHandler = null;

    function shouldConnect() {
        if (!shell.isAuthenticated.value || !shell.hasBranchSelected.value) return false;
        const path = route.path;
        if (path.includes('/sign-in') || path.includes('/sign-up')) return false;
        return requiresBranch(path) || path.startsWith('/dashboard');
    }

    function connectIfNeeded() {
        if (!shouldConnect()) {
            resetOperationalSocketClient();
            client = null;
            return;
        }

        const token = localStorage.getItem(SESSION_KEYS.TOKEN);
        const branchId = shell.activeBranchId.value;
        if (!token || !branchId) return;

        if (!client) {
            client = getOperationalSocketClient({
                onEvent: dispatchOperationalEvent,
            });
            client.startFallbackPolling(() => resyncOperationalStores(), 60_000);
        }

        client.connect(branchId, token);
    }

    resyncOnConnectHandler = () => {
        if (shell.activeBranchId.value) {
            resyncOperationalStores().catch(() => {});
        }
    };

    onMounted(() => {
        connectIfNeeded();
        window.addEventListener('gastro:operational-socket-connected', resyncOnConnectHandler);
    });

    onUnmounted(() => {
        window.removeEventListener('gastro:operational-socket-connected', resyncOnConnectHandler);
        resetOperationalSocketClient();
        client = null;
    });

    watch(
        () => [shell.isAuthenticated.value, shell.activeBranchId.value, route.path],
        () => connectIfNeeded(),
    );

    watch(
        () => shell.token.value,
        (token) => {
            if (!token) resetOperationalSocketClient();
        },
    );
}
