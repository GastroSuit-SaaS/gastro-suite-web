import { computed } from 'vue';
import { useBranchesStore } from '../../branches/application/branches.store.js';
import { useIamStore } from '../../iam/application/iam.store.js';

/**
 * Orquestación cross-module para gestión de usuarios.
 */
export function useUsersFacade() {
    const branchesStore = useBranchesStore();
    const iamStore = useIamStore();

    const branchOptions = computed(() =>
        branchesStore.activeBranches.map((b) => ({
            label: b.nombre,
            value: b.id,
        })),
    );

    function assignableRolesForPlan(entitlements) {
        return iamStore.assignableRoles.filter(
            (role) => entitlements?.hasKitchen || role !== 'COOK',
        );
    }

    async function bootstrapManagement() {
        await Promise.all([
            branchesStore.fetchAll(),
            iamStore.loadRolesCatalog(),
        ]);
    }

    return {
        branchOptions,
        assignableRolesForPlan,
        bootstrapManagement,
    };
}
