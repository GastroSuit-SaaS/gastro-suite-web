<script setup>
/**
 * SignUpStepper — Indicador de progreso genérico para formularios multi-paso.
 *
 * Props:
 *   steps       — Array<{ number: number, label: string }>
 *   currentStep — number: paso activo (1-based)
 */
defineProps({
    steps:       { type: Array,  required: true },
    currentStep: { type: Number, required: true },
})
</script>

<template>
    <div class="flex align-items-center justify-content-center mb-5">
        <template v-for="(step, idx) in steps" :key="step.number">
            <!-- Nodo -->
            <div class="flex flex-column align-items-center gap-1">
                <div
                    :class="[
                        'step-circle flex align-items-center justify-content-center',
                        currentStep === step.number ? 'step-circle--active'    : '',
                        currentStep  >  step.number ? 'step-circle--completed' : '',
                        currentStep  <  step.number ? 'step-circle--pending'   : '',
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
            <div
                v-if="idx < steps.length - 1"
                class="step-line mx-2"
                :class="currentStep > step.number ? 'step-line--done' : ''"
            ></div>
        </template>
    </div>
</template>

<style scoped>
.step-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-weight: 700;
    font-size: 0.875rem;
    transition: background-color 0.2s, border-color 0.2s;
}
.step-circle--active    { background-color: var(--color-primary, #3b82f6); color: #fff; }
.step-circle--completed { background-color: var(--color-primary, #3b82f6); color: #fff; }
.step-circle--pending   { background-color: #e5e7eb; color: #9ca3af; }
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
.step-line--done { background-color: var(--color-primary, #3b82f6); }
</style>
