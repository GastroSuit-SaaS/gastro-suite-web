<script setup>
import { onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import { usePrimeTableRows } from '../../../shared/composables/use-table-pagination.js';

const store = usePlatformStore();
const {
    rows: tableRows,
    rowsPerPageOptions,
    paginatorTemplate,
    currentPageReportTemplate,
} = usePrimeTableRows();
const assignForm = ref({
    companyId: null,
    subscriptionId: null,
    subscriptionType: 'MENSUAL',
    startDate: new Date().toISOString(),
});

onMounted(async () => {
    await Promise.all([store.loadCompanies(), store.loadPlans()]);
});

async function assign() {
    await store.assignSubscription({ ...assignForm.value });
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4 text-color">Empresas cliente</h2>
    <p class="text-color-secondary mb-4">
      Restaurantes registrados en Gastro Suite. Desde aquí Metasoft asigna o renueva suscripciones; el OWNER solo ve su plan.
    </p>
    <pv-message v-if="store.error" severity="error" class="mb-3">{{ store.error }}</pv-message>

    <div class="surface-card border-round-lg p-4 mb-4">
      <h3 class="font-bold mb-3 text-color">Asignar suscripción</h3>
      <div class="grid">
        <div class="col-12 md:col-3">
          <pv-select
            v-model="assignForm.companyId"
            :options="store.companies"
            option-label="companyName"
            option-value="companyId"
            placeholder="Empresa"
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-3">
          <pv-select
            v-model="assignForm.subscriptionId"
            :options="store.plans"
            option-label="subscriptionName"
            option-value="subscriptionId"
            placeholder="Plan"
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-3">
          <pv-select
            v-model="assignForm.subscriptionType"
            :options="['MENSUAL', 'ANUAL', 'TRIMESTRAL']"
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-3 flex align-items-end">
          <pv-button label="Asignar" :loading="store.isLoading" @click="assign" />
        </div>
      </div>
    </div>

    <pv-data-table
      v-model:rows="tableRows"
      :value="store.companies"
      :loading="store.isLoading"
      :paginator="true"
      :rows-per-page-options="rowsPerPageOptions"
      :paginator-template="paginatorTemplate"
      :current-page-report-template="currentPageReportTemplate"
      size="small"
    >
      <pv-column field="companyName" header="Empresa" />
      <pv-column field="companyRuc" header="RUC" />
      <pv-column field="companyId" header="ID" />
    </pv-data-table>
  </div>
</template>
