<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── Stepper ───────────────────────────────────────────────
const currentStep = ref(1)
const STEPS = [
    { number: 1, label: 'Empresa'    },
    { number: 2, label: 'Sucursal'   },
    { number: 3, label: 'Usuario'    },
    { number: 4, label: 'Finalizado' },
]

// ── Restaurant types ──────────────────────────────────────
// ── Step 1 — Empresa ──────────────────────────────────────
const empresa = reactive({
    ruc:             '',
    razonSocial:     '',
    nombreComercial: '',
    email:           '',
    telefono:        '',
    password:        '',
    confirmPassword: '',
})

const errors = reactive({
    ruc:             false,
    razonSocial:     false,
    nombreComercial: false,
    email:           false,
    telefono:        false,
    password:        false,
    confirmPassword: false,
})

const step1Valid = computed(() =>
    empresa.ruc.trim().length === 11 &&
    empresa.razonSocial.trim() &&
    empresa.nombreComercial.trim() &&
    empresa.email.trim() &&
    empresa.telefono.trim() &&
    empresa.password.length >= 8 &&
    empresa.password === empresa.confirmPassword
)

function validateStep1() {
    errors.ruc             = empresa.ruc.trim().length !== 11
    errors.razonSocial     = !empresa.razonSocial.trim()
    errors.nombreComercial = !empresa.nombreComercial.trim()
    errors.email           = !empresa.email.trim()
    errors.telefono        = !empresa.telefono.trim()
    errors.password        = empresa.password.length < 8
    errors.confirmPassword = empresa.password !== empresa.confirmPassword
    return Object.values(errors).every(v => !v)
}

function nextStep() {
    if (currentStep.value === 1 && !validateStep1()) return
    if (currentStep.value < STEPS.length) currentStep.value++
}

function goToSignIn() {
    router.push('/sign-in')
}
</script>

<template>
    <div class="flex flex-column md:flex-row w-full min-h-screen">

        <!-- PANEL IZQUIERDO — Branding (idéntico a sign-in) -->
        <div class="bg-gradient flex flex-column align-items-center justify-content-center gap-5 px-5 py-6 md:px-6 relative w-full md:w-6 md:h-screen">
            <div class="flex flex-column align-items-center text-center gap-3 px-2 w-full">
                <h1 class="text-3xl md:text-5xl font-bold m-0 text-white line-height-2">
                    Bienvenido a GastroSuite
                </h1>
                <p class="text-base md:text-xl m-0 text-white opacity-90 line-height-3">
                    La solución integral para la gestión de tu restaurante
                </p>
            </div>
            <div class="flex align-items-center justify-content-center">
                <div class="app-logo flex align-items-center justify-content-center">
                    <i class="pi pi-shop app-logo-icon"></i>
                </div>
            </div>
            <div class="hidden md:block absolute bottom-0 left-0 right-0 pb-3 text-center">
                <p class="text-sm text-white-alpha-70 m-0">
                    &copy; {{ new Date().getFullYear() }} Metasoft Solutions. Todos los derechos reservados.
                </p>
            </div>
        </div>

        <!-- PANEL DERECHO — Formulario multi-paso -->
        <div class="bg-surface flex flex-column align-items-center justify-content-start p-4 md:p-6 w-full md:w-6 md:h-screen overflow-y-auto">

            <div class="w-full form-container px-2 md:px-3">

                <!-- Header -->
                <div class="mb-5 text-center">
                    <h2 class="text-3xl md:text-4xl font-bold mb-1 text-color">Crear Cuenta</h2>
                    <p class="text-sm m-0 text-color-secondary">Registra tu restaurante en GastroSuite</p>
                </div>

                <!-- Stepper -->
                <div class="flex align-items-center justify-content-center mb-5">
                    <template v-for="(step, idx) in STEPS" :key="step.number">
                        <!-- Nodo -->
                        <div class="flex flex-column align-items-center gap-1">
                            <div
                                :class="[
                                    'step-circle flex align-items-center justify-content-center',
                                    currentStep === step.number  ? 'step-circle--active'    : '',
                                    currentStep  >  step.number  ? 'step-circle--completed'  : '',
                                    currentStep  <  step.number  ? 'step-circle--pending'    : '',
                                ]"
                            >
                                <i v-if="currentStep > step.number" class="pi pi-check text-white" style="font-size: 0.75rem;"></i>
                                <span v-else class="step-number">{{ step.number }}</span>
                            </div>
                            <span
                                :class="[
                                    'step-label text-xs',
                                    currentStep === step.number ? 'text-primary font-semibold' : 'text-color-secondary',
                                ]"
                            >{{ step.label }}</span>
                        </div>
                        <!-- Línea entre nodos -->
                        <div v-if="idx < STEPS.length - 1" class="step-line mx-2" :class="currentStep > step.number ? 'step-line--done' : ''"></div>
                    </template>
                </div>

                <!-- ── STEP 1: Empresa ──────────────────────────────────── -->
                <div v-if="currentStep === 1">
                    <div class="text-center mb-4">
                        <h3 class="text-xl font-bold m-0 text-color">Datos de la Empresa</h3>
                        <p class="text-sm text-color-secondary m-0 mt-1">Información general de tu restaurante</p>
                    </div>

                    <div class="flex flex-column gap-3">

                        <!-- RUC -->
                        <div class="flex flex-column gap-1">
                            <label class="font-semibold text-sm text-color">RUC <span class="text-red-500">*</span></label>
                            <pv-input-text
                                v-model="empresa.ruc"
                                placeholder="20123456789"
                                :invalid="errors.ruc"
                                class="w-full"
                                maxlength="11"
                                @input="empresa.ruc = empresa.ruc.replace(/\D/g, '')"
                            />
                            <small v-if="errors.ruc" class="text-red-500">El RUC debe tener 11 dígitos</small>
                        </div>

                        <!-- Razón Social -->
                        <div class="flex flex-column gap-1">
                            <label class="font-semibold text-sm text-color">Razón Social <span class="text-red-500">*</span></label>
                            <pv-input-text
                                v-model="empresa.razonSocial"
                                placeholder="RESTAURANTE EL SABOR PERUANO S.A.C."
                                :invalid="errors.razonSocial"
                                class="w-full"
                            />
                            <small v-if="errors.razonSocial" class="text-red-500">La razón social es requerida</small>
                        </div>

                        <!-- Nombre Comercial -->
                        <div class="flex flex-column gap-1">
                            <label class="font-semibold text-sm text-color">Nombre Comercial <span class="text-red-500">*</span></label>
                            <pv-input-text
                                v-model="empresa.nombreComercial"
                                placeholder="El Sabor Peruano"
                                :invalid="errors.nombreComercial"
                                class="w-full"
                            />
                            <small v-if="errors.nombreComercial" class="text-red-500">El nombre comercial es requerido</small>
                        </div>

                        <!-- Email + Teléfono -->
                        <div class="flex gap-3">
                            <div class="flex flex-column gap-1 flex-1">
                                <label class="font-semibold text-sm text-color">Email Corporativo <span class="text-red-500">*</span></label>
                                <div class="input-icon-wrapper">
                                    <i class="pi pi-envelope input-icon-wrapper__icon"></i>
                                    <pv-input-text
                                        v-model="empresa.email"
                                        placeholder="contacto@empresa.pe"
                                        type="email"
                                        :invalid="errors.email"
                                        class="w-full input-icon-wrapper__input"
                                    />
                                </div>
                                <small v-if="errors.email" class="text-red-500">El email es requerido</small>
                            </div>
                            <div class="flex flex-column gap-1 flex-1">
                                <label class="font-semibold text-sm text-color">Teléfono <span class="text-red-500">*</span></label>
                                <div class="input-icon-wrapper">
                                    <i class="pi pi-phone input-icon-wrapper__icon"></i>
                                    <pv-input-text
                                        v-model="empresa.telefono"
                                        placeholder="+51 987 654 321"
                                        :invalid="errors.telefono"
                                        class="w-full input-icon-wrapper__input"
                                    />
                                </div>
                                <small v-if="errors.telefono" class="text-red-500">El teléfono es requerido</small>
                            </div>
                        </div>

                        <!-- Contraseña -->
                        <div class="flex flex-column gap-1">
                            <label class="font-semibold text-sm text-color">Contraseña <span class="text-red-500">*</span></label>
                            <pv-password
                                v-model="empresa.password"
                                placeholder="Mínimo 8 caracteres"
                                toggle-mask
                                :invalid="errors.password"
                                class="w-full"
                                prompt-label="Ingresa una contraseña"
                                weak-label="Débil"
                                medium-label="Media"
                                strong-label="Fuerte"
                            />
                            <small v-if="errors.password" class="text-red-500">La contraseña debe tener al menos 8 caracteres</small>
                        </div>

                        <!-- Confirmar Contraseña -->
                        <div class="flex flex-column gap-1">
                            <label class="font-semibold text-sm text-color">Confirmar Contraseña <span class="text-red-500">*</span></label>
                            <pv-password
                                v-model="empresa.confirmPassword"
                                placeholder="Repite tu contraseña"
                                toggle-mask
                                :feedback="false"
                                :invalid="errors.confirmPassword"
                                class="w-full"
                            />
                            <small v-if="errors.confirmPassword" class="text-red-500">Las contraseñas no coinciden</small>
                        </div>

                    </div>
                </div>

                <!-- ── STEP 2–4: Próximamente ───────────────────────────── -->
                <div v-else class="flex flex-column align-items-center justify-content-center gap-3 py-6">
                    <i class="pi pi-wrench text-color-secondary" style="font-size: 2.5rem;"></i>
                    <span class="text-color-secondary text-sm">Paso {{ currentStep }} — próximamente</span>
                </div>

                <!-- Navegación -->
                <div class="flex align-items-center justify-content-between mt-5 gap-2">
                    <pv-button
                        v-if="currentStep > 1"
                        label="Anterior"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        outlined
                        @click="currentStep--"
                    />
                    <span v-else></span>

                    <pv-button
                        v-if="currentStep < STEPS.length"
                        label="Continuar"
                        icon="pi pi-arrow-right"
                        icon-pos="right"
                        @click="nextStep"
                    />
                </div>

                <!-- Link a sign-in -->
                <div class="text-center mt-4">
                    <span class="text-sm text-color-secondary">¿Ya tienes cuenta?</span>
                    <a @click.prevent="goToSignIn" href="/sign-in" class="text-sm font-semibold ml-1 link-primary no-underline">
                        Inicia sesión aquí
                    </a>
                </div>

                <!-- Footer móvil -->
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
/* Layout */
.form-container { max-width: 32rem; margin: 0 auto; }

/* Panel izquierdo — idéntico a sign-in */
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
.bg-surface { background-color: var(--color-white); }

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
.link-primary { color: var(--color-primary); }
a.link-primary:hover { opacity: 0.8; }

/* .input-icon-wrapper, __icon, __input → definidos globalmente en assets/styles/utilities.css */

/* ── Stepper ─────────────────────────────────────────────── */
.step-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-weight: 700;
    font-size: 0.875rem;
    transition: background-color 0.2s, border-color 0.2s;
}
.step-circle--active {
    background-color: var(--color-primary, #3b82f6);
    color: #fff;
}
.step-circle--completed {
    background-color: var(--color-primary, #3b82f6);
    color: #fff;
}
.step-circle--pending {
    background-color: #e5e7eb;
    color: #9ca3af;
}
.step-number { line-height: 1; }
.step-label  { white-space: nowrap; }

.step-line {
    flex: 1;
    height: 2px;
    min-width: 32px;
    background-color: #e5e7eb;
    border-radius: 2px;
    transition: background-color 0.3s;
}
.step-line--done {
    background-color: var(--color-primary, #3b82f6);
}
</style>
