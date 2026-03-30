<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore }         from '../../application/pos.store.js'
import { posSelectTableRoute } from '../constants/pos.constants-ui.js'

const router   = useRouter()
const posStore = usePosStore()

onMounted(() => {
    if (posStore.sales.length === 0) posStore.fetchAll()
})

function selectZone(zone) {
    router.push(posSelectTableRoute(zone.id))
}
</script>

<template>
    <div class="p-4 flex flex-column gap-3">

        <!-- Acceso rápido a órdenes activas -->
        <div class="orders-link" @click="router.push('/pos')">
            <i class="pi pi-list orders-link__icon"></i>
            <span>Ver órdenes activas</span>
            <span v-if="posStore.activeOrders.length > 0" class="orders-link__badge">
                {{ posStore.activeOrders.length }}
            </span>
            <i class="pi pi-arrow-right orders-link__arrow"></i>
        </div>

        <div class="zone-grid">
            <div
                v-for="zone in posStore.zones"
                :key="zone.id"
                class="zone-card surface-card border-1 surface-border border-round-lg p-3 cursor-pointer"
                @click="selectZone(zone)"
            >
                <div class="flex align-items-start gap-3">
                    <!-- Ícono con color de zona -->
                    <div
                        class="zone-icon border-round-lg flex align-items-center justify-content-center flex-shrink-0"
                        :style="{ backgroundColor: zone.color }"
                    >
                        <i class="pi pi-map-marker text-white"></i>
                    </div>

                    <!-- Info -->
                    <div class="flex flex-column gap-1 flex-1 min-w-0">
                        <span class="font-bold text-color">{{ zone.name }}</span>
                        <span class="text-sm text-color-secondary">{{ zone.description }}</span>
                    </div>
                </div>

                <div class="zone-card__divider mt-3 mb-2"></div>

                <span class="text-sm text-color-secondary">
                    Total mesas: <strong class="text-color">{{ zone.count }}</strong>
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ── Orders link ────────────────────────────────────────────────────────── */
.orders-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    background: var(--surface-card);
    color: var(--text-color-secondary);
    font-size: 0.83rem;
    font-weight: 500;
    cursor: pointer;
    width: fit-content;
    transition: background 0.15s, color 0.15s;
}
.orders-link:hover { background: var(--surface-hover); color: var(--text-color); }
.orders-link__icon  { font-size: 0.82rem; }
.orders-link__arrow { font-size: 0.7rem; margin-left: auto; opacity: 0.5; }
.orders-link__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    border-radius: 999px;
    background: var(--primary-color, #6366f1);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0 0.3rem;
}

/* ── zone grid ───────────────────────────────────────────────────────────── */
.zone-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
}

.zone-card {
    transition: box-shadow 0.15s, transform 0.15s;
}

.zone-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.zone-icon {
    width: 2.75rem;
    height: 2.75rem;
    flex-shrink: 0;
}

.zone-card__divider {
    height: 1px;
    background-color: var(--surface-border);
}

/* ── Responsive: ≤ 640px ─────────────────────────────────────────────────── */
@media (max-width: 640px) {
    .zone-grid { grid-template-columns: 1fr; }
    .orders-link { width: 100%; }
}
</style>
