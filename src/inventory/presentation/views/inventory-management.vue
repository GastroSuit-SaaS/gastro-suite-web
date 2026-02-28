<script setup>
import { onMounted } from 'vue'
import { useInventoryStore } from '../../application/inventory.store.js'

const store = useInventoryStore()

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
            <p class="text-color-secondary">{{ store.totalProducts }} productos registrados.</p>
        </div>
    </div>
</template>
