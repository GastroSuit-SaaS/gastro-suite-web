<script setup>
import { reactive, watch } from 'vue'
import { CASH_REGISTER_LABELS as L, MOVEMENT_CATEGORY_OPTIONS } from '../constants/cash-register.constants-ui.js'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'movement-saved'])

const form = reactive({
    type:        'income',
    amount:      0,
    category:    'otro',
    description: '',
})

watch(() => props.visible, (val) => {
    if (val) {
        form.type        = 'income'
        form.amount      = 0
        form.category    = 'otro'
        form.description = ''
    }
})

const canSave = () => form.amount > 0 && form.description.trim()

function onCancel() {
    emit('update:visible', false)
}

function onSave() {
    if (!canSave()) return
    emit('movement-saved', {
        type:        form.type,
        amount:      parseFloat(form.amount),
        category:    form.category,
        description: form.description.trim(),
    })
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="false"
        entity-name="Movimiento"
        custom-button-label="Registrar"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-4 pt-3">

                <!-- Tipo -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Tipo <span class="text-red-500">*</span>
                    </label>
                    <div class="flex gap-2">
                        <pv-button
                            label="Ingreso"
                            :outlined="form.type !== 'income'"
                            severity="success"
                            size="small"
                            class="flex-1"
                            @click="form.type = 'income'"
                        />
                        <pv-button
                            label="Egreso"
                            :outlined="form.type !== 'expense'"
                            severity="danger"
                            size="small"
                            class="flex-1"
                            @click="form.type = 'expense'"
                        />
                    </div>
                </div>

                <!-- Monto -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Monto (S/) <span class="text-red-500">*</span>
                    </label>
                    <pv-input-number
                        v-model="form.amount"
                        mode="currency" currency="PEN" locale="es-PE"
                        :min="0.01" :maxFractionDigits="2"
                        class="w-full"
                    />
                </div>

                <!-- Categoría -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Categoría
                    </label>
                    <pv-select
                        v-model="form.category"
                        :options="MOVEMENT_CATEGORY_OPTIONS"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    />
                </div>

                <!-- Descripción -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Descripción <span class="text-red-500">*</span>
                    </label>
                    <pv-textarea
                        v-model="form.description"
                        :rows="2"
                        class="w-full"
                        placeholder="Detalle del movimiento"
                        auto-resize
                    />
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>
