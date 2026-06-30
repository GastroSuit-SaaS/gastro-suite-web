import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CompanyApi } from '../infrastructure/api/company.api.js';
import { CompanyAssembler } from '../infrastructure/assemblers/company.assembler.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { useCommunicationStore } from '../../communication/application/communication.store.js';
import { getApiErrorMessage } from '../../shared/infrastructure/api-error.js';
import { storeFailure, storeSuccess } from '../../shared/application/store-result.js';
import { useCompanyFacade } from './company.facade.js';

const api = new CompanyApi();

export const useCompanyStore = defineStore('company', () => {
    const facade = useCompanyFacade();
    const company = ref(null);
    const subscriptionSummary = ref(null);
    const availablePlans = ref([]);
    const isLoading = ref(false);
    const isSaving = ref(false);
    const isPlansLoading = ref(false);
    const isChoosingPlan = ref(false);
    const error = ref(null);
    const plansError = ref(null);
    /** true tras el primer intento de cargar suscripción (éxito o fallo). */
    const subscriptionFetchAttempted = ref(false);

    const accessState = computed(() => subscriptionSummary.value?.accessState ?? null);
    const inGracePeriod = computed(() => subscriptionSummary.value?.inGracePeriod === true);
    const hasSubscription = computed(() => !!subscriptionSummary.value?.subscriptionId);
    const hasPendingRequest = computed(() => {
        const summary = subscriptionSummary.value;
        return !!summary?.pendingRequestId
            && summary?.pendingRequestStatus === 'PENDING_VALIDATION';
    });
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
            company.value = CompanyAssembler.toEntityFromResponse(response);
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
            const response = await api.update(companyId, CompanyAssembler.toUpdateRequest(payload));
            company.value = CompanyAssembler.toEntityFromResponse(response);
            return storeSuccess();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al guardar los datos de la empresa');
            return storeFailure(e, 'Error al guardar los datos de la empresa');
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
            subscriptionFetchAttempted.value = true;
            try {
                const notificationsStore = useCommunicationStore();
                await notificationsStore.fetchUnreadCount();
                await notificationsStore.registerPushTokenIfAvailable();
            } catch {
                /* notificaciones opcionales */
            }
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

    async function choosePlan(subscriptionId, subscriptionType = 'MENSUAL', paymentReference = '', ownerNotes = '') {
        isChoosingPlan.value = true;
        error.value = null;
        try {
            const companyId = _requireCompanyId();
            const response = await api.chooseSubscriptionPlan(companyId, {
                subscriptionId,
                subscriptionType,
                paymentReference,
                ownerNotes,
            });
            subscriptionSummary.value = response.data;
            return storeSuccess();
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo enviar la solicitud de suscripción');
            return storeFailure(e, 'No se pudo enviar la solicitud de suscripción');
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
        subscriptionFetchAttempted.value = false;
    }

    return {
        company,
        subscriptionSummary,
        subscriptionFetchAttempted,
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
        hasPendingRequest,
        limits,
        features,
        fetchCompany,
        updateCompany,
        fetchSubscriptionSummary,
        fetchAvailablePlans,
        choosePlan,
        $reset,
        hasBranchSelected: facade.hasBranchSelected,
    };
});
