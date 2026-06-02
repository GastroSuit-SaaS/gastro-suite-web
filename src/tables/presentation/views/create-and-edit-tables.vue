<script setup>
import { reactive, computed, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import { Table, TABLE_STATUS } from '../../domain/models/table.entity.js'

const props = defineProps({
    visible:        { type: Boolean, default: false },
    edit:           { type: Boolean, default: false },
    table:          { type: Object,  default: null  },
    zones:          { type: Array,   default: () => [] },
    existingTables: { type: Array,   default: () => [] },
})

const emit = defineEmits(['update:visible', 'table-saved'])

const SHAPES = [
    { label: 'Cuadrada',    value: 'square'    },
    { label: 'Redonda',     value: 'round'     },
    { label: 'Rectangular', value: 'rectangle' },
]

const form = reactive({
    zoneId:   null,
    number:   '',
    capacity: 4,
    shape:    'square',
    status:   TABLE_STATUS.AVAILABLE,
})

// Repopulate (edit) or reset (create) every time the dialog opens
watch(() => props.visible, (val) => {
    if (val) {
        form.zoneId   = props.table?.zoneId   ?? null
        form.number   = props.table?.number != null ? String(props.table.number) : ''
        form.capacity = props.table?.capacity ?? 4
        form.shape    = props.table?.shape    ?? 'square'
        form.status   = props.table?.status   ?? TABLE_STATUS.AVAILABLE
    }
})

const zoneOptions = computed(() =>
    props.zones.map(z => ({ label: z.name, value: z.id }))
)

const onCancel = () => emit('update:visible', false)

const normalizedNumber = computed(() => String(form.number ?? '').trim())

const isDuplicate = computed(() => {
    const id = normalizedNumber.value
    if (!id) return false
    return props.existingTables.some(t =>
        t.zoneId === form.zoneId &&
        String(t.number ?? '').trim() === id &&
        t.id     !== props.table?.id
    )
})

const onSave = () => {
    const id = normalizedNumber.value
    if (!form.zoneId || !id || !form.capacity) return
    if (isDuplicate.value) return
    const table = new Table({ ...form, number: id })
    emit('table-saved', table)
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="edit"
        entity-name="Mesa"
        :custom-button-label="edit ? 'Actualizar Mesa' : 'Crear Mesa'"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-4 pt-3">

                <!-- Zona -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Zona <span class="text-red-500">*</span>
                    </label>
                    <pv-select
                        v-model="form.zoneId"
                        :options="zoneOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Selecciona una zona"
                        class="w-full"
                    />
                </div>

                <!-- Identificador de Mesa -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Identificador de Mesa <span class="text-red-500">*</span>
                    </label>
                    <pv-input-text
                        v-model="form.number"
                        :invalid="isDuplicate"
                        maxlength="50"
                        placeholder="Ej. 1, A1, Terraza-3"
                        class="w-full"
                    />
                    <small v-if="isDuplicate" class="text-red-500">
                        Ya existe una mesa con ese identificador en esta zona.
                    </small>
                </div>

                <!-- Número de Asientos -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Número de Asientos <span class="text-red-500">*</span>
                    </label>
                    <pv-input-number
                        v-model="form.capacity"
                        :min="1"
                        :use-grouping="false"
                        placeholder="4"
                        class="w-full"
                    />
                </div>

                <!-- Forma de la Mesa -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">Forma de la Mesa</label>
                    <div class="flex gap-2">
                        <button
                            v-for="shape in SHAPES"
                            :key="shape.value"
                            :class="['shape-btn border-1 border-round-lg px-3 py-2 cursor-pointer text-sm font-medium flex-1',
                                     form.shape === shape.value ? 'shape-btn--active' : 'shape-btn--inactive']"
                            type="button"
                            @click="form.shape = shape.value"
                        >
                            {{ shape.label }}
                        </button>
                    </div>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.shape-btn {
    background: transparent;
    transition: background 0.15s ease, color 0.15s ease;
}

.shape-btn--active {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
}

.shape-btn--inactive {
    color: var(--text-secondary);
    border-color: var(--border-color);
}

.shape-btn--inactive:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}
</style>