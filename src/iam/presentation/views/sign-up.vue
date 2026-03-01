<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SignUpBranding        from '../components/sign-up-branding.vue'
import SignUpStepper         from '../components/sign-up-stepper.vue'
import SignUpStepEmpresa     from '../components/sign-up-step-empresa.vue'
import SignUpStepSucursal    from '../components/sign-up-step-sucursal.vue'
import SignUpStepUsuario     from '../components/sign-up-step-usuario.vue'
import SignUpStepFinalizado  from '../components/sign-up-step-finalizado.vue'

const router = useRouter()

// ── Stepper ───────────────────────────────────────────────
const currentStep = ref(1)
const STEPS = [
    { number: 1, label: 'Empresa'    },
    { number: 2, label: 'Sucursal'   },
    { number: 3, label: 'Usuario'    },
    { number: 4, label: 'Finalizado' },
]

// ── Template refs para cada step component ────────────────
const stepEmpresa  = ref()
const stepSucursal = ref()
const stepUsuario  = ref()

// ── Navegación ────────────────────────────────────────────
async function nextStep() {
    const stepRefs = [stepEmpresa, stepSucursal, stepUsuario]
    const currentRef = stepRefs[currentStep.value - 1]
    if (currentRef?.value && !currentRef.value.validate()) return
    currentStep.value++
}

function prevStep() {
    if (currentStep.value > 1) currentStep.value--
}

// ── Resumen para el step final ────────────────────────────
const summary = computed(() => ({
    empresa:  stepEmpresa.value?.data  ?? {},
    sucursal: stepSucursal.value?.data ?? {},
    usuario:  stepUsuario.value?.data  ?? {},
}))

const summaryEmpresaNombre  = computed(() => summary.value.empresa.nombreComercial  ?? '')
const summarySucursalNombre = computed(() => summary.value.sucursal.nombre          ?? '')
const summaryUsuarioNombre  = computed(() => {
    const u = summary.value.usuario
    return [u.nombres, u.apellidos].filter(Boolean).join(' ')
})
</script>

<template>
    <div class="flex flex-column md:flex-row w-full min-h-screen">

        <!-- Panel izquierdo — Branding -->
        <sign-up-branding />

        <!-- Panel derecho — Formulario multi-paso -->
        <div class="bg-surface flex flex-column align-items-center justify-content-start p-4 md:p-6 w-full md:w-6 md:h-screen overflow-y-auto">

            <div class="w-full form-container px-2 md:px-3">

                <!-- Header -->
                <div class="mb-5 text-center">
                    <h2 class="text-3xl md:text-4xl font-bold mb-1 text-color">Crear Cuenta</h2>
                    <p class="text-sm m-0 text-color-secondary">Registra tu restaurante en GastroSuite</p>
                </div>

                <!-- Stepper indicador -->
                <sign-up-stepper :steps="STEPS" :current-step="currentStep" />

                <!-- Contenido del paso actual -->
                <div class="mb-4">
                    <sign-up-step-empresa
                        v-if="currentStep === 1"
                        ref="stepEmpresa"
                    />
                    <sign-up-step-sucursal
                        v-if="currentStep === 2"
                        ref="stepSucursal"
                    />
                    <sign-up-step-usuario
                        v-if="currentStep === 3"
                        ref="stepUsuario"
                        :sucursal-nombre="summarySucursalNombre || 'la sucursal creada en el paso anterior'"
                    />
                    <sign-up-step-finalizado
                        v-if="currentStep === 4"
                        :empresa-nombre="summaryEmpresaNombre"
                        :sucursal-nombre="summarySucursalNombre"
                        :usuario-nombre="summaryUsuarioNombre"
                    />
                </div>

                <!-- Navegación (oculta en el step final) -->
                <div v-if="currentStep < STEPS.length" class="flex gap-3 mt-4">
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
                        :label="currentStep < STEPS.length - 1 ? 'Siguiente' : 'Finalizar'"
                        :icon="currentStep < STEPS.length - 1 ? 'pi pi-arrow-right' : 'pi pi-check'"
                        icon-pos="right"
                        class="flex-1"
                        @click="nextStep"
                    />
                </div>

                <!-- Ir a iniciar sesión -->
                <div v-if="currentStep < STEPS.length" class="text-center mt-4">
                    <p class="text-sm text-color-secondary m-0">
                        ¿Ya tienes una cuenta?
                        <a class="text-primary font-semibold cursor-pointer hover:underline" @click="router.push('/sign-in')">
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
</style>
