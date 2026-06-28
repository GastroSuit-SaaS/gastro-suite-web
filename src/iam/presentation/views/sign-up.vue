<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useIamStore } from '../../application/iam.store.js'
import { IAM_ROUTES } from '../iam.routes.js'
import { SIGN_UP_STEPS } from '../constants/iam.constants-ui.js'
import { EmpresaRegistration } from '../../domain/models/empresa-registration.vo.js'
import { UsuarioRegistration } from '../../domain/models/usuario-registration.vo.js'
import {
    loadSignUpDraft,
    saveSignUpDraft,
    clearSignUpDraft,
} from '../../infrastructure/sign-up-draft.js'
import IamBranding               from '../components/iam-branding.vue'
import SignUpStepper             from '../components/sign-up-stepper.vue'
import SignUpStepEmpresa         from '../components/sign-up-step-empresa.vue'
import SignUpStepUsuario         from '../components/sign-up-step-usuario.vue'
import SignUpStepVerificarEmail  from '../components/sign-up-step-verificar-email.vue'
import SignUpStepFinalizado      from '../components/sign-up-step-finalizado.vue'

const router   = useRouter()
const iamStore = useIamStore()

const savedDraft = loadSignUpDraft()

/** Estado compartido con los inputs — hidratado antes del primer render. */
const formEmpresa = reactive(new EmpresaRegistration(savedDraft?.empresa ?? {}))
const formUsuario = reactive(new UsuarioRegistration(savedDraft?.usuario ?? {}))
const verificationCode = ref(savedDraft?.verificationCode ?? '')

const currentStep = ref(
    savedDraft?.currentStep >= 1 && savedDraft?.currentStep <= SIGN_UP_STEPS.length - 1
        ? savedDraft.currentStep
        : 1,
)

const stepEmpresa = ref()
const stepUsuario = ref()
const stepVerificar = ref()

function snapshotEmpresa(data) {
    return {
        ruc: data.ruc?.trim() ?? '',
        razonSocial: data.razonSocial?.trim() ?? '',
        nombreComercial: data.nombreComercial?.trim() ?? '',
        direccion: data.direccion?.trim() ?? '',
    }
}

function snapshotUsuario(data) {
    return {
        nombres: data.nombres?.trim() ?? '',
        apellidos: data.apellidos?.trim() ?? '',
        username: data.username?.trim() ?? '',
        tipoDocumento: data.tipoDocumento ?? '',
        numeroDocumento: data.numeroDocumento?.trim() ?? '',
        email: data.email?.trim() ?? '',
        telefono: data.telefono?.trim() ?? '',
        password: data.password ?? '',
        confirmPassword: data.confirmPassword ?? '',
    }
}

function persistDraft() {
    saveSignUpDraft({
        currentStep: currentStep.value,
        empresa: snapshotEmpresa(formEmpresa),
        usuario: snapshotUsuario(formUsuario),
        verificationCode: verificationCode.value,
    })
}

onMounted(() => {
    window.addEventListener('beforeunload', persistDraft)
})

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', persistDraft)
    if (currentStep.value < SIGN_UP_STEPS.length) {
        persistDraft()
    }
})

async function sendVerificationCode() {
    iamStore.clearAuthError()
    const email = snapshotUsuario(formUsuario).email
    if (!email) {
        iamStore.error = 'Ingresa un correo válido en el paso anterior.'
        return false
    }
    return iamStore.sendRegistrationVerificationCode(email)
}

async function resendVerificationCode() {
    await sendVerificationCode()
}

async function nextStep() {
    if (currentStep.value === 1) {
        if (stepEmpresa.value && !stepEmpresa.value.validate()) return
    }

    if (currentStep.value === 2) {
        if (stepUsuario.value && !stepUsuario.value.validate()) return
        persistDraft()
        const sent = await sendVerificationCode()
        if (!sent) return
    }

    if (currentStep.value === 3) {
        if (stepVerificar.value && !stepVerificar.value.validate()) return
        persistDraft()
        iamStore.clearAuthError()
        const ok = await iamStore.register({
            empresa: snapshotEmpresa(formEmpresa),
            usuario: snapshotUsuario(formUsuario),
            emailVerificationCode: verificationCode.value,
        })
        if (!ok) return
        clearSignUpDraft()
    } else {
        persistDraft()
    }

    currentStep.value++
    if (currentStep.value < SIGN_UP_STEPS.length) {
        persistDraft()
    }
}

function prevStep() {
    if (currentStep.value <= 1) return
    persistDraft()
    currentStep.value--
}

const summaryEmpresaNombre = computed(() => formEmpresa.nombreComercial ?? '')
const summaryUsuarioNombre = computed(() =>
    [formUsuario.nombres, formUsuario.apellidos].filter(Boolean).join(' '),
)

const nextButtonLabel = computed(() => {
    if (currentStep.value === 2) return 'Enviar código'
    if (currentStep.value === 3) return 'Verificar y registrar'
    return 'Siguiente'
})

const nextButtonIcon = computed(() => {
    if (currentStep.value === 3) return 'pi pi-check'
    if (currentStep.value === 2) return 'pi pi-envelope'
    return 'pi pi-arrow-right'
})
</script>

<template>
    <div class="flex flex-column md:flex-row w-full min-h-screen">

        <iam-branding />

        <div class="bg-surface flex flex-column align-items-center justify-content-start p-4 md:p-6 w-full md:w-6 md:h-screen overflow-y-auto">

            <div class="w-full form-container px-2 md:px-3">

                <div class="mb-5 text-center">
                    <h2 class="text-3xl md:text-4xl font-bold mb-1 text-color">Crear Cuenta</h2>
                    <p class="text-sm m-0 text-color-secondary">Registra tu restaurante en GastroSuite</p>
                </div>

                <sign-up-stepper :steps="SIGN_UP_STEPS" :current-step="currentStep" />

                <div v-if="iamStore.error && currentStep < SIGN_UP_STEPS.length" class="register-error mb-3">
                    <i class="pi pi-exclamation-circle"></i>
                    <span>{{ iamStore.error }}</span>
                </div>

                <div class="mb-4">
                    <div v-show="currentStep === 1">
                        <sign-up-step-empresa ref="stepEmpresa" :form="formEmpresa" />
                    </div>
                    <div v-show="currentStep === 2">
                        <sign-up-step-usuario ref="stepUsuario" :form="formUsuario" />
                    </div>
                    <div v-show="currentStep === 3">
                        <sign-up-step-verificar-email
                            ref="stepVerificar"
                            v-model="verificationCode"
                            :email="formUsuario.email"
                            @resend="resendVerificationCode"
                        />
                    </div>
                    <sign-up-step-finalizado
                        v-if="currentStep === 4"
                        :empresa-nombre="summaryEmpresaNombre"
                        :usuario-nombre="summaryUsuarioNombre"
                    />
                </div>

                <div v-if="currentStep < SIGN_UP_STEPS.length" class="flex gap-3 mt-4">
                    <pv-button
                        v-if="currentStep > 1"
                        label="Anterior"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        outlined
                        class="flex-1"
                        :disabled="iamStore.isLoading"
                        @click="prevStep"
                    />
                    <pv-button
                        :label="nextButtonLabel"
                        :icon="nextButtonIcon"
                        icon-pos="right"
                        class="flex-1"
                        :loading="iamStore.isLoading"
                        :disabled="iamStore.isLoading"
                        @click="nextStep"
                    />
                </div>

                <div v-if="currentStep < SIGN_UP_STEPS.length" class="text-center mt-4">
                    <p class="text-sm text-color-secondary m-0">
                        ¿Ya tienes una cuenta?
                        <a class="text-primary font-semibold cursor-pointer hover:underline" @click="router.push(IAM_ROUTES.SIGN_IN)">
                            Inicia sesión
                        </a>
                    </p>
                </div>

                <div class="text-center pt-4 pb-2">
                    <p class="text-xs text-color-secondary m-0">
                        &copy; {{ new Date().getFullYear() }} Metasoft Solutions. Todos los derechos reservados.
                    </p>
                </div>

            </div>
        </div>

    </div>
</template>

<style scoped>
.form-container { max-width: 32rem; margin: 0 auto; }
.bg-surface { background-color: var(--color-white); }

.register-error {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.85rem 1rem;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-left: 4px solid #ef4444;
    border-radius: 8px;
    color: #991b1b;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
}
.register-error .pi { color: #dc2626; flex-shrink: 0; margin-top: 1px; }
</style>
