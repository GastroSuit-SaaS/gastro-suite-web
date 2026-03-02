<script setup>
import { useRouter } from 'vue-router'
import { usePosStore }         from '../../application/pos.store.js'
import { posSelectTableRoute } from '../constants/pos.constants-ui.js'

const router   = useRouter()
const posStore = usePosStore()

function selectZone(zone) {
    router.push(posSelectTableRoute(zone.id))
}
</script>

<template>
    <div class="p-4">
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
</style>
