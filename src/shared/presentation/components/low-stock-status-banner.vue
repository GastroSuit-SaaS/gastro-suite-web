<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useInventoryStore } from '../../../inventory/application/inventory.store.js'
import { useSubscriptionEntitlements } from '../../../shared/composables/use-subscription-entitlements.js'
import { hasRouteAccess } from '../constants/roles.constants.js'
import { INVENTORY_MESSAGES } from '../../../inventory/presentation/constants/inventory.constants-ui.js'

const iamStore = useIamStore()
const inventoryStore = useInventoryStore()
const router = useRouter()
const route = useRoute()
const { entitlements } = useSubscriptionEntitlements()

const canManageInventory = computed(() =>
    hasRouteAccess(iamStore.userRole, '/inventory'),
)

const isRelevantRoute = computed(() =>
    route.path.startsWith('/dashboard')
    || route.path.startsWith('/pos')
    || route.path.startsWith('/inventory'),
)

const alertCount = computed(() =>
    inventoryStore.lowStockProducts.length + inventoryStore.outOfStockProducts.length,
)

const show = computed(() =>
    iamStore.hasBranchSelected
    && entitlements.value.hasInventory
    && canManageInventory.value
    && isRelevantRoute.value
    && alertCount.value > 0
    && !route.path.startsWith('/inventory'),
)

const bannerMessage = computed(() =>
    `${alertCount.value} ${INVENTORY_MESSAGES.LOW_STOCK_BANNER}`,
)

async function refreshInventory() {
    if (!iamStore.hasBranchSelected || !canManageInventory.value) return
    if (!isRelevantRoute.value) return
    try {
        await inventoryStore.fetchAll()
    } catch { /* el módulo inventario muestra error propio */ }
}

function goToInventory() {
    router.push('/inventory')
}

onMounted(refreshInventory)
watch(() => iamStore.activeBranchId, refreshInventory)
</script>

<template>
    <div v-if="show" class="low-stock-banner" role="status">
        <i class="pi pi-box low-stock-banner__icon" aria-hidden="true"></i>
        <div class="low-stock-banner__text">
            <strong>Alerta de inventario.</strong>
            {{ bannerMessage }}
        </div>
        <pv-button
            label="Ver inventario"
            size="small"
            severity="warn"
            outlined
            @click="goToInventory"
        />
    </div>
</template>

<style scoped>
.low-stock-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.65rem 1rem;
    margin-bottom: 0.75rem;
    background: #fff7ed;
    border: 1px solid #fdba74;
    border-radius: 8px;
    color: #9a3412;
    font-size: 0.875rem;
}
.low-stock-banner__icon {
    font-size: 1.1rem;
    flex-shrink: 0;
}
.low-stock-banner__text {
    flex: 1;
    min-width: 200px;
}
</style>
