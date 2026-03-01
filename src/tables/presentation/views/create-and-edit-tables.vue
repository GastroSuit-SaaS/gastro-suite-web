<script setup>
import { reactive, computed } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import { Table, TABLE_STATUS } from '../../domain/models/table.entity.js'

const props = defineProps({
    visible: { type: Boolean, default: false },
    edit:    { type: Boolean, default: false },
    table:   { type: Object,  default: null  },
    zones:   { type: Array,   default: () => [] },
})

const emit = defineEmits(['update:visible', 'table-saved'])

const SHAPES = [
    { label: 'Cuadrada',    value: 'square'    },
    { label: 'Redonda',     value: 'round'     },
    { label: 'Rectangular', value: 'rectangle' },
]

const form = reactive({
    zoneId:   props.table?.zoneId   ?? null,
    number:   props.table?.number   ?? null,
    capacity: props.table?.capacity ?? 4,
    shape:    props.table?.shape    ?? 'square',
    status:   props.table?.status   ?? TABLE_STATUS.AVAILABLE,
})

const zoneOptions = computed(() =>
    props.zones.map(z => ({ label: z.name, value: z.id }))
)

const onCancel = () => emit('update:visible', false)

const onSave = () => {
    if (!form.zoneId || !form.number || !form.capacity) return
    const table = new Table({ ...form })
    emit('table-saved', table)
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="edit"
        entity-name="Mesa"
        custom-button-label="Crear Mesa"
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

                <!-- Número de Mesa -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Número de Mesa <span class="text-red-500">*</span>
                    </label>
                    <pv-input-number
                        v-model="form.number"
                        :min="1"
                        :use-grouping="false"
                        placeholder="1"
                        class="w-full"
                    />
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