<script setup>
import { reactive, watch } from 'vue'
import { CASH_REGISTER_LABELS as L, SHIFT_NAME_OPTIONS } from '../constants/cash-register.constants-ui.js'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'session-opened'])

const form = reactive({
    shiftName:     'Mañana',
    initialAmount: 200,
    notes:         '',
})

watch(() => props.visible, (val) => {
    if (val) {
        form.shiftName     = 'Mañana'
        form.initialAmount = 200
        form.notes         = ''
    }
})

function onCancel() {
    emit('update:visible', false)
}

function onSave() {
    if (!form.initialAmount || form.initialAmount < 0 || !form.shiftName) return
    emit('session-opened', {
        shiftName:     form.shiftName,
        initialAmount: parseFloat(form.initialAmount),
        notes:         form.notes,
    })
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="false"
        entity-name="Turno"
        custom-button-label="Abrir Turno"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-4 pt-3">

                <!-- Nombre del Turno -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        {{ L.SHIFT_NAME }} <span class="text-red-500">*</span>
                    </label>
                    <pv-select
                        v-model="form.shiftName"
                        :options="SHIFT_NAME_OPTIONS"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                        placeholder="Selecciona el turno"
                    />
                </div>

                <!-- Monto Inicial -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        {{ L.INITIAL_AMOUNT }} (S/) <span class="text-red-500">*</span>
                    </label>
                    <pv-input-number
                        v-model="form.initialAmount"
                        mode="currency" currency="PEN" locale="es-PE"
                        :min="0" :maxFractionDigits="2"
                        class="w-full"
                    />
                </div>

                <!-- Notas -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Notas (opcional)
                    </label>
                    <pv-textarea
                        v-model="form.notes"
                        :rows="2"
                        class="w-full"
                        placeholder="Ej: Apertura con fondo estándar"
                        auto-resize
                    />
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>
