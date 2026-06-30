<script setup>
import { reactive, watch, computed, defineModel } from 'vue';
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue';
import { PLATFORM_SUBSCRIPTION_TYPE_OPTIONS } from '../constants/platform.constants-ui.js';

const props = defineProps({
    company: { type: Object, default: null },
    plans: { type: Array, default: () => [] },
    mode: { type: String, default: 'assign' },
});

const visible = defineModel('visible', { type: Boolean, default: false });

const emit = defineEmits(['submit']);

const form = reactive({
    subscriptionId: null,
    subscriptionType: 'MENSUAL',
    startDate: null,
    endDate: null,
    isActive: true,
});

const planOptions = computed(() =>
    (props.plans ?? [])
        .filter((p) => p.isActive !== false)
        .map((p) => ({
            label: p.subscriptionName ?? p.planName ?? 'Plan',
            value: p.subscriptionId,
        })),
);

const isAssign = computed(() => props.mode === 'assign');

const headerOverride = computed(() =>
    isAssign.value ? 'Asignar suscripción' : 'Actualizar suscripción',
);

function toDateInputValue(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

function toInstantStart(dateStr) {
    if (!dateStr) return new Date().toISOString();
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function toInstantEnd(dateStr) {
    if (!dateStr) return null;
    return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}

watch(visible, (val) => {
    if (!val) return;
    const c = props.company;
    if (isAssign.value) {
        Object.assign(form, {
            subscriptionId: null,
            subscriptionType: 'MENSUAL',
            startDate: toDateInputValue(new Date().toISOString()),
            endDate: null,
            isActive: true,
        });
    } else {
        Object.assign(form, {
            subscriptionId: c?.subscriptionId ?? null,
            subscriptionType: c?.subscriptionType ?? 'MENSUAL',
            startDate: toDateInputValue(c?.startDate),
            endDate: toDateInputValue(c?.endDate),
            isActive: c?.subscriptionActive !== false,
        });
    }
});

function onCancel() {
    visible.value = false;
}

function onSave() {
    if (isAssign.value) {
        if (!form.subscriptionId) return;
        emit('submit', {
            mode: 'assign',
            payload: {
                companyId: props.company?.companyId,
                subscriptionId: form.subscriptionId,
                subscriptionType: form.subscriptionType,
                startDate: toInstantStart(form.startDate),
            },
        });
    } else {
        emit('submit', {
            mode: 'update',
            companyId: props.company?.companyId,
            payload: {
                subscriptionType: form.subscriptionType,
                startDate: form.startDate ? toInstantStart(form.startDate) : undefined,
                endDate: form.endDate ? toInstantEnd(form.endDate) : undefined,
                isActive: form.isActive,
            },
        });
    }
    visible.value = false;
}
</script>

<template>
  <CreateAndEdit
    :visible="visible"
    :edit="!isAssign"
    entity-name="suscripción"
    size="standard"
    :header-title-override="headerOverride"
    :custom-button-label="isAssign ? 'Asignar' : 'Guardar'"
    @canceled-shared="onCancel"
    @saved-shared="onSave"
  >
    <template #content>
      <div class="flex flex-column gap-3 pt-2">
        <p v-if="company" class="m-0 text-sm" style="color: #6b7280;">
          {{ company.companyName }} — RUC {{ company.companyRuc || '—' }}
        </p>

        <div v-if="isAssign" class="flex flex-column gap-2">
          <label class="text-sm font-medium" style="color: #374151;">Plan</label>
          <pv-select
            v-model="form.subscriptionId"
            :options="planOptions"
            option-label="label"
            option-value="value"
            placeholder="Selecciona un plan"
            class="w-full"
          />
        </div>

        <div class="flex flex-column gap-2">
          <label class="text-sm font-medium" style="color: #374151;">Periodicidad</label>
          <pv-select
            v-model="form.subscriptionType"
            :options="PLATFORM_SUBSCRIPTION_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>

        <div class="flex flex-column gap-2">
          <label class="text-sm font-medium" style="color: #374151;">Inicio</label>
          <input v-model="form.startDate" type="date" class="platform-sub-field" />
        </div>

        <div v-if="!isAssign" class="flex flex-column gap-2">
          <label class="text-sm font-medium" style="color: #374151;">Vencimiento (opcional)</label>
          <input v-model="form.endDate" type="date" class="platform-sub-field" />
        </div>

        <div v-if="!isAssign" class="flex align-items-center gap-2">
          <pv-checkbox v-model="form.isActive" binary input-id="sub-active" />
          <label for="sub-active" class="text-sm" style="color: #374151;">Suscripción activa</label>
        </div>
      </div>
    </template>
  </CreateAndEdit>
</template>

<style scoped>
.platform-sub-field {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
