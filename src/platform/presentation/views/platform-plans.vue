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

const FEATURE_FIELDS = [
    { key: 'subscriptionHasInventory', label: 'Inventario' },
    { key: 'subscriptionHasReports', label: 'Reportes completos' },
    { key: 'subscriptionHasReservations', label: 'Reservas' },
    { key: 'subscriptionHasKitchen', label: 'Cocina / estaciones' },
    { key: 'subscriptionHasDashboardComparison', label: 'Comparación dashboard' },
    { key: 'subscriptionHasExcelExport', label: 'Exportación Excel' },
    { key: 'subscriptionHasPushNotifications', label: 'Notificaciones push' },
];

const defaultForm = () => ({
    subscriptionName: '',
    subscriptionPriceMontly: 99.9,
    subscriptionPriceAnnual: 999,
    subscriptionMaxBranches: 3,
    subscriptionMaxUsers: 10,
    subscriptionMaxTables: 30,
    subscriptionMaxMenuItems: 200,
    subscriptionHasInventory: true,
    subscriptionHasReports: true,
    subscriptionHasReservations: true,
    subscriptionHasKitchen: true,
    subscriptionHasDashboardComparison: false,
    subscriptionHasExcelExport: true,
    subscriptionHasPushNotifications: true,
});

const form = ref(defaultForm());

onMounted(() => store.loadPlans());

async function createPlan() {
    try {
        await store.savePlan({ ...form.value });
        form.value = defaultForm();
    } catch {
        /* error en store.error */
    }
}

function featureLabel(plan, key) {
    return plan?.[key] === true ? 'Sí' : 'No';
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4 text-color">Planes de suscripción</h2>
    <pv-message v-if="store.error" severity="error" class="mb-3">{{ store.error }}</pv-message>

    <div class="grid">
      <div class="col-12 lg:col-5">
        <div class="surface-card border-round-lg p-4 mb-4">
          <h3 class="font-bold mb-3 text-color">Nuevo plan</h3>
          <div class="flex flex-column gap-2">
            <pv-input-text v-model="form.subscriptionName" placeholder="Nombre del plan" class="w-full" />
            <pv-input-number v-model="form.subscriptionPriceMontly" placeholder="Precio mensual (S/)" class="w-full" :min-fraction-digits="2" />
            <pv-input-number v-model="form.subscriptionPriceAnnual" placeholder="Precio anual (S/)" class="w-full" :min-fraction-digits="2" />
            <pv-input-number v-model="form.subscriptionMaxBranches" placeholder="Max sucursales" class="w-full" />
            <pv-input-number v-model="form.subscriptionMaxUsers" placeholder="Max usuarios" class="w-full" />
            <pv-input-number v-model="form.subscriptionMaxTables" placeholder="Max mesas / sucursal" class="w-full" />
            <pv-input-number v-model="form.subscriptionMaxMenuItems" placeholder="Max ítems menú / sucursal" class="w-full" />

            <p class="text-sm font-semibold mt-2 mb-0 text-color-secondary">Módulos incluidos</p>
            <div v-for="field in FEATURE_FIELDS" :key="field.key" class="flex align-items-center gap-2">
              <pv-checkbox v-model="form[field.key]" :input-id="field.key" binary />
              <label :for="field.key" class="cursor-pointer">{{ field.label }}</label>
            </div>
            <p class="text-xs text-color-secondary mt-1 mb-0">
              Si «Reportes completos» está desactivado, el plan solo permite ventas diarias (Gastro Local).
            </p>

            <pv-button label="Crear plan" :loading="store.isLoading" class="mt-2" @click="createPlan" />
          </div>
        </div>
      </div>
      <div class="col-12 lg:col-7">
        <pv-data-table
          v-model:rows="tableRows"
          :value="store.plans"
          :loading="store.isLoading"
          :paginator="true"
          :rows-per-page-options="rowsPerPageOptions"
          :paginator-template="paginatorTemplate"
          :current-page-report-template="currentPageReportTemplate"
          size="small"
          scrollable
          scroll-height="520px"
        >
          <pv-column field="subscriptionName" header="Plan" frozen />
          <pv-column field="subscriptionMaxBranches" header="Suc." />
          <pv-column field="subscriptionMaxUsers" header="Usu." />
          <pv-column field="subscriptionMaxTables" header="Mesas" />
          <pv-column field="subscriptionMaxMenuItems" header="Menú" />
          <pv-column header="Inv.">
            <template #body="{ data }">{{ featureLabel(data, 'subscriptionHasInventory') }}</template>
          </pv-column>
          <pv-column header="Rep.">
            <template #body="{ data }">{{ featureLabel(data, 'subscriptionHasReports') }}</template>
          </pv-column>
          <pv-column header="Res.">
            <template #body="{ data }">{{ featureLabel(data, 'subscriptionHasReservations') }}</template>
          </pv-column>
          <pv-column header="Coc.">
            <template #body="{ data }">{{ featureLabel(data, 'subscriptionHasKitchen') }}</template>
          </pv-column>
          <pv-column header="Cmp.">
            <template #body="{ data }">{{ featureLabel(data, 'subscriptionHasDashboardComparison') }}</template>
          </pv-column>
          <pv-column header="XLS">
            <template #body="{ data }">{{ featureLabel(data, 'subscriptionHasExcelExport') }}</template>
          </pv-column>
          <pv-column header="Push">
            <template #body="{ data }">{{ featureLabel(data, 'subscriptionHasPushNotifications') }}</template>
          </pv-column>
        </pv-data-table>
      </div>
    </div>
  </div>
</template>
