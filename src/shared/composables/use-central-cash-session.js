import { computed } from 'vue';
import { useCashRegisterStore } from '../../cash-register/application/cash-register.store.js';
import { useIamStore } from '../../iam/application/iam.store.js';

/**
 * Contexto del turno de caja centralizada (una sesión OPEN por sucursal).
 */
export function useCentralCashSession() {
    const cashStore = useCashRegisterStore();
    const iamStore  = useIamStore();

    const isOpen = computed(() => cashStore.hasOpenSession);

    const openedByLabel = computed(() =>
        cashStore.currentSession?.openedBy ?? '—',
    );

    const collectorLabel = computed(() => {
        const user = iamStore.currentUser;
        if (!user) return '—';
        const name = [user.nombres, user.apellidos].filter(Boolean).join(' ').trim();
        return name || user.username || '—';
    });

    async function refresh() {
        if (!iamStore.hasBranchSelected) return;
        await cashStore.refreshOpenSession();
    }

    return {
        isOpen,
        openedByLabel,
        collectorLabel,
        currentSession: computed(() => cashStore.currentSession),
        collectorSummary: computed(() => cashStore.collectorSummary),
        refresh,
    };
}
