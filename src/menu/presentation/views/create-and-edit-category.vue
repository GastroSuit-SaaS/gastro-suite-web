<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

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
            <div class="flex flex-column gap-4 pt-3">

                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Nombre de la Categoría <span class="text-red-500">*</span>
                    </label>
                    <pv-input-text
                        v-model="form.name"
                        placeholder="Ej: Entradas, Platos Principales, Postres"
                    />
                </div>

                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">Descripción</label>
                    <pv-textarea
                        v-model="form.description"
                        placeholder="Opcional (mín. 5 caracteres si la envías)"
                        :rows="3"
                        auto-resize
                    />
                </div>

                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Orden de aparición <span class="text-red-500">*</span>
                    </label>
                    <pv-input-number
                        v-model="form.sortOrder"
                        :min="1"
                        :max="999"
                        :use-grouping="false"
                        class="w-full"
                    />
                    <span class="text-xs" style="color: #6b7280;">
                        Posición en desplegables, POS y listado (1 = primero). Si eliges un orden ya usado, las categorías intercambian posición.
                    </span>
                </div>

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

                <div class="flex align-items-center gap-3">
                    <pv-toggle-switch v-model="form.isActive" input-id="cat-active" />
                    <div class="flex flex-column gap-0">
                        <label for="cat-active" class="cursor-pointer text-sm font-medium" style="color: #374151;">
                            Categoría activa
                        </label>
                        <span class="text-xs" style="color: #6b7280;">
                            {{ form.isActive ? 'Visible en el menú del POS' : 'Oculta en el menú del POS' }}
                        </span>
                    </div>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
code {
    font-size: 0.7rem;
    color: #6b7280;
}
</style>
