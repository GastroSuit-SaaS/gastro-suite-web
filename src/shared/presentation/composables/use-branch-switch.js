import { useRouter } from 'vue-router';
import { useShellFacade } from '../../application/shell.facade.js';
import { useConfirmDialog } from './use-confirm-dialog.js';
import { getBranchSwitchWarnings } from '../../application/branch-switch.js';
import { BRANCH_SWITCH_MESSAGES } from '../../../branches/presentation/constants/branches.constants-ui.js';

/**
 * Cambio seguro de sucursal (OWNER): confirmación + reset de contexto operativo.
 */
export function useBranchSwitch() {
    const shell = useShellFacade();
    const router = useRouter();
    const { showConfirm } = useConfirmDialog();

    function collectWarnings() {
        return getBranchSwitchWarnings(shell.activeBranchId.value, {
            currentSale: shell.getPosCurrentSale(),
        });
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
        if (!branch?.id || branch.id === shell.activeBranchId.value) return true;

        const ok = await confirmIfNeeded();
        if (!ok) return false;

        await shell.selectBranch(branch.id, branch.nombre ?? '');

        if (redirectTo) {
            await router.push(redirectTo);
        }
        return true;
    }

    async function leaveBranch(redirectTo = '/dashboard') {
        if (!shell.activeBranchId.value) return true;

        const ok = await confirmIfNeeded();
        if (!ok) return false;

        shell.clearBranch();
        await router.push(redirectTo);
        return true;
    }

    return {
        switchToBranch,
        leaveBranch,
        collectWarnings,
    };
}
