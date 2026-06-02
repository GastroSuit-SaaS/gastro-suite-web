import { useIamStore } from '../../iam/application/iam.store.js';

export function requireCompanyId() {
    const companyId = useIamStore().companyId;
    if (!companyId) {
        throw new Error('No hay empresa en la sesión. Inicia sesión nuevamente.');
    }
    return companyId;
}

export function requireActiveBranchId() {
    const branchId = useIamStore().activeBranchId;
    if (!branchId) {
        throw new Error('Selecciona una sucursal activa para continuar.');
    }
    return branchId;
}
