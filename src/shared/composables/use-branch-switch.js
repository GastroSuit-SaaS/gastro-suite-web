import { useRouter } from 'vue-router';
import { getActivePinia } from 'pinia';
import { useIamStore } from '../../iam/application/iam.store.js';
import { usePosStore } from '../../pos/application/pos.store.js';
import { useConfirmDialog } from './use-confirm-dialog.js';
import { getBranchSwitchWarnings } from '../application/branch-switch.js';
import { BRANCH_SWITCH_MESSAGES } from '../../branches/presentation/constants/branches.constants-ui.js';

/**
 * Cambio seguro de sucursal (OWNER): confirmación + reset de contexto operativo.
 */
export function useBranchSwitch() {
    const iamStore = useIamStore();
    const router = useRouter();
    const { showConfirm } = useConfirmDialog();

    function _posContext() {
        const pinia = getActivePinia();
        if (!pinia) return {};
        try {
            const posStore = usePosStore(pinia);
            return { currentSale: posStore.currentSale };
        } catch {
            return {};
        }
    }

    function collectWarnings() {
        return getBranchSwitchWarnings(iamStore.activeBranchId, _posContext());
    }

    async function confirmIfNeeded() {
        const warnings = collectWarnings();
        if (!warnings.length) return true;

        const bulletList = warnings.map((w) => `• ${w}`).join('\n');
        return showConfirm({
            header: BRANCH_SWITCH_MESSAGES.CONFIRM_HEADER,
            message: `${BRANCH_SWITCH_MESSAGES.CONFIRM_INTRO}\n\n${bulletList}\n\n${BRANCH_SWITCH_MESSAGES.CONFIRM_FOOTER}`,
            acceptLabel: BRANCH_SWITCH_MESSAGES.CONFIRM_ACCEPT,
            rejectLabel: BRANCH_SWITCH_MESSAGES.CONFIRM_REJECT,
            icon: 'pi pi-building',
        });
    }

    async function switchToBranch(branch, { redirectTo = null } = {}) {
        if (!branch?.id || branch.id === iamStore.activeBranchId) return true;

        const ok = await confirmIfNeeded();
        if (!ok) return false;

        await iamStore.selectBranch(branch.id, branch.nombre ?? '');

        if (redirectTo) {
            await router.push(redirectTo);
        }
        return true;
    }

    async function leaveBranch(redirectTo = '/dashboard') {
        if (!iamStore.activeBranchId) return true;

        const ok = await confirmIfNeeded();
        if (!ok) return false;

        iamStore.clearBranch();
        await router.push(redirectTo);
        return true;
    }

    return {
        switchToBranch,
        leaveBranch,
        collectWarnings,
    };
}
