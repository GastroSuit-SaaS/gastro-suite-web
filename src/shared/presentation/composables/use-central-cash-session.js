import { computed } from 'vue';
import { useShellFacade } from '../../application/shell.facade.js';

/**
 * Contexto del turno de caja centralizada (una sesión OPEN por sucursal).
 */
export function useCentralCashSession() {
    const shell = useShellFacade();

    const isOpen = computed(() => shell.hasOpenSession.value);

    const openedByLabel = computed(() =>
        shell.currentCashSession.value?.openedBy ?? '—',
    );

    const collectorLabel = computed(() => {
        const user = shell.currentUser.value;
        if (!user) return '—';
        const name = [user.nombres, user.apellidos].filter(Boolean).join(' ').trim();
        return name || user.username || '—';
    });

    async function refresh() {
        if (!shell.hasBranchSelected.value) return;
        await shell.refreshOpenSession();
    }

    return {
        isOpen,
        openedByLabel,
        collectorLabel,
        currentSession: shell.currentCashSession,
        collectorSummary: shell.collectorSummary,
        refresh,
    };
}
