<script setup>
import { computed, onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import { useTablePagination } from '../../../shared/composables/use-table-pagination.js';
import ModuleTable from '../../../shared/presentation/components/module-table.vue';
import ModuleEmptyState from '../../../shared/presentation/components/module-empty-state.vue';
import TablePaginationBar from '../../../shared/presentation/components/table-pagination-bar.vue';
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue';
import CreateAndEditPlatformPlan from './create-and-edit-platform-plan.vue';

const store = usePlatformStore();

const showDialog = ref(false);
const editingPlan = ref(null);

const isEditing = computed(() => !!editingPlan.value?.subscriptionId);

const items = computed(() => store.plans ?? []);

const {
    page,
    pageSize,
    totalPages,
    paginatedItems,
    rangeStart,
    rangeEnd,
    totalItems,
} = useTablePagination(items);

onMounted(() => store.loadPlans());

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}

function featureLabel(plan, key) {
    return plan?.[key] === true ? 'Sí' : 'No';
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
    try {
        await store.savePlan(data, editingPlan.value?.subscriptionId ?? null);
        showDialog.value = false;
        editingPlan.value = null;
    } catch {
        /* store.error */
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
        <div class="platform-toolbar">
          <pv-button label="Nuevo plan" icon="pi pi-plus" size="small" @click="openCreate" />
        </div>

        <module-empty-state
          v-if="!store.isLoading && items.length === 0"
          icon="pi-star"
          title="No hay planes publicados"
          subtitle="Crea el primer plan comercial para que los restaurantes puedan solicitar suscripción."
        >
          <pv-button label="Nuevo plan" icon="pi pi-plus" size="small" @click="openCreate" />
        </module-empty-state>

        <template v-else-if="items.length > 0">
          <module-table>
            <thead>
              <tr>
                <th>Plan</th>
                <th style="text-align:right">Mensual</th>
                <th>Suc.</th>
                <th>Usu.</th>
                <th>Activo</th>
                <th>Actualizado</th>
                <th>Inv.</th>
                <th>Rep.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="plan in paginatedItems"
                :key="plan.subscriptionId"
                class="gs-row--clickable"
                @click="openEdit(plan)"
              >
                <td class="font-semibold">{{ plan.subscriptionName }}</td>
                <td style="text-align:right;font-weight:600">S/ {{ plan.subscriptionPriceMontly }}</td>
                <td>{{ plan.subscriptionMaxBranches }}</td>
                <td>{{ plan.subscriptionMaxUsers }}</td>
                <td>
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
                </td>
                <td>{{ formatDate(plan.updatedAt) }}</td>
                <td>{{ featureLabel(plan, 'subscriptionHasInventory') }}</td>
                <td>{{ featureLabel(plan, 'subscriptionHasReports') }}</td>
                <td class="td-actions">
                  <pv-button icon="pi pi-pencil" text rounded size="small" severity="info" @click.stop="openEdit(plan)" />
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
            item-label="planes"
          />
        </template>
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
}

.platform-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.gs-badge {
  display: inline-flex;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.td-actions {
  width: 3rem;
  white-space: nowrap;
}
</style>
