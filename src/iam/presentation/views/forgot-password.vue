<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useIamStore } from '../../application/iam.store.js';
import { IAM_ROUTES } from '../iam.routes.js';
import IamBranding from '../components/iam-branding.vue';

const route    = useRoute();
const router   = useRouter();
const iamStore = useIamStore();

const currentStep = ref(1);
const identifier  = ref('');
const verificationCode = ref('');
const password  = ref('');
const confirmPassword = ref('');
const success   = ref(false);
const localError = ref('');

const notificationHint = computed(() => {
    if (identifier.value.includes('@')) {
        return identifier.value.trim();
    }
    return 'el correo vinculado a tu cuenta';
});

const stepSubtitle = computed(() => {
    if (currentStep.value === 1) {
        return 'Ingresa tu usuario o correo y te enviaremos un código de verificación';
    }
    if (currentStep.value === 2) {
        return 'Ingresa el código de 6 dígitos que enviamos a tu correo';
    }
    return 'Elige una contraseña segura para tu cuenta';
});

onMounted(() => {
    const emailFromQuery = String(route.query.email ?? '').trim();
    const stepFromQuery  = Number.parseInt(String(route.query.step ?? ''), 10);
    if (emailFromQuery) {
        identifier.value = emailFromQuery;
    }
    if (stepFromQuery >= 2 && stepFromQuery <= 3 && identifier.value) {
        currentStep.value = stepFromQuery;
    }
});

async function sendCode() {
    localError.value = '';
    iamStore.clearAuthError();
    if (!identifier.value.trim()) {
        localError.value = 'Ingresa tu usuario o correo.';
        return;
    }
    const ok = await iamStore.forgotPassword(identifier.value);
    if (ok) {
        verificationCode.value = '';
        password.value = '';
        confirmPassword.value = '';
        currentStep.value = 2;
    }
}

async function resendCode() {
    await sendCode();
}

async function verifyCode() {
    localError.value = '';
    iamStore.clearAuthError();

    if (!/^\d{6}$/.test(verificationCode.value.trim())) {
        localError.value = 'Ingresa el código de 6 dígitos.';
        return;
    }

    const ok = await iamStore.verifyPasswordResetCode(identifier.value, verificationCode.value);
    if (ok) {
        currentStep.value = 3;
    }
}

async function changePassword() {
    localError.value = '';
    iamStore.clearAuthError();

    if (password.value.length < 8) {
        localError.value = 'La contraseña debe tener al menos 8 caracteres.';
        return;
    }
    if (password.value !== confirmPassword.value) {
        localError.value = 'Las contraseñas no coinciden.';
        return;
    }

    const ok = await iamStore.resetPassword(identifier.value, password.value);
    if (ok) {
        success.value = true;
    }
}

function goBack() {
    localError.value = '';
    iamStore.clearAuthError();
    if (currentStep.value === 3) {
        currentStep.value = 2;
        password.value = '';
        confirmPassword.value = '';
        return;
    }
    if (currentStep.value === 2) {
        currentStep.value = 1;
        verificationCode.value = '';
    }
}
</script>

<template>
  <div class="flex flex-column md:flex-row w-full min-h-screen">

    <iam-branding />

    <div class="bg-surface flex align-items-center justify-content-center p-4 md:p-6 w-full md:w-6 md:h-screen">

      <div class="w-full form-container px-2 md:px-3">

        <div class="mb-4 text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-2 text-color">Recuperar Contraseña</h2>
          <p class="text-sm m-0 text-color-secondary">{{ stepSubtitle }}</p>
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

        <template v-else>
          <pv-message v-if="localError || iamStore.error" severity="error" class="w-full mb-3">
            {{ localError || iamStore.error }}
          </pv-message>

          <!-- Paso 1: identificador -->
          <form v-if="currentStep === 1" @submit.prevent="sendCode" class="flex flex-column gap-3">
            <div class="flex flex-column gap-2">
              <label for="identifier" class="font-semibold text-sm text-color">Usuario o correo</label>
              <pv-icon-field>
                <pv-input-icon class="pi pi-envelope" />
                <pv-input-text
                  id="identifier"
                  v-model="identifier"
                  placeholder="admin o correo@empresa.pe"
                  class="w-full"
                  size="large"
                />
              </pv-icon-field>
            </div>

            <pv-button
              type="submit"
              label="Enviar código"
              icon="pi pi-send"
              class="w-full mt-2"
              :loading="iamStore.isLoading"
              :disabled="!identifier || iamStore.isLoading"
            />

            <div class="text-center mt-2">
              <a @click.prevent="router.push(IAM_ROUTES.SIGN_IN)" class="text-sm cursor-pointer link-primary no-underline">
                Volver a iniciar sesion
              </a>
            </div>
          </form>

          <!-- Paso 2: verificar código -->
          <form v-else-if="currentStep === 2" @submit.prevent="verifyCode" class="flex flex-column gap-3">
            <pv-message severity="info" class="w-full">
              Enviamos un código de 6 dígitos a <strong>{{ notificationHint }}</strong>
            </pv-message>

            <div class="flex flex-column gap-2">
              <label for="code" class="font-semibold text-sm text-color">Código de verificación</label>
              <pv-input-text
                id="code"
                v-model="verificationCode"
                placeholder="000000"
                maxlength="6"
                inputmode="numeric"
                autocomplete="one-time-code"
                class="w-full text-center text-2xl tracking-widest"
              />
            </div>

            <div class="text-center">
              <button
                type="button"
                class="text-sm text-primary font-semibold border-none bg-transparent cursor-pointer hover:underline p-0"
                :disabled="iamStore.isLoading"
                @click="resendCode"
              >
                Reenviar código
              </button>
            </div>

            <div class="flex gap-3 mt-2">
              <pv-button
                type="button"
                label="Anterior"
                icon="pi pi-arrow-left"
                severity="secondary"
                outlined
                class="flex-1"
                :disabled="iamStore.isLoading"
                @click="goBack"
              />
              <pv-button
                type="submit"
                label="Verificar código"
                icon="pi pi-check"
                class="flex-1"
                :loading="iamStore.isLoading"
                :disabled="iamStore.isLoading"
              />
            </div>
          </form>

          <!-- Paso 3: nueva contraseña -->
          <form v-else @submit.prevent="changePassword" class="flex flex-column gap-3">
            <pv-message severity="success" class="w-full">
              Código verificado. Ahora puedes establecer tu nueva contraseña.
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
              />
            </div>

            <div class="flex gap-3 mt-2">
              <pv-button
                type="button"
                label="Anterior"
                icon="pi pi-arrow-left"
                severity="secondary"
                outlined
                class="flex-1"
                :disabled="iamStore.isLoading"
                @click="goBack"
              />
              <pv-button
                type="submit"
                label="Cambiar contraseña"
                icon="pi pi-check"
                class="flex-1"
                :loading="iamStore.isLoading"
                :disabled="iamStore.isLoading"
              />
            </div>
          </form>
        </template>

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
.success-icon-circle {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: color-mix(in srgb, #22c55e 15%, transparent);
}
</style>
