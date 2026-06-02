<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIamStore } from '../../application/iam.store.js'
import { IAM_ROUTES } from '../iam.routes.js'
import { SIGN_UP_STEPS } from '../constants/iam.constants-ui.js'
import IamBranding          from '../components/iam-branding.vue'
import SignUpStepper        from '../components/sign-up-stepper.vue'
import SignUpStepEmpresa    from '../components/sign-up-step-empresa.vue'
import SignUpStepUsuario    from '../components/sign-up-step-usuario.vue'
import SignUpStepFinalizado from '../components/sign-up-step-finalizado.vue'

const router   = useRouter()
const iamStore = useIamStore()

// ── Stepper ───────────────────────────────────────────────
const currentStep = ref(1)

// ── Template refs para cada step component ────────────────
const stepEmpresa  = ref()
const stepUsuario  = ref()

/** Snapshot del wizard: el paso 1 se desmonta con v-if al ir al paso 2. */
const draftEmpresa = ref(null)
const draftUsuario = ref(null)

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

// ── Navegación ────────────────────────────────────────────
async function nextStep() {
    const stepRefs = [stepEmpresa, stepUsuario]
    const currentRef = stepRefs[currentStep.value - 1]
    if (currentRef?.value && !currentRef.value.validate()) return

    if (currentStep.value === 1 && stepEmpresa.value?.data) {
        draftEmpresa.value = snapshotEmpresa(stepEmpresa.value.data)
    }

    // Paso 2 → 3: registrar (empresa ya guardada en draftEmpresa)
    if (currentStep.value === SIGN_UP_STEPS.length - 1) {
        iamStore.clearAuthError()
        if (stepUsuario.value?.data) {
            draftUsuario.value = snapshotUsuario(stepUsuario.value.data)
        }
        const ok = await iamStore.register({
            empresa: draftEmpresa.value,
            usuario: draftUsuario.value,
        })
        if (!ok) return
    }

    currentStep.value++
}

function prevStep() {
    if (currentStep.value > 1) currentStep.value--
}

// ── Resumen para el step final ────────────────────────────
const summary = computed(() => ({
    empresa: draftEmpresa.value ?? {},
    usuario: draftUsuario.value ?? {},
}))

const summaryEmpresaNombre = computed(() => summary.value.empresa.nombreComercial ?? '')
const summaryUsuarioNombre = computed(() => {
    const u = summary.value.usuario
    return [u.nombres, u.apellidos].filter(Boolean).join(' ')
})
</script>

<template>
    <div class="flex flex-column md:flex-row w-full min-h-screen">

        <!-- Panel izquierdo — Branding -->
        <iam-branding />

        <!-- Panel derecho — Formulario multi-paso -->
        <div class="bg-surface flex flex-column align-items-center justify-content-start p-4 md:p-6 w-full md:w-6 md:h-screen overflow-y-auto">

            <div class="w-full form-container px-2 md:px-3">

                <!-- Header -->
                <div class="mb-5 text-center">
                    <h2 class="text-3xl md:text-4xl font-bold mb-1 text-color">Crear Cuenta</h2>
                    <p class="text-sm m-0 text-color-secondary">Registra tu restaurante en GastroSuite</p>
                </div>

                <!-- Stepper indicador -->
                <sign-up-stepper :steps="SIGN_UP_STEPS" :current-step="currentStep" />

                <div v-if="iamStore.error && currentStep < SIGN_UP_STEPS.length" class="register-error mb-3">
                    <i class="pi pi-exclamation-circle"></i>
                    <span>{{ iamStore.error }}</span>
                </div>

                <!-- Contenido del paso actual -->
                <div class="mb-4">
                    <sign-up-step-empresa
                        v-if="currentStep === 1"
                        ref="stepEmpresa"
                    />
                    <sign-up-step-usuario
                        v-if="currentStep === 2"
                        ref="stepUsuario"
                    />
                    <sign-up-step-finalizado
                        v-if="currentStep === 3"
                        :empresa-nombre="summaryEmpresaNombre"
                        :usuario-nombre="summaryUsuarioNombre"
                    />
                </div>

                <!-- Navegación (oculta en el step final) -->
                <div v-if="currentStep < SIGN_UP_STEPS.length" class="flex gap-3 mt-4">
                    <pv-button
                        v-if="currentStep > 1"
                        label="Anterior"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        outlined
                        class="flex-1"
                        @click="prevStep"
                    />
                    <pv-button
                        :label="currentStep < SIGN_UP_STEPS.length - 1 ? 'Siguiente' : 'Finalizar Registro'"
                        :icon="currentStep < SIGN_UP_STEPS.length - 1 ? 'pi pi-arrow-right' : 'pi pi-check'"
                        icon-pos="right"
                        class="flex-1"
                        :loading="iamStore.isLoading"
                        :disabled="iamStore.isLoading"
                        @click="nextStep"
                    />
                </div>

                <!-- Ir a iniciar sesión -->
                <div v-if="currentStep < SIGN_UP_STEPS.length" class="text-center mt-4">
                    <p class="text-sm text-color-secondary m-0">
                        ¿Ya tienes una cuenta?
                        <a class="text-primary font-semibold cursor-pointer hover:underline" @click="router.push(IAM_ROUTES.SIGN_IN)">
                            Inicia sesión
                        </a>
                    </p>
                </div>

                <!-- Footer -->
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
