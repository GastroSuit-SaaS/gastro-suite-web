<script setup>
import { ref, computed, watch } from 'vue'
import { usePosStore } from '../../application/pos.store.js'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({ visible: Boolean })
const emit  = defineEmits(['update:visible', 'transferred'])

const posStore      = usePosStore()
const selectedZone  = ref(null)
const selectedTable = ref(null)
const isTransferring = ref(false)

const zones = computed(() => posStore.zones)

const currentTableId = computed(() => posStore.currentSale?.tableId ?? null)
const currentTable   = computed(() => posStore.tableById(currentTableId.value))
const currentZone    = computed(() => posStore.zoneById(currentTable.value?.zoneId))

const tablesForZone = computed(() => {
    if (!selectedZone.value) return []
    return posStore.tablesForZone(selectedZone.value).filter(t => t.id !== currentTableId.value)
})

const availableTables = computed(() =>
    tablesForZone.value.filter(t => t.status === 'available')
)

const occupiedTables = computed(() =>
    tablesForZone.value.filter(t => t.status !== 'available')
)

const canConfirm = computed(() => selectedTable.value !== null)

const selectedTableObj = computed(() =>
    tablesForZone.value.find(t => t.id === selectedTable.value) ?? null
)

const selectedZoneObj = computed(() =>
    zones.value.find(z => z.id === selectedZone.value) ?? null
)

function availableCountForZone(zoneId) {
    return posStore.tablesForZone(zoneId)
        .filter(t => t.id !== currentTableId.value && t.status === 'available').length
}

function zoneById(id) {
    return posStore.zoneById(id)
}

const buttonLabel = computed(() => {
    if (isTransferring.value) return 'Transfiriendo...'
    if (canConfirm.value) return `Transferir a Mesa ${selectedTableObj.value?.number}`
    return 'Selecciona una mesa'
})

// Auto-select current zone on open
watch(() => props.visible, (v) => {
    if (v) {
        selectedZone.value  = currentTable.value?.zoneId ?? null
        selectedTable.value = null
        isTransferring.value = false
    }
})

watch(selectedZone, () => {
    selectedTable.value = null
})

function selectTable(tableId) {
    const table = tablesForZone.value.find(t => t.id === tableId)
    if (!table || table.status !== 'available') return
    selectedTable.value = tableId
}

function onCancel() {
    emit('update:visible', false)
}

async function onSave() {
    if (!canConfirm.value || isTransferring.value) return
    isTransferring.value = true
    try {
        const ok = await posStore.transferSale(selectedTable.value, selectedZone.value)
        if (ok) {
            emit('transferred', selectedTable.value)
            emit('update:visible', false)
        }
    } finally {
        isTransferring.value = false
    }
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="false"
        entity-name="Cambio de Mesa"
        :custom-button-label="buttonLabel"
        size="standard"
        @update:visible="$emit('update:visible', $event)"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-3 pt-2">

                <!-- Transfer preview strip — visible once table is selected -->
                <div v-if="canConfirm" class="tfd-preview">
                    <div class="tfd-preview__from">
                        <i class="pi pi-th-large"></i>
                        <div>
                            <span class="tfd-preview__table">Mesa {{ currentTable?.number }}</span>
                            <span class="tfd-preview__zone">{{ currentZone?.name }}</span>
                        </div>
                    </div>
                    <i class="pi pi-arrow-right tfd-preview__arrow"></i>
                    <div class="tfd-preview__to">
                        <i class="pi pi-th-large"></i>
                        <div>
                            <span class="tfd-preview__table">Mesa {{ selectedTableObj?.number }}</span>
                            <span class="tfd-preview__zone">{{ selectedZoneObj?.name }}</span>
                        </div>
                    </div>
                </div>

                <!-- Info mesa actual — visible when no table selected yet -->
                <div v-else class="tfd-current">
                    <div class="tfd-current__icon">
                        <i class="pi pi-th-large"></i>
                    </div>
                    <div class="flex flex-column gap-1">
                        <span class="text-xs text-color-secondary uppercase font-medium" style="letter-spacing: 0.05em;">Mesa actual</span>
                        <span class="font-bold text-lg text-color">Mesa {{ currentTable?.number ?? '—' }}</span>
                        <span class="text-xs text-color-secondary">
                            <i class="pi pi-map-marker mr-1" style="font-size: 0.7rem;"></i>{{ currentZone?.name ?? 'Sin zona' }}
                        </span>
                    </div>
                </div>

                <!-- Paso 1: Seleccionar zona -->
                <div class="flex flex-column gap-2">
                    <label class="tfd-step-label">
                        <span class="tfd-step-num">1</span> Seleccionar zona
                    </label>
                    <pv-select
                        v-model="selectedZone"
                        :options="zones"
                        option-label="name"
                        option-value="id"
                        placeholder="Buscar zona..."
                        filter
                        filter-placeholder="Buscar zona..."
                        class="w-full"
                    >
                        <template #value="{ value }">
                            <div v-if="value" class="flex align-items-center gap-2">
                                <span class="tfd-zone-dot" :style="{ background: zoneById(value)?.color ?? '#9ca3af' }"></span>
                                <span class="font-semibold" style="font-size: 0.85rem;">{{ zoneById(value)?.name }}</span>
                                <span
                                    v-if="currentZone && value === currentZone.id"
                                    class="tfd-zone-current-inline"
                                >actual</span>
                                <span class="tfd-zone-avail-inline" :style="availableCountForZone(value) > 0 ? { color: '#16a34a' } : { color: '#9ca3af' }">
                                    {{ availableCountForZone(value) }} disponible{{ availableCountForZone(value) !== 1 ? 's' : '' }}
                                </span>
                            </div>
                            <span v-else style="font-size: 0.85rem; color: #9ca3af;">Buscar zona...</span>
                        </template>
                        <template #option="{ option }">
                            <div class="flex align-items-center gap-2 w-full">
                                <span class="tfd-zone-dot" :style="{ background: option.color }"></span>
                                <span class="font-semibold" style="font-size: 0.85rem;">{{ option.name }}</span>
                                <span
                                    v-if="currentZone && option.id === currentZone.id"
                                    class="tfd-zone-current-inline"
                                >actual</span>
                                <span
                                    class="ml-auto tfd-zone-badge"
                                    :style="availableCountForZone(option.id) > 0
                                        ? { background: '#dcfce7', color: '#16a34a' }
                                        : { background: '#f3f4f6', color: '#9ca3af' }"
                                >
                                    {{ availableCountForZone(option.id) }}
                                </span>
                            </div>
                        </template>
                    </pv-select>
                </div>

                <!-- Paso 2: Seleccionar mesa -->
                <div v-if="selectedZone" class="flex flex-column gap-2">
                    <label class="tfd-step-label">
                        <span class="tfd-step-num">2</span> Seleccionar mesa
                        <span class="tfd-step-count">{{ availableTables.length }} disponible{{ availableTables.length !== 1 ? 's' : '' }}</span>
                    </label>

                    <div v-if="availableTables.length === 0" class="tfd-empty">
                        <i class="pi pi-inbox" style="font-size: 1.5rem; color: #d1d5db;"></i>
                        <span>No hay mesas disponibles en esta zona</span>
                        <span class="text-xs text-color-secondary">Prueba seleccionando otra zona</span>
                    </div>

                    <div v-else class="tfd-table-grid">
                        <button
                            v-for="t in availableTables"
                            :key="t.id"
                            :class="['tfd-table-btn', selectedTable === t.id ? 'tfd-table-btn--selected' : '']"
                            @click="selectTable(t.id)"
                        >
                            <span class="tfd-table-num">{{ t.number }}</span>
                            <span class="tfd-table-cap">
                                <i class="pi pi-users" style="font-size: 0.6rem;"></i>
                                {{ t.capacity }}
                            </span>
                            <i v-if="selectedTable === t.id" class="pi pi-check tfd-table-check"></i>
                        </button>
                    </div>

                    <!-- Mesas ocupadas (informativo) -->
                    <div v-if="occupiedTables.length > 0" class="flex align-items-center gap-2 flex-wrap mt-1">
                        <span class="text-xs text-color-secondary">Ocupadas:</span>
                        <span
                            v-for="t in occupiedTables"
                            :key="t.id"
                            class="tfd-occupied-chip"
                        >{{ t.number }}</span>
                    </div>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
/* ── Transfer preview strip ─────────────────────────── */
.tfd-preview {
    display: flex; align-items: center; justify-content: center; gap: 1rem;
    padding: 0.75rem 1rem; border-radius: 10px;
    background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
    border: 1px solid #c7d2fe;
}
.tfd-preview__from, .tfd-preview__to {
    display: flex; align-items: center; gap: 0.5rem;
}
.tfd-preview__from .pi, .tfd-preview__to .pi:first-child {
    font-size: 1rem; color: #6366f1;
}
.tfd-preview__from div, .tfd-preview__to div {
    display: flex; flex-direction: column;
}
.tfd-preview__table { font-size: 0.88rem; font-weight: 700; color: #312e81; }
.tfd-preview__zone  { font-size: 0.68rem; color: #6366f1; }
.tfd-preview__arrow { font-size: 0.85rem; color: #818cf8; }

/* ── Current table card ─────────────────────────────── */
.tfd-current {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; border-radius: 10px;
    background: #f9fafb; border: 1px solid #e5e7eb;
}
.tfd-current__icon {
    display: flex; align-items: center; justify-content: center;
    width: 2.5rem; height: 2.5rem; border-radius: 10px;
    background: #e5e7eb; color: #6b7280; font-size: 1rem;
}

/* ── Step labels ────────────────────────────────────── */
.tfd-step-label {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; font-weight: 600; color: #374151;
}
.tfd-step-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 1.25rem; height: 1.25rem; border-radius: 50%;
    background: #6366f1; color: #fff;
    font-size: 0.65rem; font-weight: 700;
}
.tfd-step-count {
    margin-left: auto;
    font-size: 0.7rem; font-weight: 500; color: #9ca3af;
}

/* ── Zone dropdown helpers ───────────────────────────── */
.tfd-zone-dot {
    display: inline-block; width: 0.6rem; height: 0.6rem;
    border-radius: 50%; flex-shrink: 0;
}

.tfd-zone-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.2rem; height: 1.2rem; border-radius: 6px;
    font-size: 0.65rem; font-weight: 700; padding: 0 0.3rem;
}

.tfd-zone-current-inline {
    font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
    background: #6366f1; color: #fff; padding: 0.05rem 0.35rem;
    border-radius: 4px; letter-spacing: 0.03em;
}

.tfd-zone-avail-inline {
    margin-left: auto; font-size: 0.7rem; font-weight: 500;
}

/* ── Table grid ─────────────────────────────────────── */
.tfd-table-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 0.5rem;
}

.tfd-table-btn {
    display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
    padding: 0.65rem 0.5rem; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #fff;
    cursor: pointer; transition: all 0.15s;
    position: relative;
}
.tfd-table-btn:hover { border-color: #6366f1; background: #f5f3ff; }

.tfd-table-btn--selected {
    border-color: #6366f1; background: #eef2ff;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}
.tfd-table-btn--selected .tfd-table-num { color: #6366f1; }

.tfd-table-num { font-size: 1.1rem; font-weight: 800; color: #111827; }

.tfd-table-cap {
    display: flex; align-items: center; gap: 0.2rem;
    font-size: 0.65rem; color: #9ca3af; font-weight: 500;
}

.tfd-table-check {
    position: absolute; top: 0.3rem; right: 0.3rem;
    font-size: 0.6rem; color: #fff; background: #6366f1;
    width: 1rem; height: 1rem; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
}

/* ── Empty state ────────────────────────────────────── */
.tfd-empty {
    display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
    padding: 1.5rem; border-radius: 10px;
    background: #f9fafb; border: 1px dashed #d1d5db;
    font-size: 0.82rem; color: #6b7280;
}

/* ── Occupied chips ─────────────────────────────────── */
.tfd-occupied-chip {
    font-size: 0.65rem; color: #9ca3af; background: #f3f4f6;
    padding: 0.1rem 0.45rem; border-radius: 4px; font-weight: 600;
}
</style>
