<script setup>
import { computed, onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import DataManager from '../../../shared/presentation/components/data-manager.vue';
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue';
import CreateAndEditPlatformAdmin from './create-and-edit-platform-admin.vue';
import { useNotification } from '../../../shared/presentation/composables/use-notification.js';
import { CRUD_MESSAGES } from '../../../shared/presentation/constants/crud-messages.constants.js';

const store = usePlatformStore();
const { showSuccess, showError } = useNotification();
const showDialog = ref(false);
const searchQuery = ref('');

const items = computed(() => store.admins ?? []);

const filteredItems = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return items.value;
    return items.value.filter((row) => {
        const name = fullName(row).toLowerCase();
        return name.includes(q)
            || (row.username ?? '').toLowerCase().includes(q)
            || (row.email ?? '').toLowerCase().includes(q)
            || (row.numeroDocumento ?? '').includes(q);
    });
});

function fullName(row) {
    return [row.nombres, row.apellidos].filter(Boolean).join(' ').trim() || '—';
}

const tableColumns = [
    { field: 'fullName', header: 'Nombre', sortable: true, template: 'pa-name', style: 'min-width: 160px' },
    { field: 'username', header: 'Usuario', sortable: true, style: 'min-width: 120px' },
    { field: 'email', header: 'Correo', sortable: true, style: 'min-width: 160px' },
    { field: 'tipoDocumento', header: 'Doc.', sortable: true, style: 'min-width: 80px' },
    { field: 'numeroDocumento', header: 'Número', sortable: true, style: 'min-width: 100px' },
    { field: 'telefono', header: 'Teléfono', sortable: true, style: 'min-width: 100px' },
    { field: 'createdAt', header: 'Alta', sortable: true, template: 'pa-created', style: 'min-width: 110px' },
    { field: 'active', header: 'Activo', sortable: true, template: 'pa-active', style: 'min-width: 80px' },
];

onMounted(() => store.loadAdmins());

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function onAdminSaved(payload) {
    try {
        await store.createAdmin(payload);
        showDialog.value = false;
        showSuccess(CRUD_MESSAGES.created('Super administrador'));
    } catch {
        showError(store.actionError ?? store.error ?? 'No se pudo crear el super administrador');
    }
}
</script>

<template>
  <div class="platform-page module-page">
    <module-state-feedback
      :loading="store.isLoading && !items.length"
      :error="store.error"
      :is-empty="false"
      loading-label="Cargando administradores..."
      @retry="store.loadAdmins()"
    >
      <div class="platform-page__body">
        <data-manager
          class="platform-table-manager flex-1 min-h-0"
          :items="items"
          :filtered-items="filteredItems"
          :columns="tableColumns"
          :title="{ singular: 'administrador', plural: 'administradores' }"
          data-key="userId"
          :loading="store.isLoading"
          :dynamic="true"
          :global-filter-value="searchQuery"
          search-placeholder="Buscar nombre, usuario o correo..."
          :inline-toolbar="true"
          new-button-label="Nuevo super admin"
          :show-export="false"
          :show-selection="false"
          :show-actions="false"
          empty-icon="pi-shield"
          empty-title="No hay super administradores"
          empty-subtitle="Crea el primer usuario SYSTEM para operar la plataforma Metasoft."
          item-label="administradores"
          :rows="15"
          @new-item-requested-manager="showDialog = true"
          @global-filter-change="searchQuery = $event"
        >
          <template #empty-actions>
            <pv-button label="Nuevo super admin" icon="pi pi-user-plus" size="small" @click="showDialog = true" />
          </template>

          <template #pa-name="{ data: row }">
            <span class="font-semibold">{{ fullName(row) }}</span>
          </template>

          <template #pa-created="{ data: row }">
            {{ formatDate(row.createdAt) }}
          </template>

          <template #pa-active="{ data: row }">
            <span
              class="gs-badge"
              :style="{
                background: (row.active ? '#059669' : '#6b7280') + '22',
                color: row.active ? '#059669' : '#6b7280',
                border: '1px solid ' + (row.active ? '#059669' : '#6b7280') + '66',
              }"
            >
              {{ row.active ? 'Sí' : 'No' }}
            </span>
          </template>
        </data-manager>
      </div>
    </module-state-feedback>

    <create-and-edit-platform-admin
      v-model:visible="showDialog"
      @admin-saved="onAdminSaved"
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
</style>
