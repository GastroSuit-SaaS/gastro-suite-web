<script setup>
import { onMounted } from 'vue'
import { useCashRegisterStore } from '../../application/cash-register.store.js'

const store = useCashRegisterStore()

onMounted(() => {
    store.fetchAll()
})
</script>

<template>
    <div class="page-container">
        <div class="page-header">
            <h1 class="page-title">
                <i class="pi pi-dollar" style="margin-right: 0.5rem;" />
                Caja
            </h1>
            <p class="page-subtitle">Control de caja y movimientos de efectivo</p>
        </div>

        <div v-if="store.isLoading" class="page-loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem;" />
        </div>

        <div v-else class="page-content">
            <div class="balance-cards">
                <div class="balance-card income">
                    <span class="balance-label">Ingresos</span>
                    <span class="balance-value">S/ {{ store.totalIncome.toFixed(2) }}</span>
                </div>
                <div class="balance-card expense">
                    <span class="balance-label">Egresos</span>
                    <span class="balance-value">S/ {{ store.totalExpense.toFixed(2) }}</span>
                </div>
                <div class="balance-card total">
                    <span class="balance-label">Balance</span>
                    <span class="balance-value">S/ {{ store.balance.toFixed(2) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-container  { padding: 1.5rem; }
.page-header     { margin-bottom: 1.5rem; }
.page-title      { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.25rem; display: flex; align-items: center; }
.page-subtitle   { color: var(--text-secondary); margin: 0; font-size: 0.875rem; }
.page-loading    { display: flex; justify-content: center; padding: 3rem; color: var(--text-secondary); }
.balance-cards   { display: flex; gap: 1rem; flex-wrap: wrap; }
.balance-card    { display: flex; flex-direction: column; gap: 0.25rem; padding: 1.25rem 1.5rem; border-radius: 8px; background: var(--bg-surface); border: 1px solid var(--border-color); min-width: 160px; }
.balance-label   { font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.balance-value   { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
.income .balance-value  { color: #22c55e; }
.expense .balance-value { color: #ef4444; }
</style>
