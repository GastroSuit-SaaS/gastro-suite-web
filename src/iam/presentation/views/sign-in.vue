<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useIamStore } from '../../application/iam.store.js';
import { IAM_ROUTES } from '../iam.routes.js';
import IamBranding from '../components/iam-branding.vue';

const router   = useRouter();
const iamStore = useIamStore();

const username = ref('');
const password = ref('');

async function handleLogin() {
    const ok = await iamStore.login({ username: username.value, password: password.value });
    if (ok) router.push('/dashboard');
}
</script>

<template>
  <div class="flex flex-column md:flex-row w-full min-h-screen">

    <!-- Panel izquierdo - Branding compartido -->
    <iam-branding />

    <!-- Panel derecho - Formulario -->
    <div class="bg-surface flex align-items-center justify-content-center p-4 md:p-6 w-full md:w-6 md:h-screen">

      <div class="w-full form-container px-2 md:px-3">

        <!-- Header -->
        <div class="mb-4 text-center">
          <h2 class="text-4xl md:text-5xl font-bold mb-2 text-color">Iniciar Sesion</h2>
          <p class="text-sm m-0 text-color-secondary">Ingresa tus credenciales para acceder</p>
        </div>

        <!-- Error del store -->
        <pv-message v-if="iamStore.error" severity="error" class="mb-3 w-full">
          {{ iamStore.error }}
        </pv-message>

        <!-- Formulario -->
        <form @submit.prevent="handleLogin" class="flex flex-column gap-3">

          <!-- Usuario -->
          <div class="flex flex-column gap-2">
            <label for="username" class="font-semibold text-sm text-color">Usuario</label>
            <pv-input-text
              id="username"
              v-model="username"
              placeholder="Ingrese su usuario"
              class="w-full"
              size="large"
            />
          </div>

          <!-- Contrasena -->
          <div class="flex flex-column gap-2">
            <label for="password" class="font-semibold text-sm text-color">Contrasena</label>
            <pv-password
              id="password"
              v-model="password"
              placeholder="Ingrese su contrasena"
              :feedback="false"
              toggle-mask
              size="large"
              class="w-full"
            />
          </div>

          <!-- Boton -->
          <pv-button
            type="submit"
            label="Iniciar Sesion"
            class="w-full mt-2"
            size="large"
            :loading="iamStore.isLoading"
            :disabled="!username || !password || iamStore.isLoading"
          />

          <!-- Olvidaste contrasena -->
          <div class="text-center mt-2">
            <a @click.prevent="router.push(IAM_ROUTES.FORGOT_PASSWORD)" class="text-sm cursor-pointer link-primary no-underline">
              Olvidaste tu contrasena?
            </a>
          </div>

          <!-- Divider -->
          <pv-divider class="my-3">
            <span class="text-xs text-color-secondary">O</span>
          </pv-divider>

          <!-- Registro -->
          <div class="text-center">
            <span class="text-sm text-color-secondary">No tienes cuenta?</span>
            <a @click.prevent="router.push(IAM_ROUTES.SIGN_UP)" class="text-sm font-semibold ml-1 link-primary no-underline cursor-pointer">
              Registrate aqui
            </a>
          </div>

        </form>

        <!-- Footer movil -->
        <div class="block md:hidden text-center pt-4">
          <p class="text-xs text-color-secondary m-0">
            &copy; {{ new Date().getFullYear() }} Metasoft Solutions. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.form-container { max-width: 25rem; }
.bg-surface     { background-color: var(--color-white); }
.link-primary   { color: var(--color-primary); }
a.link-primary:hover { opacity: 0.8; }
</style>
