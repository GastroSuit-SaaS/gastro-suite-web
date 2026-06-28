<script setup>
import { computed, onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js';
import { useTablePagination } from '../../../shared/composables/use-table-pagination.js';
import ModuleTable from '../../../shared/presentation/components/module-table.vue';
import ModuleEmptyState from '../../../shared/presentation/components/module-empty-state.vue';
import TablePaginationBar from '../../../shared/presentation/components/table-pagination-bar.vue';
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

const REQUEST_TYPE_LABELS = {
    NEW_CONTRACT: 'Nuevo contrato',
    RENEWAL: 'Renovación',
};

const items = computed(() => store.pendingRequests ?? []);

const {
    page,
    pageSize,
    totalPages,
    paginatedItems,
    rangeStart,
    rangeEnd,
    totalItems,
} = useTablePagination(items);

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

        <module-empty-state
          v-if="!store.isLoading && items.length === 0"
          icon="pi-inbox"
          title="No hay solicitudes pendientes"
          subtitle="Cuando un restaurante envíe un contrato o renovación aparecerá aquí para validación."
        />

        <template v-else-if="items.length > 0">
          <module-table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>RUC</th>
                <th>Tipo</th>
                <th>Plan</th>
                <th>Periodicidad</th>
                <th>Ref. pago</th>
                <th>Enviada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedItems" :key="row.requestId">
                <td class="font-semibold">{{ row.companyName }}</td>
                <td>{{ row.companyRuc || '—' }}</td>
                <td>
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
                </td>
                <td>{{ row.planName }}</td>
                <td>{{ row.subscriptionType }}</td>
                <td>{{ row.paymentReference || '—' }}</td>
                <td>{{ formatDate(row.submittedAt) }}</td>
                <td class="td-actions">
                  <pv-button label="Aprobar" icon="pi pi-check" size="small" :loading="store.isLoading" @click="quickApprove(row)" />
                  <pv-button label="Rechazar" icon="pi pi-times" size="small" severity="danger" outlined :loading="store.isLoading" @click="openReview(row, 'reject')" />
                </td>
              </tr>
            </tbody>
          </module-table>

          <table-pagination-bar
            v-model:page="page"
            v-model:page-size="pageSize"
            :total-pages="totalPages"
            :range-start="rangeStart"
            :range-end="rangeEnd"
            :total-items="totalItems"
            item-label="solicitudes"
          />
        </template>
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
}

.gs-badge {
  display: inline-flex;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.td-actions {
  white-space: nowrap;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
</style>
