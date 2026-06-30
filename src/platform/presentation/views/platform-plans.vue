<script setup>
import { computed, onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import DataManager from '../../../shared/presentation/components/data-manager.vue';
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue';
import CreateAndEditPlatformPlan from './create-and-edit-platform-plan.vue';
import { useNotification } from '../../../shared/presentation/composables/use-notification.js';
import { CRUD_MESSAGES } from '../../../shared/presentation/constants/crud-messages.constants.js';

const store = usePlatformStore();
const { showSuccess, showError } = useNotification();

const showDialog = ref(false);
const editingPlan = ref(null);
const searchQuery = ref('');

const isEditing = computed(() => !!editingPlan.value?.subscriptionId);

const items = computed(() => store.plans ?? []);

const tableColumns = [
    { field: 'subscriptionName', header: 'Plan', sortable: true, style: 'min-width: 140px' },
    { field: 'subscriptionPriceMontly', header: 'Mensual', sortable: true, template: 'pl-price', bodyStyle: 'text-align: right', headerStyle: 'text-align: right' },
    { field: 'subscriptionMaxBranches', header: 'Suc.', sortable: true, style: 'min-width: 64px' },
    { field: 'subscriptionMaxUsers', header: 'Usu.', sortable: true, style: 'min-width: 64px' },
    { field: 'isActive', header: 'Activo', sortable: true, template: 'pl-active', style: 'min-width: 80px' },
    { field: 'updatedAt', header: 'Actualizado', sortable: true, template: 'pl-updated', style: 'min-width: 130px' },
    { field: 'subscriptionHasInventory', header: 'Inv.', sortable: true, template: 'pl-feature', style: 'min-width: 56px' },
    { field: 'subscriptionHasReports', header: 'Rep.', sortable: true, template: 'pl-feature-rep', style: 'min-width: 56px' },
    { field: 'actions', header: '', sortable: false, template: 'pl-actions', style: 'min-width: 3rem' },
];

onMounted(() => store.loadPlans());

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}

function featureLabel(plan, key) {
    return plan?.[key] === true ? 'Sí' : 'No';
}

function planRowClass() {
    return 'platform-row--clickable';
}

function openCreate() {
    editingPlan.value = null;
    showDialog.value = true;
}

function openEdit(plan) {
    editingPlan.value = { ...plan };
    showDialog.value = true;
}

async function onPlanSaved(data) {
    const isEdit = isEditing.value;
    try {
        await store.savePlan(data, editingPlan.value?.subscriptionId ?? null);
        showDialog.value = false;
        editingPlan.value = null;
        showSuccess(isEdit ? CRUD_MESSAGES.updated('Plan') : CRUD_MESSAGES.created('Plan'));
    } catch {
        showError(store.actionError ?? store.error ?? 'No se pudo guardar el plan');
    }
}
</script>

<template>
  <div class="platform-page module-page">
    <module-state-feedback
      :loading="store.isLoading && !items.length"
      :error="store.error"
      :is-empty="false"
      loading-label="Cargando planes..."
      @retry="store.loadPlans()"
    >
      <div class="platform-page__body">
        <data-manager
          class="platform-table-manager flex-1 min-h-0"
          :items="items"
          :columns="tableColumns"
          :title="{ singular: 'plan', plural: 'planes' }"
          data-key="subscriptionId"
          :loading="store.isLoading"
          :dynamic="true"
          :global-filter-value="searchQuery"
          :row-class="planRowClass"
          search-placeholder="Buscar plan..."
          :inline-toolbar="true"
          new-button-label="Nuevo plan"
          :show-export="false"
          :show-selection="false"
          :show-actions="false"
          empty-icon="pi-star"
          empty-title="No hay planes publicados"
          empty-subtitle="Crea el primer plan comercial para que los restaurantes puedan solicitar suscripción."
          item-label="planes"
          :rows="15"
          @new-item-requested-manager="openCreate"
          @global-filter-change="searchQuery = $event"
          @view-item-requested-manager="openEdit"
        >
          <template #empty-actions>
            <pv-button label="Nuevo plan" icon="pi pi-plus" size="small" @click="openCreate" />
          </template>

          <template #pl-price="{ data: plan }">
            <span class="font-semibold">S/ {{ plan.subscriptionPriceMontly }}</span>
          </template>

          <template #pl-active="{ data: plan }">
            <span
              class="gs-badge"
              :style="{
                background: (plan.isActive !== false ? '#059669' : '#6b7280') + '22',
                color: plan.isActive !== false ? '#059669' : '#6b7280',
                border: '1px solid ' + (plan.isActive !== false ? '#059669' : '#6b7280') + '66',
              }"
            >
              {{ plan.isActive !== false ? 'Sí' : 'No' }}
            </span>
          </template>

          <template #pl-updated="{ data: plan }">
            {{ formatDate(plan.updatedAt) }}
          </template>

          <template #pl-feature="{ data: plan }">
            {{ featureLabel(plan, 'subscriptionHasInventory') }}
          </template>

          <template #pl-feature-rep="{ data: plan }">
            {{ featureLabel(plan, 'subscriptionHasReports') }}
          </template>

          <template #pl-actions="{ data: plan }">
            <button
              type="button"
              class="dm-action-btn dm-action-btn--edit"
              title="Editar"
              @click.stop="openEdit(plan)"
            >
              <i class="pi pi-pencil" />
            </button>
          </template>
        </data-manager>
      </div>
    </module-state-feedback>

    <create-and-edit-platform-plan
      v-model:visible="showDialog"
      :edit="isEditing"
      :plan="editingPlan"
      @plan-saved="onPlanSaved"
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

:deep(.platform-row--clickable) {
  cursor: pointer;
}
</style>
