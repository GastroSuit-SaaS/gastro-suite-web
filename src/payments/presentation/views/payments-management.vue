<script setup>
import { onMounted } from 'vue'
import { usePaymentsStore } from '../../application/payments.store.js'

const store = usePaymentsStore()

onMounted(() => {
    store.fetchAll()
})
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <h1 class="page-title">
                <i class="pi pi-credit-card" style="margin-right: 0.5rem;" />
                Pagos
            </h1>
            <p class="page-subtitle">Gestión de pagos y transacciones</p>
        </div>

        <div v-if="store.isLoading" class="page-loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem;" />
        </div>

        <div v-else class="page-content">
            <p class="placeholder-text">Total acumulado: S/ {{ store.totalAmount.toFixed(2) }}</p>
        </div>
    </div>
</template>

<style scoped>
.page-container  { padding: 1.5rem; }
.page-header     { margin-bottom: 1.5rem; }
.page-title      { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.25rem; display: flex; align-items: center; }
.page-subtitle   { color: var(--text-secondary); margin: 0; font-size: 0.875rem; }
.page-loading    { display: flex; justify-content: center; padding: 3rem; color: var(--text-secondary); }
.placeholder-text { color: var(--text-secondary); }
</style>
