<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import ColoredEntityFormFields from '../../../shared/presentation/components/colored-entity-form-fields.vue'

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
    const name = form.name.trim()
    if (!name) return
    emit('station-saved', {
        name,
        description: form.description.trim(),
        color:       '#' + form.color.replace(/^#/, ''),
        isActive:    form.isActive,
    })
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="edit"
        entity-name="Estación"
        :custom-button-label="edit ? 'Actualizar Estación' : 'Crear Estación'"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <ColoredEntityFormFields
                :model="form"
                name-label="Nombre de la Estación"
                name-placeholder="Ej: Cocina Caliente, Bar, Pastelería"
                description-placeholder="Descripción opcional de la estación"
                active-input-id="station-active"
                active-label="Estación activa"
                active-hint-on="Recibe tickets desde el POS"
                active-hint-off="No recibe tickets nuevos"
            />
        </template>
    </CreateAndEdit>
</template>
