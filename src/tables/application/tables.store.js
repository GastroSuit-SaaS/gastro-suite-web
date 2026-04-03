import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { TablesApi } from '../infrastructure/api/tables.api.js';
import { TableAssembler } from '../infrastructure/assemblers/table.assembler.js';
import { ZoneAssembler } from '../infrastructure/assemblers/zone.assembler.js';
import { Table, TABLE_STATUS, TABLE_SHAPE } from '../domain/models/table.entity.js';
import { Zone } from '../domain/models/zone.entity.js';
import { MOCK_ZONES, MOCK_TABLES } from '../infrastructure/tables.mock.js';

const api = new TablesApi();
const _isMock = import.meta.env.VITE_USE_MOCK === 'true';

export const useTablesStore = defineStore('tables', () => {

    // ── State ───────────────────────────────────────────────────
    const zonesData = ref([]);
    const tables    = ref([]);
    const selectedTable  = ref(null);
    const selectedZoneId = ref(null);
    const isLoading      = ref(false);
    const error          = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    // ── Active zone filtering (internal) ─────────────────────────────────
    const activeZoneIds = computed(() =>
        new Set(zonesData.value.filter(z => z.isActive).map(z => z.id))
    );

    const totalTables     = computed(() => tables.value.filter(t => activeZoneIds.value.has(t.zoneId)).length);
    const availableTables = computed(() => tables.value.filter(t => activeZoneIds.value.has(t.zoneId) && t.status === TABLE_STATUS.AVAILABLE));
    const occupiedTables  = computed(() => tables.value.filter(t => activeZoneIds.value.has(t.zoneId) && t.status === TABLE_STATUS.OCCUPIED));
    const cleaningTables  = computed(() => tables.value.filter(t => activeZoneIds.value.has(t.zoneId) && t.status === TABLE_STATUS.CLEANING));

    // zones → solo activas (floor tab, POS selectors, create-table dropdown)
    const zones = computed(() => {
        const countMap = {};
        tables.value.forEach(t => { countMap[t.zoneId] = (countMap[t.zoneId] ?? 0) + 1; });
        return zonesData.value
            .filter(z => z.isActive)
            .map(z => new Zone({ ...z, tableCount: countMap[z.id] ?? 0 }));
    });

    // allZones → todas las zonas (management tab, zoneColorMap)
    const allZones = computed(() => {
        const countMap = {};
        tables.value.forEach(t => { countMap[t.zoneId] = (countMap[t.zoneId] ?? 0) + 1; });
        return zonesData.value.map(z => new Zone({ ...z, tableCount: countMap[z.id] ?? 0 }));
    });

    const occupancyRate  = computed(() =>
        totalTables.value > 0
            ? Math.round((occupiedTables.value.length / totalTables.value) * 100)
            : 0
    );

    const filteredTables = computed(() => {
        const base = tables.value.filter(t => activeZoneIds.value.has(t.zoneId));
        return selectedZoneId.value === null
            ? base
            : base.filter(t => t.zoneId === selectedZoneId.value);
    });

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            if (import.meta.env.VITE_USE_MOCK === 'true') {
                // Solo cargar mock data la primera vez; las mutaciones locales son fuente de verdad
                if (zonesData.value.length === 0) {
                    const branchId = localStorage.getItem('gs_branch_id');
                    zonesData.value = branchId ? MOCK_ZONES.filter(z => z.sucursalId === branchId) : [...MOCK_ZONES];
                    tables.value    = branchId ? MOCK_TABLES.filter(t => t.sucursalId === branchId) : [...MOCK_TABLES];
                }
                return;
            }
            const [tablesResp, zonesResp] = await Promise.all([
                api.getAll(),
                api.getZones(),
            ]);
            zonesData.value = ZoneAssembler.toEntitiesFromResponse(zonesResp);
            tables.value    = TableAssembler.toEntitiesFromResponse(tablesResp);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar las mesas';
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchById(id) {
        if (_isMock) return;
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.getById(id);
            selectedTable.value = TableAssembler.toEntityFromResource(response.data?.data ?? response.data);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar la mesa';
        } finally {
            isLoading.value = false;
        }
    }

    async function create(tableData) {
        const zone = zonesData.value.find(z => z.id === tableData.zoneId);
        const optimisticId = Math.max(0, ...tables.value.map(t => t.id)) + 1;
        tables.value.push(new Table({
            ...tableData,
            id:            optimisticId,
            zone:          zone?.name ?? '',
            seatedGuests:  0,
            occupiedSince: null,
        }));
        if (_isMock) return;
        try {
            const response = await api.create(TableAssembler.toResourceFromEntity(tableData));
            if (response.status === 201 || response.status === 200) {
                const saved = TableAssembler.toEntityFromResource(response.data?.data ?? response.data);
                if (saved?.id) {
                    const idx = tables.value.findIndex(t => t.id === optimisticId);
                    if (idx !== -1) tables.value.splice(idx, 1, new Table({ ...tables.value[idx], id: saved.id }));
                }
            }
        } catch { /* optimistic entry stays — will sync on next fetchAll */ }
    }

    async function update(id, tableData) {
        const zone = zonesData.value.find(z => z.id === tableData.zoneId);
        const snapshot = [...tables.value];
        tables.value = tables.value.map(t =>
            t.id === id
                ? new Table({ ...t, ...tableData, id, zone: zone?.name ?? t.zone })
                : t
        );
        if (_isMock) return;
        try {
            await api.update(id, TableAssembler.toResourceFromEntity(tableData));
        } catch {
            tables.value = snapshot;
        }
    }

    async function remove(id) {
        const snapshot = [...tables.value];
        tables.value = tables.value.filter(t => t.id !== id);
        if (_isMock) return;
        try {
            await api.delete(id);
        } catch {
            tables.value = snapshot;
        }
    }

    async function setTableStatus(id, status) {
        const table = tables.value.find(t => t.id === id);
        if (!table) return;
        const prevStatus = table.status;
        table.status = status;
        if (_isMock) return;
        try {
            await api.updateStatus(id, status);
        } catch {
            table.status = prevStatus;
        }
    }

    async function assignTable(tableId, seatedGuests) {
        const table = tables.value.find(t => t.id === tableId);
        if (!table) return;
        const prevStatus       = table.status;
        const prevGuests       = table.seatedGuests;
        const prevOccupiedSince = table.occupiedSince;
        table.status        = TABLE_STATUS.OCCUPIED;
        table.seatedGuests  = seatedGuests;
        table.occupiedSince = new Date();
        if (_isMock) return;
        try {
            await api.assign(tableId, { seatedGuests });
        } catch {
            table.status        = prevStatus;
            table.seatedGuests  = prevGuests;
            table.occupiedSince = prevOccupiedSince;
        }
    }

    /** Vincula una mesa con un orderId específico (llamado desde POS). */
    function setTableOrderId(tableId, orderId) {
        const table = tables.value.find(t => t.id === tableId);
        if (table) table.orderId = orderId;
    }

    async function freeTable(tableId) {
        const table = tables.value.find(t => t.id === tableId);
        if (!table) return;
        // Restaurant flow: OCCUPIED → CLEANING → (staff confirms) → AVAILABLE
        // Floor staff manually marks the table as available via the "Lista" button.
        const prevStatus        = table.status;
        const prevGuests        = table.seatedGuests;
        const prevOccupiedSince = table.occupiedSince;
        const prevReservationId = table.reservationId;
        table.status        = TABLE_STATUS.CLEANING;
        table.seatedGuests  = 0;
        table.occupiedSince = null;
        table.orderId       = null;
        if (_isMock) return;
        try {
            await api.free(tableId);
        } catch {
            table.status        = prevStatus;
            table.seatedGuests  = prevGuests;
            table.occupiedSince = prevOccupiedSince;
            table.reservationId = prevReservationId;
        }
    }

    /** Cancels a reservation, clearing status and reservationId atomically. */
    async function clearReservation(tableId) {
        const table = tables.value.find(t => t.id === tableId);
        if (!table) return;
        const prevStatus        = table.status;
        const prevReservationId = table.reservationId;
        table.status        = TABLE_STATUS.AVAILABLE;
        table.reservationId = null;
        if (_isMock) return;
        try {
            await api.updateStatus(tableId, TABLE_STATUS.AVAILABLE);
        } catch {
            table.status        = prevStatus;
            table.reservationId = prevReservationId;
        }
    }

    function selectZone(zoneId) {
        selectedZoneId.value = zoneId;
    }

    async function removeZone(zoneId) {
        const snapshotTables = [...tables.value];
        const snapshotZones  = [...zonesData.value];
        tables.value    = tables.value.filter(t => t.zoneId !== zoneId);
        zonesData.value = zonesData.value.filter(z => z.id !== zoneId);
        if (selectedZoneId.value === zoneId) selectedZoneId.value = null;
        if (_isMock) return;
        try {
            await api.deleteZone(zoneId);
        } catch {
            tables.value    = snapshotTables;
            zonesData.value = snapshotZones;
        }
    }

    async function updateZone(updatedZone) {
        const snapshotZones  = [...zonesData.value];
        const snapshotTables = [...tables.value];
        zonesData.value = zonesData.value.map(z =>
            z.id === updatedZone.id ? new Zone({ ...z, ...updatedZone }) : z
        );
        tables.value = tables.value.map(t =>
            t.zoneId === updatedZone.id
                ? new Table({ ...t, zone: updatedZone.name })
                : t
        );
        if (_isMock) return;
        try {
            await api.updateZone(updatedZone.id, ZoneAssembler.toResourceFromEntity(updatedZone));
        } catch {
            zonesData.value = snapshotZones;
            tables.value    = snapshotTables;
        }
    }

    async function createZone(newZone) {
        const optimisticId = Math.max(0, ...zonesData.value.map(z => z.id)) + 1;
        zonesData.value.push(new Zone({ id: optimisticId, name: newZone.name, color: newZone.color ?? '#3b82f6', description: newZone.description ?? '' }));
        if (_isMock) return;
        try {
            const response = await api.createZone(ZoneAssembler.toResourceFromEntity(newZone));
            if (response.status === 201 || response.status === 200) {
                const saved = ZoneAssembler.toEntityFromResource(response.data?.data ?? response.data);
                if (saved?.id) {
                    const idx = zonesData.value.findIndex(z => z.id === optimisticId);
                    if (idx !== -1) zonesData.value.splice(idx, 1, saved);
                }
            }
        } catch { /* optimistic entry stays */ }
    }

    return {
        tables, zonesData, selectedZoneId, isLoading, error,
        totalTables, availableTables, occupiedTables, cleaningTables,
        zones, allZones, filteredTables, occupancyRate,
        fetchAll, fetchById, create, update, remove, setTableStatus, assignTable, freeTable, clearReservation, selectZone, removeZone, updateZone, createZone, setTableOrderId,
    };
});
