<script setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '../../application/dashboard.store.js'

const store = useDashboardStore()

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
            <p class="text-color-secondary">Bienvenido a GastroSuite. Aquí se mostrarán las métricas del negocio.</p>
        </div>
    </div>
</template>
