<script setup>
import { ref, computed, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    table:   { type: Object,  default: null  },
})

const emit = defineEmits(['update:visible', 'assigned'])

const guests = ref(1)

watch(() => props.visible, (val) => {
    if (val) guests.value = 1
})

const maxGuests = computed(() => props.table?.capacity ?? 1)

function onCancel() {
    emit('update:visible', false)
}

function onConfirm() {
    if (!guests.value || guests.value < 1) return
    emit('assigned', { guests: guests.value })
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        entity-name="Mesa"
        custom-button-label="Asignar y Tomar Orden"
        @canceled-shared="onCancel"
        @saved-shared="onConfirm"
    >
        <template #content>
            <div v-if="table" class="flex flex-column gap-4 pt-3">

                <!-- Info de la mesa -->
                <div class="flex flex-column gap-1 p-3 border-round-lg" style="background: var(--surface-ground);">
                    <span class="text-xs text-color-secondary uppercase font-medium" style="letter-spacing: 0.05em;">Mesa seleccionada</span>
                    <span class="font-bold text-xl text-color">Mesa {{ table.number }}</span>
                    <span class="text-sm text-color-secondary">
                        <i class="pi pi-map-marker mr-1"></i>{{ table.zone ?? 'Sin zona' }}
                        &nbsp;·&nbsp;
                        <i class="pi pi-users mr-1"></i>Capacidad: {{ table.capacity }} personas
                    </span>
                </div>

                <!-- Número de personas -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        ¿Cuántas personas? <span class="text-red-500">*</span>
                    </label>
                    <pv-input-number
                        v-model="guests"
                        :min="1"
                        :max="maxGuests"
                        :use-grouping="false"
                        show-buttons
                        button-layout="horizontal"
                        :input-style="{ textAlign: 'center', width: '100%' }"
                        class="w-full"
                        increment-button-icon="pi pi-plus"
                        decrement-button-icon="pi pi-minus"
                    />
                    <span class="text-xs text-color-secondary">Máximo {{ maxGuests }} personas según la capacidad de la mesa</span>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>
