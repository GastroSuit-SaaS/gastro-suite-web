<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
    email: { type: String, required: true },
    modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'resend'])

const errors = reactive({ code: false })

function onInput(event) {
    const digits = String(event.target?.value ?? '')
        .replace(/\D/g, '')
        .slice(0, 6)
    emit('update:modelValue', digits)
}

function validate() {
    const code = String(props.modelValue ?? '').trim()
    errors.code = !/^\d{6}$/.test(code)
    return !errors.code
}

defineExpose({ validate })
</script>

<template>
    <div>
        <div class="text-center mb-4">
            <h3 class="text-xl font-bold m-0 text-color">Verifica tu correo</h3>
            <p class="text-sm text-color-secondary m-0 mt-1">
                Enviamos un código de 6 dígitos a
                <span class="font-semibold text-primary">{{ email }}</span>
            </p>
        </div>

        <div class="flex flex-column gap-3">
            <div class="flex flex-column gap-1">
                <label class="font-semibold text-sm text-color">Código de verificación <span class="text-red-500">*</span></label>
                <pv-input-text
                    :model-value="modelValue"
                    placeholder="000000"
                    maxlength="6"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    class="w-full text-center text-2xl tracking-widest"
                    :invalid="errors.code"
                    @input="onInput"
                />
                <small v-if="errors.code" class="text-red-500">Ingresa el código de 6 dígitos</small>
                <small class="text-color-secondary">
                    Revisa tu bandeja de entrada y spam. El código expira en 15 minutos.
                </small>
            </div>

            <div class="text-center">
                <button
                    type="button"
                    class="text-sm text-primary font-semibold border-none bg-transparent cursor-pointer hover:underline p-0"
                    @click="emit('resend')"
                >
                    Reenviar código
                </button>
            </div>
        </div>
    </div>
</template>
