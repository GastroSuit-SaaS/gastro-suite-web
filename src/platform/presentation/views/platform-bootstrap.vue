<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { usePlatformStore } from '../../application/platform.store.js';
import { IAM_ROUTES } from '../../../iam/presentation/iam.routes.js';
import { PLATFORM_DOCUMENT_TYPES } from '../constants/platform.constants-ui.js';

const router = useRouter();
const store = usePlatformStore();

const unavailable = ref(false);

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

onMounted(async () => {
    try {
        const status = await store.fetchBootstrapStatus();
        if (!status?.available) {
            unavailable.value = true;
        }
    } catch {
        unavailable.value = true;
    }
});

async function submit() {
    await store.bootstrapSuperAdmin({
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
    router.push(IAM_ROUTES.SIGN_IN);
}
</script>

<template>
  <div class="flex align-items-center justify-content-center min-h-screen p-4 bg-surface">
    <div class="w-full md:w-36rem surface-card border-round-xl p-4 shadow-2">
      <h1 class="text-2xl font-bold mb-2 text-color">Alta super administrador</h1>
      <p class="text-color-secondary mb-4">Solo disponible mientras no exista un usuario SYSTEM.</p>

      <pv-message v-if="unavailable" severity="warn" class="mb-3 w-full">
        Bootstrap no disponible. Inicia sesión o contacta al administrador.
      </pv-message>

      <pv-message v-if="store.error" severity="error" class="mb-3 w-full">{{ store.error }}</pv-message>

      <form v-if="!unavailable" class="flex flex-column gap-3" @submit.prevent="submit">
        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="nombres" class="font-semibold text-sm text-color">Nombres</label>
            <pv-input-text id="nombres" v-model="form.nombres" class="w-full" required />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="apellidos" class="font-semibold text-sm text-color">Apellidos</label>
            <pv-input-text id="apellidos" v-model="form.apellidos" class="w-full" required />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="font-semibold text-sm text-color">Tipo documento</label>
            <pv-select v-model="form.tipoDocumento" :options="PLATFORM_DOCUMENT_TYPES" option-label="label" option-value="value" class="w-full" />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="numeroDocumento" class="font-semibold text-sm text-color">Número documento</label>
            <pv-input-text id="numeroDocumento" v-model="form.numeroDocumento" class="w-full" required />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="email" class="font-semibold text-sm text-color">Correo</label>
            <pv-input-text id="email" v-model="form.email" type="email" class="w-full" required />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="telefono" class="font-semibold text-sm text-color">Teléfono</label>
            <pv-input-text id="telefono" v-model="form.telefono" class="w-full" required />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="username" class="font-semibold text-sm text-color">Usuario</label>
            <pv-input-text id="username" v-model="form.username" class="w-full" required />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="password" class="font-semibold text-sm text-color">Contraseña</label>
            <pv-password id="password" v-model="form.password" :feedback="false" toggle-mask class="w-full" required />
          </div>
        </div>
        <pv-button type="submit" label="Crear super admin" :loading="store.isLoading" class="w-full" />
      </form>
    </div>
  </div>
</template>
