<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo y Header -->
      <div class="auth-header">
        <i class="pi pi-lock auth-logo"></i>
        <h1 class="auth-title">Recuperar Contraseña</h1>
        <p class="auth-subtitle">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
        </p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="auth-form" v-if="!emailSent">
        <!-- Email -->
        <div class="form-field">
          <label for="email" class="form-label">Correo Electrónico</label>
          <pv-input-text
            id="email"
            v-model="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            :class="{ 'p-invalid': error }"
            class="w-full"
            autocomplete="email"
          />
          <small v-if="error" class="text-error">{{ error }}</small>
        </div>

        <!-- Submit Button -->
        <pv-button
          type="submit"
          label="Enviar Instrucciones"
          :loading="isLoading"
          class="p-button-primary w-full"
          icon="pi pi-send"
        />

        <!-- Back to Login Link -->
        <div class="auth-footer">
          <p class="text-center text-secondary">
            <router-link to="/auth/sign-in" class="auth-link">
              <i class="pi pi-arrow-left mr-xs"></i>
              Volver al inicio de sesión
            </router-link>
          </p>
        </div>
      </form>

      <!-- Mensaje de confirmación -->
      <div v-else class="confirmation-message">
        <div class="confirmation-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        
        <h2 class="confirmation-title">¡Correo Enviado!</h2>
        
        <p class="confirmation-text">
          Hemos enviado las instrucciones para restablecer tu contraseña a:
        </p>
        
        <p class="confirmation-email">{{ email }}</p>
        
        <div class="confirmation-info">
          <i class="pi pi-info-circle mr-sm"></i>
          <span class="text-sm text-secondary">
            Si no recibes el correo en unos minutos, revisa tu carpeta de spam
          </span>
        </div>

        <!-- Resend Button -->
        <pv-button
          label="Reenviar correo"
          :loading="isResending"
          class="p-button-outlined w-full mt-lg"
          icon="pi pi-refresh"
          @click="handleResend"
          :disabled="resendCooldown > 0"
        >
          <template v-if="resendCooldown > 0">
            Reenviar en {{ resendCooldown }}s
          </template>
        </pv-button>

        <!-- Back to Login -->
        <div class="auth-footer">
          <p class="text-center">
            <router-link to="/auth/sign-in" class="auth-link">
              Volver al inicio de sesión
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();

// Estado del formulario
const email = ref('');
const error = ref('');
const isLoading = ref(false);
const emailSent = ref(false);

// Estado de reenvío
const isResending = ref(false);
const resendCooldown = ref(0);
let cooldownInterval = null;

// Validación de email
const validateEmail = () => {
  error.value = '';

  if (!email.value) {
    error.value = 'El correo electrónico es requerido';
    return false;
  }

  if (!/\S+@\S+\.\S+/.test(email.value)) {
    error.value = 'El correo electrónico no es válido';
    return false;
  }

  return true;
};

// Handler de envío
const handleSubmit = async () => {
  if (!validateEmail()) {
    return;
  }

  isLoading.value = true;

  try {
    // TODO: Implementar lógica de recuperación de contraseña con el store
    // Ejemplo:
    // await authStore.forgotPassword(email.value);
    
    // Simulación de llamada API
    await new Promise(resolve => setTimeout(resolve, 1500));

    emailSent.value = true;
    
    toast.add({
      severity: 'success',
      summary: 'Correo enviado',
      detail: 'Revisa tu bandeja de entrada',
      life: 3000
    });

  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al enviar correo',
      detail: err.message || 'No se pudo procesar la solicitud',
      life: 4000
    });
  } finally {
    isLoading.value = false;
  }
};

// Handler de reenvío
const handleResend = async () => {
  if (resendCooldown.value > 0) {
    return;
  }

  isResending.value = true;

  try {
    // TODO: Implementar lógica de reenvío
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.add({
      severity: 'success',
      summary: 'Correo reenviado',
      detail: 'Hemos enviado nuevamente las instrucciones',
      life: 3000
    });

    // Iniciar cooldown de 60 segundos
    startCooldown();

  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al reenviar',
      detail: err.message || 'No se pudo reenviar el correo',
      life: 4000
    });
  } finally {
    isResending.value = false;
  }
};

// Iniciar cooldown para reenvío
const startCooldown = () => {
  resendCooldown.value = 60;
  
  cooldownInterval = setInterval(() => {
    resendCooldown.value--;
    
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownInterval);
    }
  }, 1000);
};

// Limpiar intervalo al desmontar
watch(() => emailSent.value, (newValue) => {
  if (!newValue && cooldownInterval) {
    clearInterval(cooldownInterval);
  }
});
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
  max-width: 480px;
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
  color: var(--color-warning);
  margin-bottom: var(--spacing-md);
}

.auth-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.auth-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
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
  display: inline-flex;
  align-items: center;
}

.auth-link:hover {
  color: var(--color-info);
  text-decoration: underline;
}

/* Footer */
.auth-footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

/* Mensaje de Confirmación */
.confirmation-message {
  text-align: center;
}

.confirmation-icon {
  margin-bottom: var(--spacing-lg);
}

.confirmation-icon i {
  font-size: 4rem;
  color: var(--color-success);
}

.confirmation-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.confirmation-text {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.confirmation-email {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--bg-surface);
  border-radius: var(--radius-md);
  word-break: break-all;
}

.confirmation-info {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-lg);
}

.confirmation-info i {
  color: var(--color-info);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .auth-card {
    padding: var(--spacing-xl);
  }
  
  .auth-title {
    font-size: var(--font-size-xl);
  }

  .auth-subtitle {
    font-size: var(--font-size-xs);
  }

  .confirmation-icon i {
    font-size: 3rem;
  }

  .confirmation-title {
    font-size: var(--font-size-xl);
  }
}
</style>
