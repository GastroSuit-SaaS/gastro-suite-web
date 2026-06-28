<script setup>
import { computed, onMounted, ref } from 'vue';
import { usePlatformStore } from '../../application/platform.store.js';
import { useTablePagination } from '../../../shared/composables/use-table-pagination.js';
import ModuleTable from '../../../shared/presentation/components/module-table.vue';
import ModuleEmptyState from '../../../shared/presentation/components/module-empty-state.vue';
import TablePaginationBar from '../../../shared/presentation/components/table-pagination-bar.vue';
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue';

const store = usePlatformStore();

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

const items = computed(() => store.companyOverviews ?? []);

const {
    page,
    pageSize,
    totalPages,
    paginatedItems,
    rangeStart,
    rangeEnd,
    totalItems,
} = useTablePagination(items);

onMounted(() => {
    store.loadCompanyOverviews();
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
        <module-empty-state
          v-if="!store.isLoading && items.length === 0"
          icon="pi-building"
          title="No hay empresas registradas"
          subtitle="Cuando un restaurante se registre como OWNER aparecerá aquí."
        />

        <template v-else-if="items.length > 0">
          <module-table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>RUC</th>
                <th>Plan</th>
                <th>Periodicidad</th>
                <th>Estado</th>
                <th>Vence</th>
                <th>Solicitud pendiente</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedItems" :key="row.companyId">
                <td class="font-semibold">{{ row.companyName || '—' }}</td>
                <td>{{ row.companyRuc || '—' }}</td>
                <td>{{ row.planName || '—' }}</td>
                <td>{{ row.subscriptionType || '—' }}</td>
                <td>
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
                </td>
                <td>{{ formatDate(row.endDate) }}</td>
                <td>
                  <span
                    v-if="row.pendingRequestId"
                    class="gs-badge gs-badge--warn"
                  >
                    {{ REQUEST_TYPE_LABELS[row.pendingRequestType] ?? 'Pendiente' }}
                  </span>
                  <span v-else class="text-muted">—</span>
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
            item-label="empresas"
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
</style>
