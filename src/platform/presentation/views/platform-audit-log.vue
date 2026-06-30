<script setup>
import { computed, onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import { PLATFORM_AUDIT_ACTION_LABELS } from '../constants/platform.constants-ui.js';
import DataManager from '../../../shared/presentation/components/data-manager.vue';
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue';

const store = usePlatformStore();
const searchQuery = ref('');

const items = computed(() => store.auditLogs ?? []);

const tableColumns = [
    { field: 'createdAt', header: 'Fecha', sortable: true, template: 'al-date', style: 'min-width: 130px' },
    { field: 'actorDisplayName', header: 'Usuario', sortable: true, template: 'al-actor', style: 'min-width: 140px' },
    { field: 'action', header: 'Acción', sortable: true, template: 'al-action', style: 'min-width: 140px' },
    { field: 'entityLabel', header: 'Referencia', sortable: true, style: 'min-width: 120px' },
    { field: 'details', header: 'Detalle', sortable: false, style: 'min-width: 200px' },
];

onMounted(() => store.loadAuditLogs());

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}

function actionLabel(action) {
    return PLATFORM_AUDIT_ACTION_LABELS[action] ?? action;
}

function actorLabel(data) {
    return data.actorDisplayName || data.actorUsername || '—';
}
</script>

<template>
  <div class="platform-page module-page">
    <module-state-feedback
      :loading="store.isLoading && !items.length"
      :error="store.error"
      :is-empty="false"
      loading-label="Cargando auditoría..."
      @retry="store.loadAuditLogs()"
    >
      <div class="platform-page__body">
        <data-manager
          class="platform-table-manager flex-1 min-h-0"
          :items="items"
          :columns="tableColumns"
          :title="{ singular: 'registro', plural: 'registros' }"
          data-key="auditLogId"
          :loading="store.isLoading"
          :dynamic="true"
          :global-filter-value="searchQuery"
          search-placeholder="Buscar usuario, acción o referencia..."
          :show-new="false"
          :show-export="false"
          :show-selection="false"
          :show-actions="false"
          empty-icon="pi-history"
          empty-title="Sin registros de auditoría"
          empty-subtitle="Las acciones de super admins aparecerán aquí cuando se creen planes, validen solicitudes o den de alta usuarios."
          item-label="registros"
          :rows="20"
          @global-filter-change="searchQuery = $event"
        >
          <template #filters>
            <pv-button
              label="Actualizar"
              icon="pi pi-refresh"
              outlined
              size="small"
              :loading="store.isLoading"
              @click="store.loadAuditLogs()"
            />
          </template>

          <template #al-date="{ data: row }">
            {{ formatDate(row.createdAt) }}
          </template>

          <template #al-actor="{ data: row }">
            <div class="font-semibold">{{ actorLabel(row) }}</div>
            <div class="text-muted text-xs">{{ row.actorUsername }}</div>
          </template>

          <template #al-action="{ data: row }">
            <span class="gs-badge gs-badge--info">{{ actionLabel(row.action) }}</span>
          </template>
        </data-manager>
      </div>
    </module-state-feedback>
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

.gs-badge--info {
  background: #dbeafe;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.text-muted {
  color: #9ca3af;
}

.text-xs {
  font-size: 0.75rem;
}
</style>
