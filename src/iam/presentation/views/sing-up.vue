<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo y Header -->
      <div class="auth-header">
        <i class="pi pi-chart-bar auth-logo"></i>
        <h1 class="auth-title">Crear Cuenta</h1>
        <p class="auth-subtitle">Regístrate en Gastro Suite</p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSignUp" class="auth-form">
        <!-- Nombre Completo -->
        <div class="form-field">
          <label for="fullName" class="form-label">Nombre Completo</label>
          <pv-input-text
            id="fullName"
            v-model="formData.fullName"
            placeholder="Juan Pérez"
            :class="{ 'p-invalid': errors.fullName }"
            class="w-full"
            autocomplete="name"
          />
          <small v-if="errors.fullName" class="text-error">{{ errors.fullName }}</small>
        </div>

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

        <!-- Teléfono (Opcional) -->
        <div class="form-field">
          <label for="phone" class="form-label">
            Teléfono
            <span class="text-muted text-xs">(opcional)</span>
          </label>
          <pv-input-text
            id="phone"
            v-model="formData.phone"
            placeholder="+51 999 999 999"
            class="w-full"
            autocomplete="tel"
          />
        </div>

        <!-- Password -->
        <div class="form-field">
          <label for="password" class="form-label">Contraseña</label>
          <pv-password
            id="password"
            v-model="formData.password"
            placeholder="••••••••"
            :class="{ 'p-invalid': errors.password }"
            toggleMask
            class="w-full"
            inputClass="w-full"
            autocomplete="new-password"
          >
            <template #header>
              <h6 class="m-0">Elige una contraseña</h6>
            </template>
            <template #footer>
              <pv-divider />
              <p class="text-sm text-secondary m-0">Sugerencias:</p>
              <ul class="text-xs text-secondary pl-lg mt-xs">
                <li>Al menos 8 caracteres</li>
                <li>Una letra mayúscula</li>
                <li>Un número o símbolo</li>
              </ul>
            </template>
          </pv-password>
          <small v-if="errors.password" class="text-error">{{ errors.password }}</small>
        </div>

        <!-- Confirm Password -->
        <div class="form-field">
          <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
          <pv-password
            id="confirmPassword"
            v-model="formData.confirmPassword"
            placeholder="••••••••"
            :class="{ 'p-invalid': errors.confirmPassword }"
            :feedback="false"
            toggleMask
            class="w-full"
            inputClass="w-full"
            autocomplete="new-password"
          />
          <small v-if="errors.confirmPassword" class="text-error">{{ errors.confirmPassword }}</small>
        </div>

        <!-- Términos y Condiciones -->
        <div class="form-field">
          <div class="flex align-items-start">
            <pv-checkbox
              id="acceptTerms"
              v-model="formData.acceptTerms"
              :binary="true"
              :class="{ 'p-invalid': errors.acceptTerms }"
            />
            <label for="acceptTerms" class="ml-sm cursor-pointer text-sm">
              Acepto los
              <a href="#" class="auth-link" @click.prevent="showTerms">Términos y Condiciones</a>
              y la
              <a href="#" class="auth-link" @click.prevent="showPrivacy">Política de Privacidad</a>
            </label>
          </div>
          <small v-if="errors.acceptTerms" class="text-error ml-xl">{{ errors.acceptTerms }}</small>
        </div>

        <!-- Submit Button -->
        <pv-button
          type="submit"
          label="Crear Cuenta"
          :loading="isLoading"
          class="p-button-primary w-full"
          icon="pi pi-user-plus"
        />

        <!-- Divider -->
        <div class="auth-divider">
          <span class="auth-divider-text">o</span>
        </div>

        <!-- Social Login (Opcional) -->
        <div class="social-login">
          <pv-button
            label="Registrarse con Google"
            icon="pi pi-google"
            class="p-button-outlined w-full"
            @click="handleGoogleSignUp"
          />
        </div>

        <!-- Sign In Link -->
        <div class="auth-footer">
          <p class="text-center text-secondary">
            ¿Ya tienes una cuenta?
            <router-link to="/auth/sign-in" class="auth-link">
              Inicia sesión aquí
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
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
});

// Errores de validación
const errors = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: ''
});

// Estado de carga
const isLoading = ref(false);

// Validación del formulario
const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.fullName = '';
  errors.email = '';
  errors.password = '';
  errors.confirmPassword = '';
  errors.acceptTerms = '';

  // Validar nombre completo
  if (!formData.fullName) {
    errors.fullName = 'El nombre completo es requerido';
    isValid = false;
  } else if (formData.fullName.length < 3) {
    errors.fullName = 'El nombre debe tener al menos 3 caracteres';
    isValid = false;
  }

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
  } else if (formData.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres';
    isValid = false;
  } else if (!/[A-Z]/.test(formData.password)) {
    errors.password = 'La contraseña debe contener al menos una mayúscula';
    isValid = false;
  } else if (!/[0-9]/.test(formData.password)) {
    errors.password = 'La contraseña debe contener al menos un número';
    isValid = false;
  }

  // Validar confirmación de password
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Debes confirmar la contraseña';
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
    isValid = false;
  }

  // Validar términos y condiciones
  if (!formData.acceptTerms) {
    errors.acceptTerms = 'Debes aceptar los términos y condiciones';
    isValid = false;
  }

  return isValid;
};

// Handler de registro
const handleSignUp = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;

  try {
    // TODO: Implementar lógica de registro con el store
    // Ejemplo:
    // await authStore.signUp({
    //   fullName: formData.fullName,
    //   email: formData.email,
    //   phone: formData.phone,
    //   password: formData.password
    // });
    
    // Simulación de llamada API
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.add({
      severity: 'success',
      summary: 'Cuenta creada exitosamente',
      detail: 'Por favor verifica tu correo electrónico',
      life: 4000
    });

    // Redirigir al login o dashboard
    router.push('/auth/sign-in');

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error al crear la cuenta',
      detail: error.message || 'No se pudo completar el registro',
      life: 4000
    });
  } finally {
    isLoading.value = false;
  }
};

// Handler de registro con Google
const handleGoogleSignUp = () => {
  toast.add({
    severity: 'info',
    summary: 'Función no implementada',
    detail: 'El registro con Google estará disponible próximamente',
    life: 3000
  });
};

// Mostrar términos y condiciones
const showTerms = () => {
  toast.add({
    severity: 'info',
    summary: 'Términos y Condiciones',
    detail: 'Función para mostrar términos pendiente de implementación',
    life: 3000
  });
};

// Mostrar política de privacidad
const showPrivacy = () => {
  toast.add({
    severity: 'info',
    summary: 'Política de Privacidad',
    detail: 'Función para mostrar política pendiente de implementación',
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
