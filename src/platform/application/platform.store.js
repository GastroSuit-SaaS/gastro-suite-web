import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PlatformApi } from '../infrastructure/api/platform.api.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';

const api = new PlatformApi();

export const usePlatformStore = defineStore('platform', () => {
    const isLoading = ref(false);
    const error = ref(null);
    const bootstrapStatus = ref(null);
    const admins = ref([]);
    const companies = ref([]);
    const plans = ref([]);

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
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo guardar el plan.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    async function assignSubscription(payload) {
        isLoading.value = true;
        error.value = null;
        try {
            await api.assignCompanySubscription(payload);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo asignar suscripción.');
            throw e;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading, error, bootstrapStatus, admins, companies, plans,
        fetchBootstrapStatus, bootstrapSuperAdmin, loadAdmins, createAdmin,
        loadCompanies, loadPlans, savePlan, assignSubscription,
    };
});
