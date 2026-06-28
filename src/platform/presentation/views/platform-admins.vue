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
const form = ref({ username: '', password: '' });

onMounted(() => store.loadAdmins());

async function create() {
    await store.createAdmin({ ...form.value });
    form.value = { username: '', password: '' };
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4 text-color">Super administradores</h2>
    <pv-message v-if="store.error" severity="error" class="mb-3">{{ store.error }}</pv-message>

    <div class="surface-card border-round-lg p-4 mb-4">
      <h3 class="font-bold mb-3 text-color">Nuevo SYSTEM</h3>
      <div class="flex flex-column md:flex-row gap-2">
        <pv-input-text v-model="form.username" placeholder="Usuario" class="flex-1" />
        <pv-password v-model="form.password" :feedback="false" toggle-mask placeholder="Contraseña" class="flex-1" />
        <pv-button label="Crear" :loading="store.isLoading" @click="create" />
      </div>
    </div>

    <pv-data-table
      v-model:rows="tableRows"
      :value="store.admins"
      :loading="store.isLoading"
      :paginator="true"
      :rows-per-page-options="rowsPerPageOptions"
      :paginator-template="paginatorTemplate"
      :current-page-report-template="currentPageReportTemplate"
      size="small"
    >
      <pv-column field="username" header="Usuario" />
      <pv-column field="userId" header="ID" />
      <pv-column field="active" header="Activo">
        <template #body="{ data }">{{ data.active ? 'Sí' : 'No' }}</template>
      </pv-column>
    </pv-data-table>
  </div>
</template>
