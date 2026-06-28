<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '../../application/pos.store.js'
import { useCashRegisterStore } from '../../../cash-register/application/cash-register.store.js'
import { useStationsStore } from '../../../stations/application/stations.store.js'
import { useReservationsStore } from '../../../tables/application/reservations.store.js'
import { useInventoryStore } from '../../../inventory/application/inventory.store.js'
import { useTablesStore } from '../../../tables/application/tables.store.js'
import { buildPosHubAlerts } from '../helpers/pos-hub-alerts.helpers.js'
import { useSubscriptionEntitlements } from '../../../shared/composables/use-subscription-entitlements.js'

const router = useRouter()
const posStore = usePosStore()
const cashRegisterStore = useCashRegisterStore()
const stationsStore = useStationsStore()
const reservationsStore = useReservationsStore()
const inventoryStore = useInventoryStore()
const tablesStore = useTablesStore()
const { entitlements } = useSubscriptionEntitlements()

onMounted(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const tasks = [];
    if (entitlements.value.hasKitchen) {
        tasks.push(stationsStore.fetchAll?.().catch(() => {}));
    }
    if (entitlements.value.hasInventory) {
        tasks.push(inventoryStore.fetchAll?.().catch(() => {}));
    }
    if (entitlements.value.hasReservations) {
        tasks.push(reservationsStore.fetchByDateSilent?.(today).catch(() => {}));
    }
    await Promise.all(tasks);
});

const alerts = computed(() =>
    buildPosHubAlerts({
        cashRegisterStore,
        stationsStore,
        reservationsStore,
        inventoryStore,
        tablesStore,
        activeOrdersCount: posStore.activeOrders.length,
        entitlements: entitlements.value,
    }),
);

function goTo(route) {
    if (route) router.push(route);
}
</script>

<template>
    <aside class="alerts-panel">
        <div class="alerts-panel__head">
            <h2>Alertas y solicitudes</h2>
            <p>Atención operativa del turno</p>
        </div>

        <ul v-if="alerts.length" class="alerts-panel__list">
            <li
                v-for="alert in alerts"
                :key="alert.key"
                :class="['alert-item', `alert-item--${alert.tone}`]"
            >
                <span class="alert-item__icon"><i :class="['pi', alert.icon]"></i></span>
                <div class="alert-item__body">
                    <p class="alert-item__title">{{ alert.title }}</p>
                    <p class="alert-item__detail">{{ alert.detail }}</p>
                    <button
                        v-if="alert.actionRoute"
                        type="button"
                        class="alert-item__action"
                        @click="goTo(alert.actionRoute)"
                    >
                        {{ alert.actionLabel }}
                    </button>
                </div>
            </li>
        </ul>

        <div v-else class="alerts-panel__empty">
            <i class="pi pi-check-circle"></i>
            <span>Sin alertas por ahora</span>
        </div>
    </aside>
</template>

<style scoped>
.alerts-panel {
    background: #fff;
    border: 1px solid #eef0f4;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.alerts-panel__head {
    padding: 1rem 1rem 0.75rem;
    border-bottom: 1px solid #f3f4f6;
}

.alerts-panel__head h2 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: #111827;
}

.alerts-panel__head p {
    margin: 0.15rem 0 0;
    font-size: 0.72rem;
    color: #6b7280;
}

.alerts-panel__list {
    list-style: none;
    margin: 0;
    padding: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    max-height: 360px;
    overflow-y: auto;
}

.alert-item {
    display: flex;
    gap: 0.65rem;
    padding: 0.75rem;
    border-radius: 12px;
    border: 1px solid transparent;
}

.alert-item--danger { background: #fef2f2; border-color: #fecaca; }
.alert-item--warn { background: #fffbeb; border-color: #fde68a; }
.alert-item--info { background: #eff6ff; border-color: #bfdbfe; }

.alert-item__icon {
    width: 2rem;
    height: 2rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.alert-item__title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 800;
    color: #111827;
}

.alert-item__detail {
    margin: 0.15rem 0 0;
    font-size: 0.72rem;
    color: #4b5563;
    line-height: 1.4;
}

.alert-item__action {
    margin-top: 0.45rem;
    padding: 0;
    border: none;
    background: transparent;
    color: #6d28d9;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
}

.alert-item__action:hover { text-decoration: underline; }

.alerts-panel__empty {
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    color: #9ca3af;
    font-size: 0.82rem;
}

.alerts-panel__empty .pi {
    font-size: 1.5rem;
    color: #22c55e;
}
</style>
