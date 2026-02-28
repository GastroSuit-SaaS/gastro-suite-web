<script setup>
import { onMounted } from 'vue'
import { useReportsStore } from '../../application/reports.store.js'

const store = useReportsStore()

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
            <p class="text-color-secondary">{{ store.hasReports ? store.reports.length + ' reportes disponibles.' : 'No hay reportes generados aún.' }}</p>
        </div>
    </div>
</template>
