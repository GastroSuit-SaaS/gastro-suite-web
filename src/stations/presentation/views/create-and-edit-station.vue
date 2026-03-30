<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    edit:    { type: Boolean, default: false },
    station: { type: Object,  default: null  },
})

const emit = defineEmits(['update:visible', 'station-saved'])

const form = reactive({
    name:        '',
    description: '',
    color:       '3B82F6',
    isActive:    true,
})

watch(() => props.visible, (val) => {
    if (val) {
        form.name        = props.station?.name        ?? ''
        form.description = props.station?.description ?? ''
        form.color       = (props.station?.color ?? '#3B82F6').replace('#', '')
        form.isActive    = props.station?.isActive    ?? true
    }
})

const onCancel = () => emit('update:visible', false)

const onSave = () => {
    if (!form.name.trim()) return
    emit('station-saved', {
        name:        form.name,
        description: form.description,
        color:       '#' + form.color,
        isActive:    form.isActive,
    })
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="edit"
        entity-name="Estación"
        :custom-button-label="edit ? 'Actualizar Estación' : 'Crear Estación'"
        @update:visible="v => emit('update:visible', v)"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-4 pt-3">

                <!-- Nombre -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Nombre de la Estación <span class="text-red-500">*</span>
                    </label>
                    <pv-input-text
                        v-model="form.name"
                        placeholder="Ej: Cocina Caliente, Bar, Pastelería"
                    />
                </div>

                <!-- Descripción -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">Descripción</label>
                    <pv-textarea
                        v-model="form.description"
                        placeholder="Descripción opcional de la estación"
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

                <!-- Estación activa -->
                <div class="flex align-items-center gap-3">
                    <pv-toggle-switch v-model="form.isActive" input-id="station-active" />
                    <div class="flex flex-column gap-0">
                        <label for="station-active" class="cursor-pointer text-sm font-medium" style="color: #374151;">
                            Estación activa
                        </label>
                        <span class="text-xs" style="color: #6b7280;">
                            {{ form.isActive ? 'Recibe tickets desde el POS' : 'No recibe tickets nuevos' }}
                        </span>
                    </div>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
</style>