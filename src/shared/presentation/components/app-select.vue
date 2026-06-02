<script setup>
/**
 * Wrapper de PrimeVue Select: el panel se monta en body y queda por encima de modales.
 * Evita que el overlay (z-index) quede detrás de .p-dialog-mask / .p-dialog.
 */
import Select from 'primevue/select'
import { OVERLAY_APPEND_TARGET } from '../constants/overlay.constants-ui.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
    appendTo: {
        type: [String, Object],
        default: OVERLAY_APPEND_TARGET,
    },
})
</script>

<template>
    <Select v-bind="$attrs" :append-to="appendTo">
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </Select>
</template>
