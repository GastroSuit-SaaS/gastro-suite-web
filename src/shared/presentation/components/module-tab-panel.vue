<script setup>
import { computed } from 'vue'

const props = defineProps({
    value: {
        type: [String, Number],
        required: true,
    },
    /** Mismo ref que v-model de module-tab-bar */
    activeTab: {
        type: [String, Number],
        required: true,
    },
})

const isActive = computed(() => props.activeTab === props.value)
</script>

<template>
    <div
        v-show="isActive"
        class="module-tab-panel"
        role="tabpanel"
        :aria-hidden="!isActive"
    >
        <slot />
    </div>
</template>
