<script setup>
/**
 * Campos reutilizables para entidades con nombre, descripción, color e indicador activo.
 * Usar dentro de create-and-edit.vue (patrón menu).
 */
defineProps({
    model: { type: Object, required: true },
    nameLabel: { type: String, default: 'Nombre' },
    namePlaceholder: { type: String, default: '' },
    descriptionPlaceholder: { type: String, default: 'Descripción opcional' },
    showSortOrder: { type: Boolean, default: false },
    sortOrderHint: { type: String, default: '' },
    activeInputId: { type: String, default: 'entity-active' },
    activeLabel: { type: String, default: 'Activo' },
    activeHintOn: { type: String, default: '' },
    activeHintOff: { type: String, default: '' },
    activeLayout: {
        type: String,
        default: 'inline',
        validator: (value) => ['inline', 'card'].includes(value),
    },
})
</script>

<template>
    <div class="flex flex-column gap-4 pt-3">

        <div class="flex flex-column gap-2">
            <label class="cef-label">
                {{ nameLabel }} <span class="text-red-500">*</span>
            </label>
            <pv-input-text
                v-model="model.name"
                :placeholder="namePlaceholder"
                class="w-full"
            />
        </div>

        <div class="flex flex-column gap-2">
            <label class="cef-label">Descripción</label>
            <pv-textarea
                v-model="model.description"
                :placeholder="descriptionPlaceholder"
                :rows="3"
                auto-resize
                class="w-full"
            />
        </div>

        <div v-if="showSortOrder" class="flex flex-column gap-2">
            <label class="cef-label">
                Orden de aparición <span class="text-red-500">*</span>
            </label>
            <pv-input-number
                v-model="model.sortOrder"
                :min="1"
                :max="999"
                :use-grouping="false"
                class="w-full"
            />
            <span v-if="sortOrderHint" class="cef-hint">{{ sortOrderHint }}</span>
        </div>

        <div class="flex flex-column gap-2">
            <label class="cef-label">Color identificador</label>
            <div class="flex align-items-center gap-2">
                <pv-color-picker v-model="model.color" format="hex" append-to="body" />
                <pv-input-text
                    :value="'#' + String(model.color ?? '').replace(/^#/, '').toUpperCase()"
                    class="flex-1"
                    @input="model.color = $event.target.value.replace('#', '')"
                />
            </div>
        </div>

        <div
            v-if="activeLayout === 'card'"
            class="flex align-items-center justify-content-between p-3 border-round-lg"
            style="background: var(--surface-ground);"
        >
            <div class="flex flex-column gap-1">
                <span class="cef-label">{{ activeLabel }}</span>
                <span v-if="activeHintOn || activeHintOff" class="cef-hint">
                    {{ model.isActive ? activeHintOn : activeHintOff }}
                </span>
            </div>
            <pv-input-switch v-model="model.isActive" :input-id="activeInputId" />
        </div>

        <div v-else class="flex align-items-center gap-3">
            <pv-input-switch v-model="model.isActive" :input-id="activeInputId" />
            <div class="flex flex-column gap-0">
                <label :for="activeInputId" class="cef-label cursor-pointer">
                    {{ activeLabel }}
                </label>
                <span v-if="activeHintOn || activeHintOff" class="cef-hint">
                    {{ model.isActive ? activeHintOn : activeHintOff }}
                </span>
            </div>
        </div>

    </div>
</template>

<style scoped>
.cef-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.cef-hint {
    font-size: 0.75rem;
    color: #6b7280;
}
</style>
