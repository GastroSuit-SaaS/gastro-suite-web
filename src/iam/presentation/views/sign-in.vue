<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo y Header -->
      <div class="auth-header">
        <i class="pi pi-chart-bar auth-logo"></i>
        <h1 class="auth-title">Gastro Suite</h1>
        <p class="auth-subtitle">Inicia sesión en tu cuenta</p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSignIn" class="auth-form">
        <!-- Email -->
        <div class="form-field">
          <label for="email" class="form-label">Correo Electrónico</label>
          <pv-input-text
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="usuario@ejemplo.com"
            :class="{ 'p-invalid': errors.email }"
            class="w-full"
            autocomplete="email"
          />
          <small v-if="errors.email" class="text-error">{{ errors.email }}</small>
        </div>

        <!-- Password -->
        <div class="form-field">
          <div class="flex justify-content-between align-items-center mb-xs">
            <label for="password" class="form-label">Contraseña</label>
            <router-link to="/auth/forgot-password" class="auth-link text-sm">
              ¿Olvidaste tu contraseña?
            </router-link>
          </div>
          <pv-password
            id="password"
            v-model="formData.password"
            placeholder="••••••••"
            :class="{ 'p-invalid': errors.password }"
            :feedback="false"
            toggleMask
            class="w-full"
            inputClass="w-full"
            autocomplete="current-password"
          />
          <small v-if="errors.password" class="text-error">{{ errors.password }}</small>
        </div>

        <!-- Remember Me -->
        <div class="form-field">
          <div class="flex align-items-center">
            <pv-checkbox
              id="rememberMe"
              v-model="formData.rememberMe"
              :binary="true"
            />
            <label for="rememberMe" class="ml-sm cursor-pointer">
              Mantener sesión iniciada
            </label>
          </div>
        </div>

        <!-- Submit Button -->
        <pv-button
          type="submit"
          label="Iniciar Sesión"
          :loading="isLoading"
          class="p-button-primary w-full"
          icon="pi pi-sign-in"
        />

        <!-- Divider -->
        <div class="auth-divider">
          <span class="auth-divider-text">o</span>
        </div>

        <!-- Social Login (Opcional) -->
        <div class="social-login">
          <pv-button
            label="Continuar con Google"
            icon="pi pi-google"
            class="p-button-outlined w-full"
            @click="handleGoogleLogin"
          />
        </div>

        <!-- Sign Up Link -->
        <div class="auth-footer">
          <p class="text-center text-secondary">
            ¿No tienes una cuenta?
            <router-link to="/auth/sign-up" class="auth-link">
              Regístrate aquí
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();

// Estado del formulario
const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
});

// Errores de validación
const errors = reactive({
  email: '',
  password: ''
});

// Estado de carga
const isLoading = ref(false);

// Validación del formulario
const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.email = '';
  errors.password = '';

  // Validar email
  if (!formData.email) {
    errors.email = 'El correo electrónico es requerido';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'El correo electrónico no es válido';
    isValid = false;
  }

  // Validar password
  if (!formData.password) {
    errors.password = 'La contraseña es requerida';
    isValid = false;
  } else if (formData.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
    isValid = false;
  }

  return isValid;
};

// Handler de inicio de sesión
const handleSignIn = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;

  try {
    // TODO: Implementar lógica de autenticación con el store
    // Ejemplo:
    // await authStore.signIn(formData.email, formData.password, formData.rememberMe);
    
    // Simulación de llamada API
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.add({
      severity: 'success',
      summary: 'Inicio de sesión exitoso',
      detail: 'Bienvenido de vuelta',
      life: 3000
    });

    // Redirigir al dashboard
    router.push('/dashboard');

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error de autenticación',
      detail: error.message || 'Credenciales inválidas',
      life: 4000
    });
  } finally {
    isLoading.value = false;
  }
};

// Handler de login con Google
const handleGoogleLogin = () => {
  toast.add({
    severity: 'info',
    summary: 'Función no implementada',
    detail: 'El inicio de sesión con Google estará disponible próximamente',
    life: 3000
  });
};
</script>

<style scoped>
/* Container Principal */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  padding: var(--spacing-lg);
}

/* Card de Autenticación */
.auth-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-xl);
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.auth-logo {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.auth-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.auth-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Formulario */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

/* Links */
.auth-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
}

.auth-link:hover {
  color: var(--color-info);
  text-decoration: underline;
}

/* Divider */
.auth-divider {
  position: relative;
  text-align: center;
  margin: var(--spacing-md) 0;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--border-color);
}

.auth-divider-text {
  position: relative;
  display: inline-block;
  padding: 0 var(--spacing-md);
  background-color: var(--bg-card);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

/* Social Login */
.social-login {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* Footer */
.auth-footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

/* Responsive */
@media (max-width: 640px) {
  .auth-card {
    padding: var(--spacing-xl);
  }
  
  .auth-title {
    font-size: var(--font-size-2xl);
  }
}
</style>
