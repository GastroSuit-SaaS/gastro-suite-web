<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useIamStore } from '../../application/iam.store.js';
import { IAM_ROUTES } from '../iam.routes.js';
import IamBranding from '../components/iam-branding.vue';

const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();

const password = ref('');
const confirmPassword = ref('');
const success = ref(false);
const localError = ref('');

const token = computed(() => String(route.query.token ?? '').trim());
const hasToken = computed(() => token.value.length >= 32);

async function handleSubmit() {
    localError.value = '';
    if (!hasToken.value) {
        localError.value = 'El enlace no es válido. Solicita uno nuevo.';
        return;
    }
    if (password.value.length < 8) {
        localError.value = 'La contraseña debe tener al menos 8 caracteres.';
        return;
    }
    if (password.value !== confirmPassword.value) {
        localError.value = 'Las contraseñas no coinciden.';
        return;
    }

    const ok = await iamStore.resetPassword(token.value, password.value);
    if (ok) {
        success.value = true;
        return;
    }
    localError.value = iamStore.error;
}
</script>

<template>
  <div class="flex flex-column md:flex-row w-full min-h-screen">

    <iam-branding />

    <div class="bg-surface flex align-items-center justify-content-center p-4 md:p-6 w-full md:w-6 md:h-screen">
      <div class="w-full form-container px-2 md:px-3">

        <div class="mb-4 text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-2 text-color">Nueva contraseña</h2>
          <p class="text-sm m-0 text-color-secondary">
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        <div v-if="success" class="flex flex-column align-items-center gap-3 py-4 text-center">
          <div class="success-icon-circle flex align-items-center justify-content-center">
            <i class="pi pi-check" style="font-size: 1.5rem; color: #22c55e;"></i>
          </div>
          <h3 class="text-xl font-bold m-0 text-color">Contraseña actualizada</h3>
          <p class="text-sm text-color-secondary m-0 line-height-3">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <pv-button
            label="Ir a iniciar sesión"
            icon="pi pi-sign-in"
            class="w-full mt-2"
            @click="router.push(IAM_ROUTES.SIGN_IN)"
          />
        </div>

        <form v-else @submit.prevent="handleSubmit" class="flex flex-column gap-3">

          <pv-message v-if="!hasToken" severity="warn" class="w-full">
            Enlace inválido o expirado. Solicita uno nuevo desde recuperar contraseña.
          </pv-message>

          <pv-message v-if="localError || iamStore.error" severity="error" class="w-full">
            {{ localError || iamStore.error }}
          </pv-message>

          <div class="flex flex-column gap-2">
            <label for="password" class="font-semibold text-sm text-color">Nueva contraseña</label>
            <pv-password
              id="password"
              v-model="password"
              toggle-mask
              :feedback="false"
              class="w-full"
              input-class="w-full"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div class="flex flex-column gap-2">
            <label for="confirmPassword" class="font-semibold text-sm text-color">Confirmar contraseña</label>
            <pv-password
              id="confirmPassword"
              v-model="confirmPassword"
              toggle-mask
              :feedback="false"
              class="w-full"
              input-class="w-full"
              placeholder="Repite la contraseña"
              @keydown.enter="handleSubmit"
            />
          </div>

          <pv-button
            type="submit"
            label="Guardar contraseña"
            icon="pi pi-check"
            class="w-full mt-2"
            :loading="iamStore.isLoading"
            :disabled="!hasToken || iamStore.isLoading"
          />

          <div class="text-center mt-2">
            <a @click.prevent="router.push(IAM_ROUTES.FORGOT_PASSWORD)" class="text-sm cursor-pointer link-primary no-underline">
              Solicitar nuevo enlace
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-container { max-width: 25rem; }
.bg-surface     { background-color: var(--color-white); }
.link-primary   { color: var(--color-primary); }
a.link-primary:hover { opacity: 0.8; }
.success-icon-circle {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: color-mix(in srgb, #22c55e 15%, transparent);
}
</style>
