<script setup>
import { useTablesStore } from '../../application/tables.store.js'

const store = useTablesStore()



</script>

<template>
    <div class="p-4 flex flex-column gap-4">

        <!-- Stat cards -->
        <div class="flex flex-wrap gap-3">

            <!-- Total -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <span class="text-sm text-color-secondary">Total Mesas</span>
                <span class="text-4xl font-bold text-color">{{ store.totalTables }}</span>
            </div>

            <!-- Disponibles -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <div class="flex align-items-center gap-2">
                    <span class="status-dot bg-green-500"></span>
                    <span class="text-sm text-color-secondary">Disponibles</span>
                </div>
                <span class="text-4xl font-bold text-green-500">{{ store.availableTables.length }}</span>
            </div>

            <!-- Ocupadas -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <div class="flex align-items-center gap-2">
                    <span class="status-dot bg-red-500"></span>
                    <span class="text-sm text-color-secondary">Ocupadas</span>
                </div>
                <span class="text-4xl font-bold text-red-500">{{ store.occupiedTables.length }}</span>
            </div>

            <!-- En Limpieza -->
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <div class="flex align-items-center gap-2">
                    <span class="status-dot bg-blue-500"></span>
                    <span class="text-sm text-color-secondary">En Limpieza</span>
                </div>
                <span class="text-4xl font-bold text-blue-500">{{ store.cleaningTables.length }}</span>
            </div>

        </div>

        <!-- Zone filter + actions -->
        <div class="flex flex-column gap-2">

            <!-- Row 1: label -->
            <div class="flex align-items-center gap-2">
                <i class="pi pi-map-marker text-color-secondary"></i>
                <span class="text-sm text-color-secondary font-medium">Filtrar por Zona:</span>
            </div>

            <!-- Row 2: zone pills (left) + action buttons (right) -->
            <div class="flex align-items-center justify-content-between flex-wrap gap-2">

                <!-- Zone pills -->
                <div class="flex flex-wrap gap-2">
                    <button
                        :class="['zone-btn border-round-xl px-3 py-2 cursor-pointer text-sm font-medium border-1',
                                 store.selectedZoneId === null ? 'zone-btn--active' : 'zone-btn--inactive']"
                        @click="store.selectZone(null)"
                    >
                        Todas las Zonas ({{ store.totalTables }})
                    </button>

                    <button
                        v-for="zone in store.zones"
                        :key="zone.id"
                        :class="['zone-btn border-round-xl px-3 py-2 cursor-pointer text-sm font-medium border-1',
                                 store.selectedZoneId === zone.id ? 'zone-btn--active' : 'zone-btn--inactive']"
                        @click="store.selectZone(zone.id)"
                    >
                        {{ zone.name }} ({{ zone.count }})
                    </button>
                </div>

                <!-- Action buttons -->
                <div class="flex gap-2">
                    <pv-button label="Nueva Zona" icon="pi pi-plus" size="small" />
                    <pv-button label="Nueva Mesa" icon="pi pi-plus" size="small" severity="success" />
                </div>

            </div>
        </div>

    </div>
</template>

<style scoped>
.stat-card { min-width: 130px; }

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.zone-btn {
    background: transparent;
    transition: background 0.15s ease, color 0.15s ease;
}

.zone-btn--active {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
}

.zone-btn--inactive {
    color: var(--text-secondary);
    border-color: var(--border-color);
}

.zone-btn--inactive:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}
</style>
