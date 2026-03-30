<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore }          from '../../application/pos.store.js'
import { posSelectTableRoute }  from '../constants/pos.constants-ui.js'
import ModuleStateFeedback      from '../../../shared/presentation/components/module-state-feedback.vue'

const router   = useRouter()
const posStore = usePosStore()

const showZoneSelector = ref(false)

function openZoneSelector() { showZoneSelector.value = true }
function closeZoneSelector() { showZoneSelector.value = false }

function selectZone(zone) {
    closeZoneSelector()
    router.push(posSelectTableRoute(zone.id))
}

function openOrder(order) {
    posStore.openSaleForTable(order.tableId, order.zoneId)
    router.push(`/pos/order/${order.tableId}`)
}

onMounted(() => {
    posStore.fetchAll()
})
</script>

<template>
    <div class="p-4 flex flex-column gap-4">

        <!-- ══ Loading / Error / Contenido ════════════════════════════════════════ -->
        <module-state-feedback
            :loading="posStore.isLoading"
            :error="posStore.error"
            loading-label="Cargando terminal..."
            @retry="posStore.fetchAll()"
        >

        <!-- ── Stat cards (siempre visibles) ───────────────────────────── -->
        <div class="flex flex-wrap gap-3">
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <span class="text-sm text-color-secondary">Ordenes Activas</span>
                <span class="text-4xl font-bold text-color">{{ posStore.activeOrders.length }}</span>
            </div>
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <span class="text-sm text-color-secondary">Total en Proceso</span>
                <span class="text-4xl font-bold text-primary">S/ {{ posStore.totalInProcess.toFixed(2) }}</span>
            </div>
            <div class="stat-card flex flex-column gap-2 p-3 surface-card border-1 surface-border border-round-lg flex-1">
                <span class="text-sm text-color-secondary">Mesas Ocupadas</span>
                <span class="text-4xl font-bold text-color">{{ posStore.occupiedTables.length }}</span>
            </div>
        </div>

        <!-- ── Acción principal (siempre visible) ──────────────────────── -->
        <div>
            <pv-button
                label="Seleccionar por Zona/Mesa"
                icon="pi pi-map-marker"
                @click="openZoneSelector"
            />
        </div>

        <!-- ── Sección inferior: zonas u órdenes activas ───────────────── -->
        <transition name="fade" mode="out-in">

            <!-- Panel selector de zonas -->
            <div v-if="showZoneSelector" key="zones" class="zone-panel surface-card border-1 surface-border border-round-lg">

                <!-- Cabecera -->
                <div class="zone-panel__header flex align-items-center justify-content-between p-3">
                    <div class="flex align-items-center gap-2">
                        <i class="pi pi-map-marker text-primary"></i>
                        <span class="font-bold text-color">Seleccionar Zona</span>
                        <span class="text-sm text-color-secondary">— elige la zona y luego la mesa</span>
                    </div>
                    <button class="zone-panel__close" aria-label="Cerrar" @click="closeZoneSelector">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <div class="zone-panel__divider"></div>

                <!-- Grilla de zonas -->
                <div class="zone-grid p-3">
                    <div
                        v-for="zone in posStore.zones"
                        :key="zone.id"
                        class="zone-card cursor-pointer"
                        @click="selectZone(zone)"
                    >
                        <div class="flex align-items-start gap-3">
                            <div
                                class="zone-icon border-round-lg flex align-items-center justify-content-center flex-shrink-0"
                                :style="{ backgroundColor: zone.color }"
                            >
                                <i class="pi pi-map-marker text-white"></i>
                            </div>
                            <div class="flex flex-column gap-1 flex-1 min-w-0">
                                <span class="font-bold text-color">{{ zone.name }}</span>
                                <span class="text-sm text-color-secondary">{{ zone.description }}</span>
                            </div>
                            <i class="pi pi-chevron-right text-color-secondary zone-card__arrow"></i>
                        </div>

                        <div class="zone-card__divider mt-3 mb-2"></div>

                        <span class="text-sm text-color-secondary">
                            Total mesas: <strong class="text-color">{{ zone.count }}</strong>
                        </span>
                    </div>

                    <div
                        v-if="posStore.zones.length === 0"
                        class="col-span-all flex flex-column align-items-center justify-content-center gap-2 py-5"
                    >
                        <i class="pi pi-map text-3xl text-color-secondary" style="opacity:0.4"></i>
                        <span class="text-sm text-color-secondary">Sin zonas configuradas</span>
                    </div>
                </div>
            </div>

            <!-- Órdenes activas -->
            <div v-else key="orders">
                <!-- Empty state -->
                <div
                    v-if="posStore.activeOrders.length === 0"
                    class="empty-state surface-card border-1 surface-border border-round-lg flex flex-column align-items-center justify-content-center gap-3 py-6"
                >
                    <i class="pi pi-shopping-cart empty-state__icon text-color-secondary"></i>
                    <div class="flex flex-column align-items-center gap-1">
                        <span class="font-bold text-color">No hay ordenes activas</span>
                        <span class="text-sm text-color-secondary">Las ordenes apareceran aqui una vez que se creen</span>
                    </div>
                </div>

                <!-- Lista de órdenes -->
                <div v-else class="flex flex-column gap-2">
                    <span class="orders-label">Órdenes en curso</span>
                    <div
                        v-for="order in posStore.activeOrders"
                        :key="order.id"
                        class="order-row surface-card border-1 surface-border border-round-lg p-3 cursor-pointer"
                        @click="openOrder(order)"
                    >
                        <!-- Fila principal -->
                        <div class="flex align-items-center justify-content-between gap-3">

                            <!-- Izquierda: icono + datos -->
                            <div class="flex align-items-center gap-3">
                                <!-- Ícono coloreado con el color de zona -->
                                <div
                                    class="order-zone-dot border-round-lg flex align-items-center justify-content-center flex-shrink-0"
                                    :style="{ backgroundColor: posStore.zoneById(posStore.tableById(order.tableId)?.zoneId)?.color ?? 'var(--primary-color)' }"
                                >
                                    <i class="pi pi-receipt text-white"></i>
                                </div>

                                <!-- Zona + Mesa -->
                                <div class="flex flex-column gap-0">
                                    <span class="order-row__zone">
                                        {{ posStore.zoneById(posStore.tableById(order.tableId)?.zoneId)?.name ?? '—' }}
                                    </span>
                                    <span class="order-row__table">
                                        Mesa {{ posStore.tableById(order.tableId)?.number ?? order.tableId }}
                                    </span>
                                </div>
                            </div>

                            <!-- Derecha: total -->
                            <span class="order-row__total">S/ {{ order.total.toFixed(2) }}</span>
                        </div>

                        <!-- Fila secundaria: personas e ítems -->
                        <div class="order-row__meta flex align-items-center gap-3 mt-2">
                            <span class="flex align-items-center gap-1">
                                <i class="pi pi-users"></i>
                                {{ posStore.tableById(order.tableId)?.seatedGuests ?? 0 }}/{{ posStore.tableById(order.tableId)?.capacity ?? '?' }} personas
                            </span>
                            <span class="order-row__meta-sep">·</span>
                            <span class="flex align-items-center gap-1">
                                <i class="pi pi-list"></i>
                                {{ order.items.length }} ítem{{ order.items.length !== 1 ? 's' : '' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </transition>

        </module-state-feedback>

    </div>
</template>

<style scoped>
.stat-card { min-width: 160px; }

/* Loading/Error states handled by shared ModuleStateFeedback component */

/* ── Empty state ─────────────────────────────────────────────────────────── */
.empty-state { min-height: 180px; }
.empty-state__icon { font-size: 3rem; opacity: 0.4; }

/* ── Órdenes activas ─────────────────────────────────────────────────────── */
.orders-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #374151;
}

.order-row { transition: box-shadow 0.15s, transform 0.15s; }
.order-row:hover {
    box-shadow: 0 3px 12px rgba(0,0,0,0.1);
    transform: translateY(-1px);
}

.order-zone-dot {
    width: 2.25rem;
    height: 2.25rem;
    flex-shrink: 0;
}

.order-row__zone {
    font-size: 0.72rem;
    color: #6b7280;
    font-weight: 500;
}

.order-row__table {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
}

.order-row__total {
    font-size: 1rem;
    font-weight: 700;
    color: #059669;
    white-space: nowrap;
}

.order-row__meta {
    font-size: 0.75rem;
    color: #6b7280;
    padding-left: 3.25rem; /* alinea con el texto tras el ícono */
}

.order-row__meta .pi { font-size: 0.72rem; }

.order-row__meta-sep { opacity: 0.4; }

/* ── Panel de zonas ──────────────────────────────────────────────────────── */
.zone-panel { overflow: hidden; }

.zone-panel__header { background: var(--surface-card); }

.zone-panel__divider { height: 1px; background: var(--surface-border); }

.zone-panel__close {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 1px solid var(--surface-border);
    background: var(--surface-ground);
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background 0.15s, color 0.15s;
}
.zone-panel__close:hover {
    background: var(--red-50, #fef2f2);
    color: var(--red-500, #ef4444);
    border-color: var(--red-200, #fecaca);
}

/* Grilla de zonas */
.zone-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.85rem;
}

.col-span-all { grid-column: 1 / -1; }

.zone-card {
    border: 1.5px solid var(--surface-border);
    border-radius: 10px;
    padding: 0.85rem;
    background: var(--surface-ground);
    transition: box-shadow 0.15s, transform 0.15s;
}
.zone-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    transform: translateY(-2px);
}

.zone-icon {
    width: 2.5rem;
    height: 2.5rem;
}

.zone-card__arrow {
    font-size: 0.75rem;
    margin-top: 0.15rem;
    flex-shrink: 0;
}

.zone-card__divider {
    height: 1px;
    background: var(--surface-border);
}

/* ── Transitions ─────────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
