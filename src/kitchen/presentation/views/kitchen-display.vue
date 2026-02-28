<script setup>
import { onMounted } from 'vue'
import { useKitchenStore } from '../../application/kitchen.store.js'

const store = useKitchenStore()

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
            <p class="text-color-secondary">{{ store.pendingOrders.length }} órdenes pendientes.</p>
        </div>
    </div>
</template>
