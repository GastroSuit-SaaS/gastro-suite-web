import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PlatformApi } from '../infrastructure/api/platform.api.js';
import { PlatformPlanAssembler } from '../infrastructure/assemblers/platform-plan.assembler.js';
import { PlatformCompanyOverviewAssembler } from '../infrastructure/assemblers/platform-company-overview.assembler.js';
import { SubscriptionRequestAssembler } from '../infrastructure/assemblers/subscription-request.assembler.js';
import { PlatformAdminAssembler } from '../infrastructure/assemblers/platform-admin.assembler.js';
import { AuditLogEntryAssembler } from '../infrastructure/assemblers/audit-log-entry.assembler.js';
import { PlatformDashboardAssembler } from '../infrastructure/assemblers/platform-dashboard.assembler.js';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error.js';
import { usePlatformFacade } from './platform.facade.js';

const api = new PlatformApi();

export const usePlatformStore = defineStore('platform', () => {
    const facade = usePlatformFacade();
    const isLoading = ref(false);
    const error = ref(null);
    const actionError = ref(null);
    const bootstrapStatus = ref(null);
    const admins = ref([]);
    const companyOverviews = ref([]);
    const pendingRequests = ref([]);
    const dashboard = ref(null);
    const plans = ref([]);
    const auditLogs = ref([]);

    async function fetchBootstrapStatus() {
        error.value = null;
        try {
            const response = await api.getBootstrapStatus();
            bootstrapStatus.value = response?.data ?? null;
            return bootstrapStatus.value;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo consultar bootstrap.');
            throw e;
        }
    }

    async function bootstrapSuperAdmin(payload) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.bootstrap(payload);
            return PlatformAdminAssembler.toEntityFromResponse(response) ?? response?.data;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo crear super admin.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function loadDashboard() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getDashboard();
            dashboard.value = PlatformDashboardAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo cargar el panel.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function loadAdmins() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.listAdmins();
            admins.value = PlatformAdminAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudieron cargar administradores.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function createAdmin(payload) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.createAdmin(payload);
            await loadAdmins();
            return PlatformAdminAssembler.toEntityFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo crear administrador.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function loadCompanyOverviews() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.listCompanyOverviews();
            companyOverviews.value = PlatformCompanyOverviewAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudieron cargar empresas.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function loadPendingRequests() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.listPendingSubscriptionRequests();
            pendingRequests.value = SubscriptionRequestAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudieron cargar solicitudes.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function approveRequest(requestId, adminNotes = '') {
        isLoading.value = true;
        actionError.value = null;
        try {
            await api.approveSubscriptionRequest(requestId, adminNotes);
            await Promise.all([
                reloadPendingRequests(),
                reloadCompanyOverviews(),
                reloadDashboard(),
            ]);
        } catch (e) {
            actionError.value = getApiErrorMessage(e, 'No se pudo aprobar la solicitud.');
        } finally {
            isLoading.value = false;
        }
    }

    async function rejectRequest(requestId, adminNotes = '') {
        isLoading.value = true;
        actionError.value = null;
        try {
            await api.rejectSubscriptionRequest(requestId, adminNotes);
            await Promise.all([reloadPendingRequests(), reloadCompanyOverviews()]);
        } catch (e) {
            actionError.value = getApiErrorMessage(e, 'No se pudo rechazar la solicitud.');
        } finally {
            isLoading.value = false;
        }
    }

    async function reloadPendingRequests() {
        const response = await api.listPendingSubscriptionRequests();
        pendingRequests.value = SubscriptionRequestAssembler.toEntitiesFromResponse(response);
    }

    async function reloadCompanyOverviews() {
        const response = await api.listCompanyOverviews();
        companyOverviews.value = PlatformCompanyOverviewAssembler.toEntitiesFromResponse(response);
    }

    async function reloadDashboard() {
        const response = await api.getDashboard();
        dashboard.value = PlatformDashboardAssembler.toEntityFromResponse(response);
    }

    async function loadAuditLogs() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.listAuditLogs();
            auditLogs.value = AuditLogEntryAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo cargar la auditoría.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function loadPlans() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.listSubscriptionPlans();
            plans.value = PlatformPlanAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudieron cargar planes.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function savePlan(payload, planId = null) {
        isLoading.value = true;
        error.value = null;
        try {
            if (planId) {
                await api.updateSubscriptionPlan(planId, payload);
            } else {
                await api.createSubscriptionPlan(payload);
            }
            await loadPlans();
            await loadAuditLogs();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo guardar el plan.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function assignCompanySubscription(payload) {
        isLoading.value = true;
        actionError.value = null;
        try {
            const response = await api.assignCompanySubscription(payload);
            await Promise.all([
                reloadCompanyOverviews(),
                reloadDashboard(),
                loadAuditLogs(),
            ]);
            return response?.data ?? null;
        } catch (e) {
            actionError.value = getApiErrorMessage(e, 'No se pudo asignar la suscripción.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateCompanySubscription(companyId, payload) {
        isLoading.value = true;
        actionError.value = null;
        try {
            const response = await api.updateCompanySubscription(companyId, payload);
            await Promise.all([
                reloadCompanyOverviews(),
                reloadDashboard(),
                loadAuditLogs(),
            ]);
            return response?.data ?? null;
        } catch (e) {
            actionError.value = getApiErrorMessage(e, 'No se pudo actualizar la suscripción.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function revokeCompanySubscription(companyId) {
        isLoading.value = true;
        actionError.value = null;
        try {
            await api.deleteCompanySubscription(companyId);
            await Promise.all([
                reloadCompanyOverviews(),
                reloadDashboard(),
                loadAuditLogs(),
            ]);
        } catch (e) {
            actionError.value = getApiErrorMessage(e, 'No se pudo revocar la suscripción.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading, error, actionError, bootstrapStatus, admins, companyOverviews,
        pendingRequests, dashboard, plans, auditLogs,
        fetchBootstrapStatus, bootstrapSuperAdmin, loadDashboard, loadAdmins,
        createAdmin, loadCompanyOverviews, loadPendingRequests,
        approveRequest, rejectRequest, reloadPendingRequests, reloadCompanyOverviews,
        reloadDashboard, loadPlans, savePlan, loadAuditLogs,
        assignCompanySubscription, updateCompanySubscription, revokeCompanySubscription,
        logout: facade.logout,
    };
});
