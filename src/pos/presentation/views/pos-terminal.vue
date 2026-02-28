<script setup>
import { onMounted } from 'vue'
import { usePosStore } from '../../application/pos.store.js'

const store = usePosStore()

onMounted(() => {
    store.fetchAll()
})
</script>

<template>
    <div class="p-4">
        <div v-if="store.isLoading" class="flex justify-content-center p-6">
            <i class="pi pi-spin pi-spinner text-color-secondary" style="font-size: 2rem;" />
        </div>
        <div v-else>
            <p class="text-color-secondary">Total venta actual: S/ {{ store.currentTotal.toFixed(2) }}</p>
        </div>
    </div>
</template>
