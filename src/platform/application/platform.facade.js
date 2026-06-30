import { useIamStore } from '../../iam/application/iam.store.js';

/**
 * Orquestación platform → IAM (sesión super-admin).
 */
export function usePlatformFacade() {
    const iamStore = useIamStore();

    function logout() {
        return iamStore.logout();
    }

    return {
        logout,
    };
}
