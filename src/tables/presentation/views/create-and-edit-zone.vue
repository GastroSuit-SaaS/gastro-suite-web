<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    edit:    { type: Boolean, default: false },
    zone:    { type: Object,  default: null  },
})

const emit = defineEmits(['update:visible', 'zone-saved'])

const form = reactive({
    name:        '',
    description: '',
    color:       '3B82F6',
})

// Reset form each time the dialog opens
watch(() => props.visible, (val) => {
    if (val) {
        form.name        = props.zone?.name        ?? ''
        form.description = props.zone?.description ?? ''
        form.color       = (props.zone?.color ?? '#3B82F6').replace('#', '')
    }
})

const onCancel = () => emit('update:visible', false)

const onSave = () => {
    if (!form.name.trim()) return
    emit('zone-saved', { name: form.name, description: form.description, color: '#' + form.color })
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="edit"
        entity-name="Zona"
        :custom-button-label="edit ? 'Actualizar Zona' : 'Crear Zona'"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-4 pt-3">

                <!-- Nombre de la Zona -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Nombre de la Zona <span class="text-red-500">*</span>
                    </label>
                    <pv-input-text
                        v-model="form.name"
                        placeholder="Ej: Salón Principal, Terraza, VIP"
                    />
                </div>

                <!-- Descripción -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">Descripción</label>
                    <pv-textarea
                        v-model="form.description"
                        placeholder="Descripción opcional de la zona"
                        :rows="3"
                        auto-resize
                    />
                </div>

                <!-- Color Identificador -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">Color Identificador</label>
                    <div class="flex align-items-center gap-2">
                        <pv-color-picker v-model="form.color" format="hex" append-to="body" />
                        <pv-input-text
                            :value="'#' + form.color.toUpperCase()"
                            class="flex-1"
                            @input="form.color = $event.target.value.replace('#', '')"
                        />
                    </div>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
</style>