<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import ColoredEntityFormFields from '../../../shared/presentation/components/colored-entity-form-fields.vue'

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
    isActive:    true,
})

watch(() => props.visible, (val) => {
    if (val) {
        form.name        = props.zone?.name        ?? ''
        form.description = props.zone?.description ?? ''
        form.color       = (props.zone?.color ?? '#3B82F6').replace('#', '')
        form.isActive    = props.zone?.isActive    ?? true
    }
})

const onCancel = () => emit('update:visible', false)

const onSave = () => {
    const name = form.name.trim()
    if (!name) return
    emit('zone-saved', {
        name,
        description: form.description.trim(),
        color: '#' + form.color.replace(/^#/, ''),
        isActive: form.isActive,
    })
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
            <ColoredEntityFormFields
                :model="form"
                name-label="Nombre de la Zona"
                name-placeholder="Ej: Salón Principal, Terraza, VIP"
                description-placeholder="Descripción opcional de la zona"
                active-layout="card"
                active-input-id="zone-active"
                active-label="Zona activa"
                active-hint-on="Visible en el plano del salón"
                active-hint-off="Oculta en el plano del salón"
            />
        </template>
    </CreateAndEdit>
</template>
