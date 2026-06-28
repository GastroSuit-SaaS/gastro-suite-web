<script setup>
import { reactive, watch, defineModel } from 'vue';
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue';
import { PLATFORM_DOCUMENT_TYPES } from '../constants/platform.constants-ui.js';

const visible = defineModel('visible', { type: Boolean, default: false });

const emit = defineEmits(['admin-saved']);

const form = reactive({
    username: '',
    password: '',
    nombres: '',
    apellidos: '',
    email: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    telefono: '',
});

watch(visible, (val) => {
    if (val) {
        Object.assign(form, {
            username: '',
            password: '',
            nombres: '',
            apellidos: '',
            email: '',
            tipoDocumento: 'DNI',
            numeroDocumento: '',
            telefono: '',
        });
    }
});

function onCancel() {
    visible.value = false;
}

function onSave() {
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.username.trim() || !form.password) return;
    emit('admin-saved', {
        username: form.username.trim(),
        password: form.password,
        profile: {
            nombres: form.nombres.trim(),
            apellidos: form.apellidos.trim(),
            email: form.email.trim(),
            tipoDocumento: form.tipoDocumento,
            numeroDocumento: form.numeroDocumento.trim(),
            telefono: form.telefono.trim(),
        },
    });
}
</script>

<template>
  <CreateAndEdit
    :visible="visible"
    :edit="false"
    entity-name="super administrador"
    size="standard"
    custom-button-label="Crear super admin"
    @canceled-shared="onCancel"
    @saved-shared="onSave"
  >
    <template #content>
      <div class="flex flex-column gap-3 pt-2">
        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Nombres <span class="text-red-500">*</span></label>
            <pv-input-text v-model="form.nombres" />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Apellidos <span class="text-red-500">*</span></label>
            <pv-input-text v-model="form.apellidos" />
          </div>
          <div class="col-12 md:col-4 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Tipo documento</label>
            <pv-select v-model="form.tipoDocumento" :options="PLATFORM_DOCUMENT_TYPES" option-label="label" option-value="value" class="w-full" />
          </div>
          <div class="col-12 md:col-4 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Número documento</label>
            <pv-input-text v-model="form.numeroDocumento" />
          </div>
          <div class="col-12 md:col-4 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Teléfono</label>
            <pv-input-text v-model="form.telefono" />
          </div>
          <div class="col-12 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Correo <span class="text-red-500">*</span></label>
            <pv-input-text v-model="form.email" type="email" />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Usuario <span class="text-red-500">*</span></label>
            <pv-input-text v-model="form.username" />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="text-sm font-medium" style="color: #374151;">Contraseña <span class="text-red-500">*</span></label>
            <pv-password v-model="form.password" :feedback="false" toggle-mask class="w-full" />
          </div>
        </div>
      </div>
    </template>
  </CreateAndEdit>
</template>
