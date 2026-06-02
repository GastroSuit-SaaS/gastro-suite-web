<script setup>
import { useAttrs, computed } from 'vue'
import { toolbarContext } from '../../composables/use-toolbar-context.js'
import { provideModuleTabBar } from '../../composables/use-module-tabs.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
    sticky: {
        type: Boolean,
        default: false,
    },
})

const activeTab = defineModel({
    type: [String, Number],
    default: undefined,
})

const emit = defineEmits(['change'])

const attrs = useAttrs()
const ariaLabel = computed(() => attrs['aria-label'] ?? 'Opciones del módulo')

provideModuleTabBar(activeTab, (value) => emit('change', value))
</script>

<template>
    <nav
        v-show="!toolbarContext.hideModuleTabs"
        v-bind="attrs"
        :class="['module-tab-bar', { 'module-tab-bar--sticky': sticky }, attrs.class]"
        role="tablist"
        :aria-label="ariaLabel"
    >
        <div class="module-tab-bar__tabs">
            <slot />
        </div>

        <div v-if="$slots.end" class="module-tab-bar__end">
            <slot name="end" />
        </div>
    </nav>
</template>
