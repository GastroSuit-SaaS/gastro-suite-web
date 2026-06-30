<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import ColoredEntityFormFields from '../../../shared/presentation/components/colored-entity-form-fields.vue'

const props = defineProps({
    visible:  { type: Boolean, default: false },
    edit:     { type: Boolean, default: false },
    category: { type: Object,  default: null  },
})

const emit = defineEmits(['update:visible', 'category-saved'])

const form = reactive({
    name:        '',
    description: '',
    color:       '3B82F6',
    isActive:    true,
})

watch(() => props.visible, (val) => {
    if (val) {
        form.name        = props.category?.name        ?? ''
        form.description = props.category?.description ?? ''
        form.color       = (props.category?.color ?? '#3B82F6').replace('#', '')
        form.isActive    = props.category?.isActive    ?? true
    }
})

const onCancel = () => emit('update:visible', false)

const onSave = () => {
    const name = form.name.trim()
    if (!name) return
    emit('category-saved', {
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
        entity-name="Categoría de Inventario"
        :custom-button-label="edit ? 'Actualizar Categoría' : 'Crear Categoría'"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <ColoredEntityFormFields
                :model="form"
                name-label="Nombre de la Categoría"
                name-placeholder="Ej: Carnes, Lácteos, Bebidas"
                description-placeholder="Descripción opcional de la categoría"
                active-input-id="inv-cat-active"
                active-label="Categoría activa"
                active-hint-on="Visible en filtros de inventario"
                active-hint-off="Oculta en filtros de inventario"
            />
        </template>
    </CreateAndEdit>
</template>
