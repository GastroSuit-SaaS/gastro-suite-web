<script setup>
import { computed, onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import { useConfirmDialog } from '../../../shared/presentation/composables/use-confirm-dialog.js';
import { useNotification } from '../../../shared/presentation/composables/use-notification.js';
import DataManager from '../../../shared/presentation/components/data-manager.vue';
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue';
import ManageCompanySubscriptionDialog from './manage-company-subscription-dialog.vue';

const store = usePlatformStore();
const { showConfirm } = useConfirmDialog();
const { showSuccess, showError } = useNotification();

const ACCESS_COLORS = {
    ACTIVE: '#059669',
    GRACE: '#f59e0b',
    EXPIRED: '#dc2626',
    NONE: '#6b7280',
};

const ACCESS_LABELS = {
    ACTIVE: 'Activa',
    GRACE: 'Gracia',
    EXPIRED: 'Vencida',
    NONE: 'Sin plan',
};

const REQUEST_TYPE_LABELS = {
    NEW_CONTRACT: 'Nuevo contrato',
    RENEWAL: 'Renovación',
};

const subscriptionDialogVisible = ref(false);
const subscriptionDialogMode = ref('assign');
const selectedCompany = ref(null);
const searchQuery = ref('');

const items = computed(() => store.companyOverviews ?? []);

const filteredItems = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return items.value;
    return items.value.filter((row) =>
        (row.companyName ?? '').toLowerCase().includes(q)
        || (row.companyRuc ?? '').toLowerCase().includes(q)
        || (row.planName ?? '').toLowerCase().includes(q)
        || (row.subscriptionType ?? '').toLowerCase().includes(q),
    );
});

const tableColumns = [
    { field: 'companyName', header: 'Empresa', sortable: true, style: 'min-width: 160px' },
    { field: 'companyRuc', header: 'RUC', sortable: true, style: 'min-width: 100px' },
    { field: 'planName', header: 'Plan', sortable: true, style: 'min-width: 120px' },
    { field: 'subscriptionType', header: 'Periodicidad', sortable: true, style: 'min-width: 110px' },
    { field: 'accessState', header: 'Estado', sortable: true, template: 'co-access', style: 'min-width: 100px' },
    { field: 'endDate', header: 'Vence', sortable: true, template: 'co-end-date', style: 'min-width: 110px' },
    { field: 'pendingRequestId', header: 'Solicitud pendiente', sortable: false, template: 'co-pending', style: 'min-width: 140px' },
    { field: 'actions', header: '', sortable: false, template: 'co-actions', style: 'min-width: 11rem' },
];

onMounted(async () => {
    await store.loadCompanyOverviews();
    if (!store.plans?.length) {
        try {
            await store.loadPlans();
        } catch {
            /* planes opcionales para listado */
        }
    }
});

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function accessColor(state) {
    return ACCESS_COLORS[state] ?? ACCESS_COLORS.NONE;
}

function accessLabel(state) {
    return ACCESS_LABELS[state] ?? ACCESS_LABELS.NONE;
}

function hasSubscription(row) {
    return row?.subscriptionId != null && row?.accessState !== 'NONE';
}

async function openAssign(row) {
    selectedCompany.value = row;
    subscriptionDialogMode.value = 'assign';
    if (!store.plans?.length) {
        await store.loadPlans();
    }
    subscriptionDialogVisible.value = true;
}

async function openUpdate(row) {
    selectedCompany.value = row;
    subscriptionDialogMode.value = 'update';
    subscriptionDialogVisible.value = true;
}

async function onSubscriptionSubmit({ mode, companyId, payload }) {
    try {
        if (mode === 'assign') {
            await store.assignCompanySubscription(payload);
            showSuccess('Suscripción asignada correctamente.');
        } else {
            await store.updateCompanySubscription(companyId, payload);
            showSuccess('Suscripción actualizada correctamente.');
        }
    } catch {
        showError(store.actionError ?? 'No se pudo guardar la suscripción.');
    }
}

async function revokeSubscription(row) {
    const ok = await showConfirm({
        header: 'Revocar suscripción',
        message: `¿Revocar el plan de ${row.companyName}? La empresa perderá acceso al vencimiento del periodo de gracia.`,
        acceptLabel: 'Revocar',
        acceptClass: 'p-button-danger',
    });
    if (!ok) return;
    try {
        await store.revokeCompanySubscription(row.companyId);
        showSuccess('Suscripción revocada.');
    } catch {
        showError(store.actionError ?? 'No se pudo revocar la suscripción.');
    }
}
</script>

<template>
  <div class="platform-page module-page">
    <module-state-feedback
      :loading="store.isLoading && !items.length"
      :error="store.error"
      :is-empty="false"
      loading-label="Cargando empresas..."
      @retry="store.loadCompanyOverviews()"
    >
      <div class="platform-page__body">
        <pv-message v-if="store.actionError" severity="error" closable @close="store.actionError = null">
          {{ store.actionError }}
        </pv-message>

        <data-manager
          class="platform-table-manager flex-1 min-h-0"
          :items="items"
          :filtered-items="filteredItems"
          :columns="tableColumns"
          :title="{ singular: 'empresa', plural: 'empresas' }"
          data-key="companyId"
          :loading="store.isLoading"
          :dynamic="true"
          :global-filter-value="searchQuery"
          search-placeholder="Buscar empresa, RUC o plan..."
          :show-new="false"
          :show-export="false"
          :show-selection="false"
          :show-actions="false"
          empty-icon="pi-building"
          empty-title="No hay empresas registradas"
          empty-subtitle="Cuando un restaurante se registre como OWNER aparecerá aquí."
          item-label="empresas"
          :rows="15"
          @global-filter-change="searchQuery = $event"
        >
          <template #co-access="{ data: row }">
            <span
              class="gs-badge"
              :style="{
                background: accessColor(row.accessState) + '22',
                color: accessColor(row.accessState),
                border: '1px solid ' + accessColor(row.accessState) + '66',
              }"
            >
              {{ accessLabel(row.accessState) }}
            </span>
          </template>

          <template #co-end-date="{ data: row }">
            {{ formatDate(row.endDate) }}
          </template>

          <template #co-pending="{ data: row }">
            <span v-if="row.pendingRequestId" class="gs-badge gs-badge--warn">
              {{ REQUEST_TYPE_LABELS[row.pendingRequestType] ?? 'Pendiente' }}
            </span>
            <span v-else class="text-muted">—</span>
          </template>

          <template #co-actions="{ data: row }">
            <div class="platform-row-actions">
              <pv-button
                v-if="!hasSubscription(row)"
                label="Asignar"
                icon="pi pi-plus"
                size="small"
                text
                @click.stop="openAssign(row)"
              />
              <template v-else>
                <pv-button
                  label="Editar"
                  icon="pi pi-pencil"
                  size="small"
                  text
                  @click.stop="openUpdate(row)"
                />
                <pv-button
                  label="Revocar"
                  icon="pi pi-times"
                  size="small"
                  text
                  severity="danger"
                  @click.stop="revokeSubscription(row)"
                />
              </template>
            </div>
          </template>
        </data-manager>
      </div>
    </module-state-feedback>

    <manage-company-subscription-dialog
      v-model:visible="subscriptionDialogVisible"
      :company="selectedCompany"
      :plans="store.plans"
      :mode="subscriptionDialogMode"
      @submit="onSubscriptionSubmit"
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
  white-space: nowrap;
}

.gs-badge--warn {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fcd34d;
}

.text-muted {
  color: #9ca3af;
}

.platform-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
  justify-content: flex-end;
}
</style>
