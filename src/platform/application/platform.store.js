import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PlatformApi } from '../infrastructure/api/platform.api.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';

const api = new PlatformApi();

export const usePlatformStore = defineStore('platform', () => {
    const isLoading = ref(false);
    const error = ref(null);
    const actionError = ref(null);
    const bootstrapStatus = ref(null);
    const admins = ref([]);
    const companies = ref([]);
    const companyOverviews = ref([]);
    const pendingRequests = ref([]);
    const dashboard = ref(null);
    const plans = ref([]);
    const auditLogs = ref([]);

    async function fetchBootstrapStatus() {
        error.value = null;
        try {
            const { data } = await api.getBootstrapStatus();
            bootstrapStatus.value = data;
            return data;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo consultar bootstrap.');
            throw e;
        }
    }

    async function bootstrapSuperAdmin(payload) {
        isLoading.value = true;
        error.value = null;
        try {
            const { data } = await api.bootstrap(payload);
            return data;
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
            const { data } = await api.getDashboard();
            dashboard.value = data;
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
            const { data } = await api.listAdmins();
            admins.value = data ?? [];
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
            const { data } = await api.createAdmin(payload);
            await loadAdmins();
            return data;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo crear administrador.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function loadCompanies() {
        isLoading.value = true;
        error.value = null;
        try {
            const { data } = await api.listCompanies();
            companies.value = data ?? [];
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudieron cargar empresas.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function loadCompanyOverviews() {
        isLoading.value = true;
        error.value = null;
        try {
            const { data } = await api.listCompanyOverviews();
            companyOverviews.value = data ?? [];
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
            const { data } = await api.listPendingSubscriptionRequests();
            pendingRequests.value = data ?? [];
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
        const { data } = await api.listPendingSubscriptionRequests();
        pendingRequests.value = data ?? [];
    }

    async function reloadCompanyOverviews() {
        const { data } = await api.listCompanyOverviews();
        companyOverviews.value = data ?? [];
    }

    async function reloadDashboard() {
        const { data } = await api.getDashboard();
        dashboard.value = data;
    }

    async function loadAuditLogs() {
        isLoading.value = true;
        error.value = null;
        try {
            const { data } = await api.listAuditLogs();
            auditLogs.value = data ?? [];
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
            const { data } = await api.listSubscriptionPlans();
            plans.value = data ?? [];
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

    return {
        isLoading, error, actionError, bootstrapStatus, admins, companies, companyOverviews,
        pendingRequests, dashboard, plans, auditLogs,
        fetchBootstrapStatus, bootstrapSuperAdmin, loadDashboard, loadAdmins,
        createAdmin, loadCompanies, loadCompanyOverviews, loadPendingRequests,
        approveRequest, rejectRequest, reloadPendingRequests, reloadCompanyOverviews,
        reloadDashboard, loadPlans, savePlan, loadAuditLogs,
    };
});
