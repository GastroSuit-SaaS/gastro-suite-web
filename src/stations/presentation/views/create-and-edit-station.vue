<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import { STATION_ICON_OPTIONS } from '../constants/stations.constants-ui.js'

const props = defineProps({
    visible: { type: Boolean, default: false },
    edit:    { type: Boolean, default: false },
    station: { type: Object,  default: null  },
})

const emit = defineEmits(['update:visible', 'station-saved'])

const COLOR_PRESETS = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

const form = reactive({
    name:        '',
    description: '',
    color:       '#3b82f6',
    icon:        'pi-bolt',
    isActive:    true,
})

watch(() => props.visible, (val) => {
    if (val) {
        form.name        = props.station?.name        ?? ''
        form.description = props.station?.description ?? ''
        form.color       = props.station?.color       ?? '#3b82f6'
        form.icon        = props.station?.icon        ?? 'pi-bolt'
        form.isActive    = props.station?.isActive    ?? true
    }
})

const onCancel = () => emit('update:visible', false)

const onSave = () => {
    if (!form.name.trim()) return
    emit('station-saved', { ...form })
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :entity-name="'Estación'"
        :edit="edit"
        :custom-button-label="edit ? 'Actualizar Estación' : 'Crear Estación'"
        @update:visible="v => emit('update:visible', v)"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-3">

                <!-- Nombre -->
                <div class="flex flex-column gap-1">
                    <label class="text-sm font-medium text-color">Nombre <span class="text-red-500">*</span></label>
                    <pv-input-text v-model="form.name" placeholder="Ej: Cocina Caliente" />
                </div>

                <!-- Descripción -->
                <div class="flex flex-column gap-1">
                    <label class="text-sm font-medium text-color">Descripción</label>
                    <pv-textarea v-model="form.description" placeholder="Descripción de la estación..." rows="2" auto-resize />
                </div>

                <!-- Color -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium text-color">Color identificador</label>
                    <div class="flex align-items-center gap-2 flex-wrap">
                        <button
                            v-for="preset in COLOR_PRESETS"
                            :key="preset"
                            class="color-swatch"
                            :style="{ background: preset, outline: form.color === preset ? `3px solid ${preset}` : 'none', outlineOffset: '2px' }"
                            @click="form.color = preset"
                        />
                        <input type="color" v-model="form.color" class="color-picker-input" title="Color personalizado" />
                    </div>
                </div>

                <!-- Ícono -->
                <div class="flex flex-column gap-1">
                    <label class="text-sm font-medium text-color">Ícono</label>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="opt in STATION_ICON_OPTIONS"
                            :key="opt.value"
                            :class="['icon-btn-sel', form.icon === opt.value && 'icon-btn-sel--active']"
                            :title="opt.label"
                            @click="form.icon = opt.value"
                        >
                            <i :class="['pi', opt.value]"></i>
                        </button>
                    </div>
                </div>

                <!-- Estado -->
                <div class="flex align-items-center gap-2">
                    <pv-toggle-switch v-model="form.isActive" input-id="station-active" />
                    <label for="station-active" class="text-sm text-color cursor-pointer">Estación activa</label>
                </div>

                <!-- Preview -->
                <div class="station-preview" :style="{ borderLeft: `4px solid ${form.color}` }">
                    <div class="station-preview__icon" :style="{ background: form.color + '22' }">
                        <i :class="['pi', form.icon]" :style="{ color: form.color }"></i>
                    </div>
                    <div>
                        <div class="station-preview__name" :style="{ color: form.color }">{{ form.name || 'Vista previa' }}</div>
                        <div class="station-preview__desc">{{ form.description || 'Descripción de la estación' }}</div>
                    </div>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.color-swatch {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    border: 2px solid rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.1s;
}
.color-swatch:hover { transform: scale(1.15); }

.color-picker-input {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    border: 2px solid #e5e7eb;
    padding: 0;
    cursor: pointer;
    overflow: hidden;
}

.icon-btn-sel {
    width: 2.2rem;
    height: 2.2rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    color: #6b7280;
    transition: background 0.12s;
}
.icon-btn-sel--active {
    background: var(--p-primary-color, #6366f1);
    color: #fff;
    border-color: var(--p-primary-color, #6366f1);
}
.icon-btn-sel:not(.icon-btn-sel--active):hover { background: #f3f4f6; }

.station-preview {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin-top: 0.25rem;
}
.station-preview__icon {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    flex-shrink: 0;
}
.station-preview__name {
    font-size: 0.9rem;
    font-weight: 700;
}
.station-preview__desc {
    font-size: 0.75rem;
    color: #6b7280;
}
</style>
