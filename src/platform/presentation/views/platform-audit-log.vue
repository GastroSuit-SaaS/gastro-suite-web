<script setup>
import { computed, onMounted } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import { useTablePagination } from '../../../shared/composables/use-table-pagination.js';
import { PLATFORM_AUDIT_ACTION_LABELS } from '../constants/platform.constants-ui.js';
import ModuleTable from '../../../shared/presentation/components/module-table.vue';
import ModuleEmptyState from '../../../shared/presentation/components/module-empty-state.vue';
import TablePaginationBar from '../../../shared/presentation/components/table-pagination-bar.vue';
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue';

const store = usePlatformStore();

const items = computed(() => store.auditLogs ?? []);

const {
    page,
    pageSize,
    totalPages,
    paginatedItems,
    rangeStart,
    rangeEnd,
    totalItems,
} = useTablePagination(items);

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
        <div class="platform-toolbar">
          <pv-button label="Actualizar" icon="pi pi-refresh" outlined size="small" :loading="store.isLoading" @click="store.loadAuditLogs()" />
        </div>

        <module-empty-state
          v-if="!store.isLoading && items.length === 0"
          icon="pi-history"
          title="Sin registros de auditoría"
          subtitle="Las acciones de super admins aparecerán aquí cuando se creen planes, validen solicitudes o den de alta usuarios."
        />

        <template v-else-if="items.length > 0">
          <module-table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Referencia</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedItems" :key="row.auditLogId">
                <td>{{ formatDate(row.createdAt) }}</td>
                <td>
                  <div class="font-semibold">{{ actorLabel(row) }}</div>
                  <div class="text-muted text-xs">{{ row.actorUsername }}</div>
                </td>
                <td>
                  <span class="gs-badge gs-badge--info">{{ actionLabel(row.action) }}</span>
                </td>
                <td>{{ row.entityLabel || '—' }}</td>
                <td>{{ row.details || '—' }}</td>
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
            item-label="registros"
          />
        </template>
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
