import { watch, onMounted, onUnmounted } from 'vue';
import { useIamStore } from '../../iam/application/iam.store.js';
import { requiresBranch } from '../presentation/constants/roles.constants.js';
import { useRoute } from 'vue-router';
import {
    dispatchOperationalEvent,
    resyncOperationalStores,
} from '../infrustructure/realtime/operational-event-dispatch.js';
import {
    getOperationalSocketClient,
    resetOperationalSocketClient,
} from '../infrustructure/realtime/operational-socket.js';
import { SESSION_KEYS } from '../infrustructure/session-storage.js';

/**
 * Conexión STOMP operativa: JWT + sucursal activa, reconexión y resync.
 */
export function useOperationalSocket() {
    const iamStore = useIamStore();
    const route = useRoute();

    let client = null;
    let resyncOnConnectHandler = null;

    function shouldConnect() {
        if (!iamStore.isAuthenticated || !iamStore.hasBranchSelected) return false;
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
        const branchId = iamStore.activeBranchId;
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
        if (iamStore.activeBranchId) {
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
        () => [iamStore.isAuthenticated, iamStore.activeBranchId, route.path],
        () => connectIfNeeded(),
    );

    watch(
        () => iamStore.token,
        (token) => {
            if (!token) resetOperationalSocketClient();
        },
    );
}
