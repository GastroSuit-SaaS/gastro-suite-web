<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import ColoredEntityFormFields from '../../../shared/presentation/components/colored-entity-form-fields.vue'

const props = defineProps({
    visible:         { type: Boolean, default: false },
    edit:            { type: Boolean, default: false },
    category:        { type: Object,  default: null  },
    defaultSortOrder: { type: Number, default: 1 },
})

const emit = defineEmits(['update:visible', 'category-saved'])

const form = reactive({
    name:        '',
    description: '',
    color:       '3B82F6',
    isActive:    true,
    sortOrder:   1,
})

watch(() => props.visible, (val) => {
    if (val) {
        form.name        = props.category?.name        ?? ''
        form.description = props.category?.description ?? ''
        form.color       = (props.category?.color ?? '#3B82F6').replace('#', '')
        form.isActive    = props.category?.isActive    ?? true
        const order = Number(props.category?.sortOrder)
        form.sortOrder   = order > 0 ? order : props.defaultSortOrder
    }
})

const onCancel = () => emit('update:visible', false)

const onSave = () => {
    const name = form.name.trim()
    if (name.length < 3) return
    const sortOrder = Number(form.sortOrder)
    if (!Number.isFinite(sortOrder) || sortOrder < 1) return
    emit('category-saved', {
        name,
        description: form.description.trim(),
        color: '#' + form.color.replace(/^#/, ''),
        isActive: form.isActive,
        sortOrder,
    })
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="edit"
        entity-name="Categoría"
        :custom-button-label="edit ? 'Actualizar Categoría' : 'Crear Categoría'"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <ColoredEntityFormFields
                :model="form"
                name-label="Nombre de la Categoría"
                name-placeholder="Ej: Entradas, Platos Principales, Postres"
                description-placeholder="Opcional (mín. 5 caracteres si la envías)"
                show-sort-order
                sort-order-hint="Posición en desplegables, POS y listado (1 = primero). Si eliges un orden ya usado, las categorías intercambian posición."
                active-input-id="cat-active"
                active-label="Categoría activa"
                active-hint-on="Visible en el menú del POS"
                active-hint-off="Oculta en el menú del POS"
            />
        </template>
    </CreateAndEdit>
</template>
