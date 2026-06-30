<script setup>
import { computed, inject } from 'vue'
import { MODULE_TAB_BAR_KEY } from '../composables/use-module-tabs.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
    /**
     * Id de esta pestaña; con v-model en module-tab-bar se marca activa automáticamente.
     */
    value: {
        type: [String, Number],
        default: undefined,
    },
    /** Modo manual cuando el padre no usa v-model en la barra */
    active: {
        type: Boolean,
        default: false,
    },
    icon: {
        type: String,
        default: '',
    },
    /** default | focus — focus = acción, no cambia la pestaña activa */
    variant: {
        type: String,
        default: 'default',
        validator: (v) => ['default', 'focus'].includes(v),
    },
    disabled: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['click'])

const tabBar = inject(MODULE_TAB_BAR_KEY, null)

const isActive = computed(() => {
    if (props.variant === 'focus') return false
    if (tabBar && props.value !== undefined && props.value !== null) {
        return tabBar.activeValue.value === props.value
    }
    return props.active
})

function onClick(event) {
    if (props.disabled) return

    if (props.variant !== 'focus' && tabBar && props.value !== undefined && props.value !== null) {
        tabBar.selectTab(props.value)
    }

    emit('click', event)
}
</script>

<template>
    <button
        v-bind="$attrs"
        type="button"
        role="tab"
        :aria-selected="variant === 'focus' ? undefined : isActive"
        :aria-disabled="disabled || undefined"
        :disabled="disabled"
        :class="[
            'tab-btn',
            {
                'tab-btn--active': isActive,
                'tab-btn--focus': variant === 'focus',
                'tab-btn--disabled': disabled,
            },
        ]"
        @click="onClick"
    >
        <i v-if="icon" :class="['pi', icon]" aria-hidden="true"></i>
        <span v-if="$slots.default" class="tab-btn__label">
            <slot />
        </span>
    </button>
</template>
