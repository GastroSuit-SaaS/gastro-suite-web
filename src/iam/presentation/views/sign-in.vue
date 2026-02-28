<script setup> 
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useIamStore } from '../../application/iam.store.js';

const router   = useRouter();
const iamStore = useIamStore();

// Form state
const username  = ref('');
const password  = ref('');

// Methods
const handleLogin = async () => {
    await iamStore.login({ username: username.value, password: password.value });
    // TODO: handle iamStore.error before navigating
    router.push('/tables');
};

const goToForgotPassword = () => {
    router.push('/forgot-password');
};
</script>

<template>
  <div class="flex flex-column md:flex-row w-full min-h-screen">

    <!-- PANEL IZQUIERDO - Branding -->
    <div class="bg-gradient flex flex-column align-items-center justify-content-center gap-5 px-5 py-6 md:px-6 relative w-full md:w-6 md:h-screen">

      <!-- Texto principal -->
      <div class="flex flex-column align-items-center text-center gap-3 px-2 w-full">
        <h1 class="text-3xl md:text-5xl font-bold m-0 text-white line-height-2">
          Bienvenido a GastroSuite
        </h1>
        <p class="text-base md:text-xl m-0 text-white opacity-90 line-height-3">
          La solución integral para la gestión de tu restaurante
        </p>
      </div>

      <!-- Logo -->
      <div class="flex align-items-center justify-content-center">
        <div class="app-logo flex align-items-center justify-content-center">
          <i class="pi pi-shop app-logo-icon"></i>
        </div>
      </div>

      <!-- Footer: visible solo en desktop dentro del panel izquierdo -->
      <div class="hidden md:block absolute bottom-0 left-0 right-0 pb-3 text-center">
        <p class="text-sm text-white-alpha-70 m-0">
          &copy; {{ new Date().getFullYear() }} Metasoft Solutions. Todos los derechos reservados.
        </p>
      </div>
    </div>

    <!-- PANEL DERECHO - Formulario -->
    <div class="bg-surface flex align-items-center justify-content-center p-4 md:p-6 w-full md:w-6 md:h-screen">

      <div class="w-full form-container px-2 md:px-3">

        <!-- Header -->
        <div class="mb-4 text-center">
          <h2 class="text-4xl md:text-5xl font-bold mb-2 text-color">
            Iniciar Sesión
          </h2>
          <p class="text-sm m-0 text-color-secondary">
            Ingresa tus credenciales para acceder
          </p>
        </div>

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

          <!-- Contraseña -->
          <div class="flex flex-column gap-2">
            <label for="password" class="font-semibold text-sm text-color">Contraseña</label>
            <pv-password
              id="password"
              v-model="password"
              placeholder="Ingrese su contraseña"
              :feedback="false"
              toggle-mask
              size="large"
              class="w-full"
            />
          </div>

          <!-- Botón -->
          <pv-button
            type="submit"
            label="Iniciar Sesión"
            class="w-full mt-2"
            size="large"
            :disabled="!username || !password"
          />

          <!-- Olvidaste contraseña -->
          <div class="text-center mt-2">
            <a @click.prevent="goToForgotPassword" class="text-sm cursor-pointer link-primary no-underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <!-- Divider -->
          <pv-divider class="my-3">
            <span class="text-xs text-color-secondary">O</span>
          </pv-divider>

          <!-- Registro -->
          <div class="text-center">
            <span class="text-sm text-color-secondary">¿No tienes cuenta?</span>
            <a href="/sign-up" class="text-sm font-semibold ml-1 link-primary no-underline">
              Regístrate aquí
            </a>
          </div>

        </form>

        <!-- Footer: visible solo en móvil dentro del panel derecho -->
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
/* Contenedor del formulario — max-width sin equivalente PrimeFlex exacto */
.form-container { max-width: 25rem; }

/* Panel izquierdo — gradiente con tokens custom, no expresable en PrimeFlex */
.bg-gradient {
  position: relative;
  background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-primary) 100%);
}

.bg-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 20% 30%, rgba(26, 107, 194, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

/* Panel derecho — color custom */
.bg-surface { background-color: var(--color-white); }

/* Logo — clamp, backdrop-filter, box-shadow no tienen equivalente PrimeFlex */
.app-logo {
  width: clamp(7rem, 16vw, 10rem);
  height: clamp(7rem, 16vw, 10rem);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(8px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}
.app-logo-icon {
  font-size: clamp(3.2rem, 7vw, 4.5rem);
  color: var(--color-primary);
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
}

/* Links — color custom + hover pseudo-clase */
.link-primary { color: var(--color-primary); }
a.link-primary:hover { opacity: 0.8; }
</style>
