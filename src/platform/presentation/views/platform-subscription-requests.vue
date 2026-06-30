<script setup>
import { computed, onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import { useConfirmDialog } from '../../../shared/presentation/composables/use-confirm-dialog.js';
import DataManager from '../../../shared/presentation/components/data-manager.vue';
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue';
import ReviewSubscriptionRequest from './review-subscription-request.vue';

const store = usePlatformStore();
const { showConfirm } = useConfirmDialog();

function clearActionError() {
    store.actionError = null;
}

const reviewVisible = ref(false);
const reviewAction = ref('reject');
const selectedRequest = ref(null);
const searchQuery = ref('');

const REQUEST_TYPE_LABELS = {
    NEW_CONTRACT: 'Nuevo contrato',
    RENEWAL: 'Renovación',
};

const items = computed(() => store.pendingRequests ?? []);

const tableColumns = [
    { field: 'companyName', header: 'Empresa', sortable: true, style: 'min-width: 140px' },
    { field: 'companyRuc', header: 'RUC', sortable: true, style: 'min-width: 100px' },
    { field: 'requestType', header: 'Tipo', sortable: true, template: 'sr-type', style: 'min-width: 120px' },
    { field: 'planName', header: 'Plan', sortable: true, style: 'min-width: 120px' },
    { field: 'subscriptionType', header: 'Periodicidad', sortable: true, style: 'min-width: 110px' },
    { field: 'paymentReference', header: 'Ref. pago', sortable: true, style: 'min-width: 110px' },
    { field: 'submittedAt', header: 'Enviada', sortable: true, template: 'sr-date', style: 'min-width: 130px' },
    { field: 'actions', header: '', sortable: false, template: 'sr-actions', style: 'min-width: 12rem' },
];

onMounted(() => store.loadPendingRequests());

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}

function openReview(request, action) {
    selectedRequest.value = request;
    reviewAction.value = action;
    reviewVisible.value = true;
}

async function submitReview(notes) {
    if (!selectedRequest.value) return;
    const id = selectedRequest.value.requestId;
    if (reviewAction.value === 'approve') {
        await store.approveRequest(id, notes);
    } else {
        await store.rejectRequest(id, notes);
    }
    selectedRequest.value = null;
}

async function quickApprove(request) {
    const ok = await showConfirm({
        header: 'Confirmar pago',
        message: `¿Validar pago y ${request.requestType === 'RENEWAL' ? 'renovar' : 'activar'} la suscripción de ${request.companyName}?`,
        acceptLabel: 'Aprobar',
    });
    if (!ok) return;
    await store.approveRequest(request.requestId, '');
}
</script>

<template>
  <div class="platform-page module-page">
    <module-state-feedback
      :loading="store.isLoading && !items.length"
      :error="store.error"
      :is-empty="false"
      loading-label="Cargando solicitudes..."
      @retry="store.loadPendingRequests()"
    >
      <div class="platform-page__body">
        <pv-message v-if="store.actionError" severity="error" closable @close="clearActionError">
          {{ store.actionError }}
        </pv-message>

        <data-manager
          class="platform-table-manager flex-1 min-h-0"
          :items="items"
          :columns="tableColumns"
          :title="{ singular: 'solicitud', plural: 'solicitudes' }"
          data-key="requestId"
          :loading="store.isLoading"
          :dynamic="true"
          :global-filter-value="searchQuery"
          search-placeholder="Buscar empresa, RUC o referencia..."
          :show-new="false"
          :show-export="false"
          :show-selection="false"
          :show-actions="false"
          empty-icon="pi-inbox"
          empty-title="No hay solicitudes pendientes"
          empty-subtitle="Cuando un restaurante envíe un contrato o renovación aparecerá aquí para validación."
          item-label="solicitudes"
          :rows="15"
          @global-filter-change="searchQuery = $event"
        >
          <template #sr-type="{ data: row }">
            <span
              class="gs-badge"
              :style="{
                background: (row.requestType === 'RENEWAL' ? '#6366f1' : '#059669') + '22',
                color: row.requestType === 'RENEWAL' ? '#6366f1' : '#059669',
                border: '1px solid ' + (row.requestType === 'RENEWAL' ? '#6366f1' : '#059669') + '66',
              }"
            >
              {{ REQUEST_TYPE_LABELS[row.requestType] ?? row.requestType }}
            </span>
          </template>

          <template #sr-date="{ data: row }">
            {{ formatDate(row.submittedAt) }}
          </template>

          <template #sr-actions="{ data: row }">
            <div class="platform-row-actions">
              <pv-button
                label="Aprobar"
                icon="pi pi-check"
                size="small"
                :loading="store.isLoading"
                @click.stop="quickApprove(row)"
              />
              <pv-button
                label="Rechazar"
                icon="pi pi-times"
                size="small"
                severity="danger"
                outlined
                :loading="store.isLoading"
                @click.stop="openReview(row, 'reject')"
              />
            </div>
          </template>
        </data-manager>
      </div>
    </module-state-feedback>

    <review-subscription-request
      v-model:visible="reviewVisible"
      :request="selectedRequest"
      :action="reviewAction"
      @submit="submitReview"
    />
  </div>
</template>

<style scoped>
.platform-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.platform-page__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.5rem 1.5rem;
  min-height: 0;
}

.gs-badge {
  display: inline-flex;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.platform-row-actions {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
