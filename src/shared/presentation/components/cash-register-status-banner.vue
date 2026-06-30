<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useShellFacade } from '../../application/shell.facade.js';
import { ROLES, hasRouteAccess } from '../constants/roles.constants.js';

const shell = useShellFacade();
const router = useRouter();
const route = useRoute();

const show = computed(() => {
    if (!shell.hasBranchSelected.value) return false;
    if (shell.hasOpenSession.value) return false;
    if (route.path.startsWith('/cash-register')) return false;
    const role = shell.userRole.value;
    return role === ROLES.CASHIER
        || role === ROLES.BRANCH_ADMIN
        || role === ROLES.OWNER
        || role === ROLES.WAITER;
});

const canOpenCashRegister = computed(() =>
    hasRouteAccess(shell.userRole.value, '/cash-register'),
);

function goToCashRegister() {
    router.push('/cash-register');
}
</script>

<template>
    <div v-if="show" class="cr-status-banner" role="status">
        <i class="pi pi-exclamation-triangle cr-status-banner__icon" aria-hidden="true"></i>
        <div class="cr-status-banner__text">
            <strong>Turno de caja cerrado.</strong>
            Abre un turno antes de cobrar en POS.
            <span v-if="!canOpenCashRegister"> Pide al cajero que abra caja.</span>
        </div>
        <pv-button
            v-if="canOpenCashRegister"
            label="Abrir caja"
            size="small"
            severity="warn"
            @click="goToCashRegister"
        />
    </div>
</template>

<style scoped>
.cr-status-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.65rem 1rem;
    margin-bottom: 0.75rem;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    color: #92400e;
    font-size: 0.875rem;
}
.cr-status-banner__icon {
    font-size: 1.1rem;
    flex-shrink: 0;
}
.cr-status-banner__text {
    flex: 1;
    min-width: 200px;
}
</style>
