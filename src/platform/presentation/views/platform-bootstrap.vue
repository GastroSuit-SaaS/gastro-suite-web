<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePlatformStore } from '../../application/platform.store.js';
import { IAM_ROUTES } from '../../../iam/presentation/iam.routes.js';

const router = useRouter();
const store = usePlatformStore();

const username = ref('');
const password = ref('');
const unavailable = ref(false);

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
        username: username.value,
        password: password.value,
    });
    router.push(IAM_ROUTES.SIGN_IN);
}
</script>

<template>
  <div class="flex align-items-center justify-content-center min-h-screen p-4 bg-surface">
    <div class="w-full md:w-30rem surface-card border-round-xl p-4 shadow-2">
      <h1 class="text-2xl font-bold mb-2 text-color">Alta super administrador</h1>
      <p class="text-color-secondary mb-4">Solo disponible mientras no exista un usuario SYSTEM.</p>

      <pv-message v-if="unavailable" severity="warn" class="mb-3 w-full">
        Bootstrap no disponible. Inicia sesión o contacta al administrador.
      </pv-message>

      <pv-message v-if="store.error" severity="error" class="mb-3 w-full">{{ store.error }}</pv-message>

      <form v-if="!unavailable" class="flex flex-column gap-3" @submit.prevent="submit">
        <div class="flex flex-column gap-2">
          <label for="username" class="font-semibold text-sm text-color">Usuario</label>
          <pv-input-text id="username" v-model="username" class="w-full" required />
        </div>
        <div class="flex flex-column gap-2">
          <label for="password" class="font-semibold text-sm text-color">Contraseña</label>
          <pv-password id="password" v-model="password" :feedback="false" toggle-mask class="w-full" required />
        </div>
        <pv-button type="submit" label="Crear super admin" :loading="store.isLoading" class="w-full" />
      </form>
    </div>
  </div>
</template>
