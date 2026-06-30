import { computed } from 'vue';
import { useIamStore } from '../../iam/application/iam.store.js';

/**
 * Orquestación inventory → IAM.
 */
export function useInventoryFacade() {
    const iamStore = useIamStore();

    const currentUser = computed(() => iamStore.currentUser);

    return {
        currentUser,
    };
}
