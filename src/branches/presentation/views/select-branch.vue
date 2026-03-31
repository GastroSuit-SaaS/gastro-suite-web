<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useBranchesStore } from '../../../branches/application/branches.store.js'

const router   = useRouter()
const route    = useRoute()
const iamStore = useIamStore()
const branchesStore = useBranchesStore()

const selectedBranch = ref(null)

onMounted(async () => {
    await branchesStore.fetchAll()
})

function handleSelect() {
    if (!selectedBranch.value) return
    iamStore.selectBranch(selectedBranch.value.id, selectedBranch.value.nombre)
    const redirect = route.query.redirect ?? '/dashboard'
    router.push(redirect)
}

function handleGoToDashboard() {
    router.push('/dashboard')
}
</script>

<template>
    <div class="flex align-items-center justify-content-center min-h-screen bg-surface">
        <div class="select-branch-card p-5 border-round-xl w-full">

            <!-- Header -->
            <div class="text-center mb-5">
                <div class="branch-icon-circle flex align-items-center justify-content-center mx-auto mb-3">
                    <i class="pi pi-shop" style="font-size: 1.5rem; color: var(--color-primary);"></i>
                </div>
                <h2 class="text-2xl font-bold m-0 text-color">Seleccionar Sucursal</h2>
                <p class="text-sm text-color-secondary mt-1 m-0">
                    Elige la sucursal en la que deseas operar
                </p>
            </div>

            <!-- Loading -->
            <div v-if="branchesStore.isLoading" class="flex justify-content-center py-4">
                <pv-progress-spinner style="width: 40px; height: 40px;" />
            </div>

            <!-- Error -->
            <pv-message v-if="branchesStore.error" severity="error" class="mb-3 w-full">
                {{ branchesStore.error }}
            </pv-message>

            <!-- Branch list -->
            <div v-if="!branchesStore.isLoading" class="flex flex-column gap-2 mb-4">
                <div
                    v-for="branch in branchesStore.activeBranches"
                    :key="branch.id"
                    :class="[
                        'branch-card flex align-items-center gap-3 p-3 border-round-lg cursor-pointer',
                        { 'branch-card--selected': selectedBranch?.id === branch.id }
                    ]"
                    @click="selectedBranch = branch"
                >
                    <div class="branch-card__icon flex align-items-center justify-content-center flex-shrink-0">
                        <i class="pi pi-building"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-sm text-color m-0">{{ branch.nombre }}</p>
                        <p class="text-xs text-color-secondary m-0 mt-1 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                            {{ branch.codigo }} — {{ branch.direccion }}
                        </p>
                    </div>
                    <i v-if="selectedBranch?.id === branch.id" class="pi pi-check-circle text-primary"></i>
                </div>

                <!-- Sin sucursales -->
                <div v-if="branchesStore.activeBranches.length === 0 && !branchesStore.isLoading" class="text-center py-4">
                    <i class="pi pi-info-circle text-color-secondary mb-2" style="font-size: 2rem;"></i>
                    <p class="text-sm text-color-secondary m-0">
                        No hay sucursales creadas. Ve al módulo de Sucursales para crear una.
                    </p>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-column gap-2">
                <pv-button
                    label="Operar en esta sucursal"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    class="w-full"
                    :disabled="!selectedBranch"
                    @click="handleSelect"
                />
                <pv-button
                    label="Ir al dashboard sin sucursal"
                    severity="secondary"
                    text
                    class="w-full"
                    @click="handleGoToDashboard"
                />
            </div>

        </div>
    </div>
</template>

<style scoped>
.select-branch-card {
    max-width: 28rem;
    background: var(--color-white, #fff);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
.branch-icon-circle {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.branch-card {
    border: 1px solid var(--color-gray-200, #e5e7eb);
    transition: border-color 0.15s, background-color 0.15s;
}
.branch-card:hover {
    border-color: var(--color-primary);
    background-color: color-mix(in srgb, var(--color-primary) 4%, transparent);
}
.branch-card--selected {
    border-color: var(--color-primary);
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
}
.branch-card__icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    background-color: var(--color-gray-100, #f3f4f6);
    color: var(--color-gray-600, #4b5563);
}
.bg-surface {
    background-color: var(--color-gray-50, #f9fafb);
}
</style>
