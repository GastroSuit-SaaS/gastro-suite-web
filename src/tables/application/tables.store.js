import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { TablesApi } from '../infrastructure/api/tables.api.js';
import { TableAssembler } from '../infrastructure/assemblers/table.assembler.js';

const api = new TablesApi();

export const useTablesStore = defineStore('tables', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const tables = ref([
        { id: 1,  number: 1,  capacity: 4, status: 'available', zoneId: 1, zone: 'Salón Principal' },
        { id: 2,  number: 2,  capacity: 2, status: 'occupied',  zoneId: 1, zone: 'Salón Principal' },
        { id: 3,  number: 3,  capacity: 6, status: 'available', zoneId: 1, zone: 'Salón Principal' },
        { id: 4,  number: 4,  capacity: 4, status: 'occupied',  zoneId: 1, zone: 'Salón Principal' },
        { id: 5,  number: 5,  capacity: 2, status: 'available', zoneId: 1, zone: 'Salón Principal' },
        { id: 6,  number: 6,  capacity: 4, status: 'occupied',  zoneId: 1, zone: 'Salón Principal' },
        { id: 7,  number: 7,  capacity: 4, status: 'available', zoneId: 2, zone: 'Terraza' },
        { id: 8,  number: 8,  capacity: 2, status: 'occupied',  zoneId: 2, zone: 'Terraza' },
        { id: 9,  number: 9,  capacity: 6, status: 'available', zoneId: 2, zone: 'Terraza' },
        { id: 10, number: 10, capacity: 4, status: 'occupied',  zoneId: 2, zone: 'Terraza' },
        { id: 11, number: 11, capacity: 8, status: 'available', zoneId: 3, zone: 'Privado' },
        { id: 12, number: 12, capacity: 4, status: 'cleaning',  zoneId: 3, zone: 'Privado' },
    ]);
    const selectedTable  = ref(null);
    const selectedZoneId = ref(null);
    const isLoading      = ref(false);
    const error          = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const totalTables     = computed(() => tables.value.length);
    const availableTables = computed(() => tables.value.filter(t => t.status === 'available'));
    const occupiedTables  = computed(() => tables.value.filter(t => t.status === 'occupied'));
    const cleaningTables  = computed(() => tables.value.filter(t => t.status === 'cleaning'));

    const zones = computed(() => {
        const map = {};
        tables.value.forEach(t => {
            if (!map[t.zoneId]) map[t.zoneId] = { id: t.zoneId, name: t.zone, count: 0 };
            map[t.zoneId].count++;
        });
        return Object.values(map);
    });

    const filteredTables = computed(() =>
        selectedZoneId.value === null
            ? tables.value
            : tables.value.filter(t => t.zoneId === selectedZoneId.value)
    );

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        // TODO: call api.getAll(), transform via TableAssembler.toEntitiesFromResponse
    }

    async function fetchById(id) {
        // TODO: call api.getById(id), transform via TableAssembler.toEntityFromResource
    }

    async function create(table) {
        // TODO: call api.create(table), refresh list
    }

    async function update(id, table) {
        // TODO: call api.update(id, table), update table in list
    }

    async function remove(id) {
        // TODO: call api.delete(id), refresh list
    }

    function selectZone(zoneId) {
        selectedZoneId.value = zoneId;
    }

    return {
        tables, selectedTable, selectedZoneId, isLoading, error,
        totalTables, availableTables, occupiedTables, cleaningTables,
        zones, filteredTables,
        fetchAll, fetchById, create, update, remove, selectZone,
    };
});
