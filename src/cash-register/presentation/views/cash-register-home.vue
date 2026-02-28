<script setup>
import { onMounted } from 'vue'
import { useCashRegisterStore } from '../../application/cash-register.store.js'

const store = useCashRegisterStore()

onMounted(() => {
    store.fetchAll()
})
</script>

<template>
    <div class="p-4">
        <div v-if="store.isLoading" class="flex justify-content-center p-6">
            <i class="pi pi-spin pi-spinner text-color-secondary" style="font-size: 2rem;" />
        </div>
        <div v-else class="flex flex-wrap gap-3">
            <div class="flex flex-column gap-1 p-4 surface-card border-1 surface-border border-round-lg" style="min-width: 160px">
                <span class="text-xs text-color-secondary uppercase">Ingresos</span>
                <span class="text-2xl font-bold text-green-400">S/ {{ store.totalIncome.toFixed(2) }}</span>
            </div>
            <div class="flex flex-column gap-1 p-4 surface-card border-1 surface-border border-round-lg" style="min-width: 160px">
                <span class="text-xs text-color-secondary uppercase">Egresos</span>
                <span class="text-2xl font-bold text-red-400">S/ {{ store.totalExpense.toFixed(2) }}</span>
            </div>
            <div class="flex flex-column gap-1 p-4 surface-card border-1 surface-border border-round-lg" style="min-width: 160px">
                <span class="text-xs text-color-secondary uppercase">Balance</span>
                <span class="text-2xl font-bold text-color">S/ {{ store.balance.toFixed(2) }}</span>
            </div>
        </div>
    </div>
</template>
