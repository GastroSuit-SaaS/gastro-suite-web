import { computed } from 'vue';
import { useIamStore } from '../../iam/application/iam.store.js';

/**
 * Orquestación reports → IAM (vínculo empleado).
 */
export function useReportsFacade() {
    const iamStore = useIamStore();

    const hasEmployeeLink = computed(() => iamStore.hasEmployeeLink);

    function ensureEmployeeLink() {
        return iamStore.ensureEmployeeLink();
    }

    async function resolveEmployeeIdForReport() {
        let employeeId = iamStore.currentUser?.employeeId;
        if (!employeeId) {
            await iamStore.ensureEmployeeLink();
            employeeId = iamStore.currentUser?.employeeId;
        }
        if (!employeeId) {
            return {
                employeeId: null,
                errorMessage: iamStore.employeeLinkMessage
                    ?? 'Tu usuario debe estar vinculado a un empleado para generar reportes.',
            };
        }
        return { employeeId, errorMessage: null };
    }

    return {
        hasEmployeeLink,
        ensureEmployeeLink,
        resolveEmployeeIdForReport,
    };
}
