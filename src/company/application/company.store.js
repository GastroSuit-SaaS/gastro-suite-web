import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CompanyApi } from '../infrastructure/api/company.api.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';

const api = new CompanyApi();

export const useCompanyStore = defineStore('company', () => {
    const company = ref(null);
    const subscriptionSummary = ref(null);
    const availablePlans = ref([]);
    const isLoading = ref(false);
    const isSaving = ref(false);
    const isPlansLoading = ref(false);
    const isChoosingPlan = ref(false);
    const error = ref(null);
    const plansError = ref(null);

    const accessState = computed(() => subscriptionSummary.value?.accessState ?? null);
    const inGracePeriod = computed(() => subscriptionSummary.value?.inGracePeriod === true);
    const hasSubscription = computed(() => !!subscriptionSummary.value?.subscriptionId);
    const limits = computed(() => subscriptionSummary.value?.limits ?? null);
    const features = computed(() => subscriptionSummary.value?.features ?? null);

    function _requireCompanyId() {
        const companyId = useIamStore().companyId;
        if (!companyId) {
            throw new Error('No hay empresa asociada a la sesión.');
        }
        return companyId;
    }

    async function fetchCompany() {
        isLoading.value = true;
        error.value = null;
        try {
            const companyId = _requireCompanyId();
            const response = await api.getById(companyId);
            company.value = response.data;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar los datos de la empresa');
            company.value = null;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateCompany(payload) {
        isSaving.value = true;
        error.value = null;
        try {
            const companyId = _requireCompanyId();
            const response = await api.update(companyId, payload);
            company.value = response.data;
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al guardar los datos de la empresa');
            return false;
        } finally {
            isSaving.value = false;
        }
    }

    async function fetchSubscriptionSummary() {
        error.value = null;
        plansError.value = null;
        isPlansLoading.value = true;
        try {
            const companyId = _requireCompanyId();
            const response = await api.getSubscriptionSummary(companyId);
            subscriptionSummary.value = response.data;
            availablePlans.value = response.data?.availablePlans ?? [];
        } catch (e) {
            subscriptionSummary.value = null;
            availablePlans.value = [];
            error.value = getApiErrorMessage(e, 'Error al cargar la suscripción');
        } finally {
            isPlansLoading.value = false;
        }
    }

    async function fetchAvailablePlans() {
        if (availablePlans.value.length > 0) return;
        isPlansLoading.value = true;
        plansError.value = null;
        try {
            const companyId = _requireCompanyId();
            const response = await api.listSubscriptionPlans(companyId);
            availablePlans.value = response.data ?? [];
        } catch (e) {
            availablePlans.value = [];
            plansError.value = getApiErrorMessage(e, 'No se pudieron cargar los planes disponibles');
        } finally {
            isPlansLoading.value = false;
        }
    }

    async function choosePlan(subscriptionId, subscriptionType = 'MENSUAL') {
        isChoosingPlan.value = true;
        error.value = null;
        try {
            const companyId = _requireCompanyId();
            const response = await api.chooseSubscriptionPlan(companyId, {
                subscriptionId,
                subscriptionType,
            });
            subscriptionSummary.value = response.data;
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo activar el plan seleccionado');
            return false;
        } finally {
            isChoosingPlan.value = false;
        }
    }

    function $reset() {
        company.value = null;
        subscriptionSummary.value = null;
        availablePlans.value = [];
        isLoading.value = false;
        isSaving.value = false;
        isPlansLoading.value = false;
        isChoosingPlan.value = false;
        error.value = null;
        plansError.value = null;
    }

    return {
        company,
        subscriptionSummary,
        availablePlans,
        isLoading,
        isSaving,
        isPlansLoading,
        isChoosingPlan,
        error,
        plansError,
        accessState,
        inGracePeriod,
        hasSubscription,
        limits,
        features,
        fetchCompany,
        updateCompany,
        fetchSubscriptionSummary,
        fetchAvailablePlans,
        choosePlan,
        $reset,
    };
});
