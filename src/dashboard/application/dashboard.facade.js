import { computed } from 'vue';
import { useBranchesStore } from '../../branches/application/branches.store.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import {
    DASHBOARD_COMPARE_OPTIONS,
    COMPARISON_PERIOD_NONE,
} from '../domain/models/dashboard-comparison.entity.js';

/**
 * Lecturas cross-module para el dashboard (OWNER vista multi-sucursal).
 */
export function useDashboardFacade() {
    const iamStore = useIamStore();
    const branchesStore = useBranchesStore();

    const isOwner = computed(() => iamStore.isOwner);
    const hasBranchSelected = computed(() => iamStore.hasBranchSelected);
    const userGreetingName = computed(
        () => iamStore.currentUser?.nombres || iamStore.currentUser?.username || '',
    );

    const ownerBranchOptions = computed(() => {
        const sorted = [...branchesStore.activeBranches].sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
            if (ta !== tb) return ta - tb;
            return String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''));
        });
        return sorted.map((branch) => ({
            label: branch.nombre,
            value: branch.id,
        }));
    });

    const activeBranches = computed(() => branchesStore.activeBranches);

    async function ensureBranchesLoaded() {
        if (!branchesStore.items.length) {
            await branchesStore.fetchAll();
        }
    }

    function compareOptionsForEntitlements(entitlements) {
        if (!entitlements?.hasDashboardComparison) {
            return DASHBOARD_COMPARE_OPTIONS.filter((o) => o.value === COMPARISON_PERIOD_NONE);
        }
        return DASHBOARD_COMPARE_OPTIONS;
    }

    return {
        isOwner,
        hasBranchSelected,
        userGreetingName,
        ownerBranchOptions,
        activeBranches,
        ensureBranchesLoaded,
        compareOptionsForEntitlements,
        COMPARISON_PERIOD_NONE,
    };
}
