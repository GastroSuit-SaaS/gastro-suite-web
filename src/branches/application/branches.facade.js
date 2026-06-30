import { computed } from 'vue';
import { useUsersStore } from '../../users/application/users.store.js';
import { useIamStore } from '../../iam/application/iam.store.js';

/**
 * Orquestación branches → users / IAM.
 */
export function useBranchesFacade() {
    const usersStore = useUsersStore();
    const iamStore = useIamStore();

    const activeBranchId = computed(() => iamStore.activeBranchId);

    const managerCandidates = computed(() =>
        usersStore.activeUsers
            .filter((u) => ['OWNER', 'BRANCH_ADMIN'].includes(u.role))
            .map((u) => ({
                label: `${u.fullName} (${u.role === 'OWNER' ? 'Dueño' : 'Admin. Sucursal'})`,
                value: u.id,
                fullName: u.fullName,
            })),
    );

    async function ensureUsersLoaded() {
        if (usersStore.users.length === 0) {
            await usersStore.fetchAll();
        }
    }

    function encargadoDisplayForBranch(branch) {
        if (branch?.encargadoId) {
            const user = usersStore.users.find((u) => u.id === branch.encargadoId);
            if (user) return user.fullName;
        }
        return branch?.encargadoNombre || '—';
    }

    return {
        activeBranchId,
        managerCandidates,
        ensureUsersLoaded,
        encargadoDisplayForBranch,
    };
}
