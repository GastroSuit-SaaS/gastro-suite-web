<script setup>
import { reactive, watch, computed, defineModel } from 'vue';
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue';

const FEATURE_FIELDS = [
    { key: 'subscriptionHasInventory', label: 'Inventario' },
    { key: 'subscriptionHasReports', label: 'Reportes completos' },
    { key: 'subscriptionHasReservations', label: 'Reservas' },
    { key: 'subscriptionHasKitchen', label: 'Cocina / estaciones' },
    { key: 'subscriptionHasDashboardComparison', label: 'Comparación dashboard' },
    { key: 'subscriptionHasExcelExport', label: 'Exportación Excel' },
    { key: 'subscriptionHasPushNotifications', label: 'Notificaciones push' },
];

const props = defineProps({
    edit: { type: Boolean, default: false },
    plan: { type: Object, default: null },
});

const visible = defineModel('visible', { type: Boolean, default: false });

const emit = defineEmits(['plan-saved']);

const form = reactive({
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
    isActive: true,
});

watch(visible, (val) => {
    if (!val) return;
    const p = props.plan;
    if (p) {
        Object.assign(form, {
            subscriptionName: p.subscriptionName ?? '',
            subscriptionPriceMontly: p.subscriptionPriceMontly ?? 0,
            subscriptionPriceAnnual: p.subscriptionPriceAnnual ?? 0,
            subscriptionMaxBranches: p.subscriptionMaxBranches ?? 1,
            subscriptionMaxUsers: p.subscriptionMaxUsers ?? 1,
            subscriptionMaxTables: p.subscriptionMaxTables ?? 1,
            subscriptionMaxMenuItems: p.subscriptionMaxMenuItems ?? 1,
            subscriptionHasInventory: p.subscriptionHasInventory === true,
            subscriptionHasReports: p.subscriptionHasReports !== false,
            subscriptionHasReservations: p.subscriptionHasReservations !== false,
            subscriptionHasKitchen: p.subscriptionHasKitchen !== false,
            subscriptionHasDashboardComparison: p.subscriptionHasDashboardComparison === true,
            subscriptionHasExcelExport: p.subscriptionHasExcelExport !== false,
            subscriptionHasPushNotifications: p.subscriptionHasPushNotifications !== false,
            isActive: p.isActive !== false,
        });
    } else {
        Object.assign(form, {
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
            isActive: true,
        });
    }
});

const submitLabel = computed(() => (props.edit ? 'Guardar plan' : 'Crear plan'));

function onCancel() {
    visible.value = false;
}

function onSave() {
    const name = form.subscriptionName?.trim();
    if (!name) return;
    emit('plan-saved', { ...form, subscriptionName: name });
}
</script>

<template>
  <CreateAndEdit
    :visible="visible"
    :edit="edit"
    entity-name="plan comercial"
    size="standard"
    :custom-button-label="submitLabel"
    @canceled-shared="onCancel"
    @saved-shared="onSave"
  >
    <template #content>
      <div class="flex flex-column gap-3 pt-2">
        <div class="flex flex-column gap-2">
          <label class="text-sm font-medium" style="color: #374151;">Nombre del plan <span class="text-red-500">*</span></label>
          <pv-input-text v-model="form.subscriptionName" placeholder="Ej: Gastro Salón" />
        </div>

        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Precio mensual (S/)</label>
            <pv-input-number v-model="form.subscriptionPriceMontly" class="w-full" :min-fraction-digits="2" />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Precio anual (S/)</label>
            <pv-input-number v-model="form.subscriptionPriceAnnual" class="w-full" :min-fraction-digits="2" />
          </div>
        </div>

        <div class="grid">
          <div class="col-6 md:col-3 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Sucursales</label>
            <pv-input-number v-model="form.subscriptionMaxBranches" class="w-full" />
          </div>
          <div class="col-6 md:col-3 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Usuarios</label>
            <pv-input-number v-model="form.subscriptionMaxUsers" class="w-full" />
          </div>
          <div class="col-6 md:col-3 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Mesas</label>
            <pv-input-number v-model="form.subscriptionMaxTables" class="w-full" />
          </div>
          <div class="col-6 md:col-3 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Platos menú</label>
            <pv-input-number v-model="form.subscriptionMaxMenuItems" class="w-full" />
          </div>
        </div>

        <div v-if="edit" class="flex align-items-center gap-2">
          <pv-checkbox v-model="form.isActive" input-id="plan-active" binary />
          <label for="plan-active" class="cursor-pointer text-sm" style="color: #374151;">Plan activo en catálogo</label>
        </div>

        <div>
          <p class="text-sm font-semibold mb-2 mt-0" style="color: #374151;">Módulos incluidos</p>
          <div class="flex flex-column gap-2">
            <div v-for="field in FEATURE_FIELDS" :key="field.key" class="flex align-items-center gap-2">
              <pv-checkbox v-model="form[field.key]" :input-id="field.key" binary />
              <label :for="field.key" class="cursor-pointer text-sm" style="color: #374151;">{{ field.label }}</label>
            </div>
          </div>
        </div>
      </div>
    </template>
  </CreateAndEdit>
</template>
