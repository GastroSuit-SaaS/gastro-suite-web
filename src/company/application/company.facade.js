import { computed } from 'vue';
import { useIamStore } from '../../iam/application/iam.store.js';

/**
 * Orquestación company → IAM.
 */
export function useCompanyFacade() {
    const iamStore = useIamStore();

    const hasBranchSelected = computed(() => iamStore.hasBranchSelected);

    return {
        hasBranchSelected,
    };
}
