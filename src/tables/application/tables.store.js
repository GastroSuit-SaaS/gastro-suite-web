import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { TablesApi } from '../infrastructure/api/tables.api.js';
import { TableAssembler } from '../infrastructure/assemblers/table.assembler.js';

const api = new TablesApi();

export const useTablesStore = defineStore('tables', () => {

    // ── State ─────────────────────────────────────────────────────────────
    // Metadata de zonas (nombre, color, descripción) separada del conteo de mesas
    const zonesData = ref([
        { id: 1, name: 'Salón Principal', color: '#3b82f6', description: '' },
        { id: 2, name: 'Terraza',         color: '#10b981', description: '' },
        { id: 3, name: 'Privado',         color: '#f59e0b', description: '' },
    ]);

    const tables = ref([
        { id: 1,  number: 1,  capacity: 4, status: 'available', zoneId: 1, zone: 'Salón Principal', seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
        { id: 2,  number: 2,  capacity: 2, status: 'occupied',  zoneId: 1, zone: 'Salón Principal', seatedGuests: 2,  orderId: 1201,  orderAmount: 48.50,  occupiedSince: new Date(Date.now() - 45 * 60000) },
        { id: 3,  number: 3,  capacity: 6, status: 'available', zoneId: 1, zone: 'Salón Principal', seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
        { id: 4,  number: 4,  capacity: 4, status: 'occupied',  zoneId: 1, zone: 'Salón Principal', seatedGuests: 3,  orderId: 1215,  orderAmount: 120.00, occupiedSince: new Date(Date.now() - 72 * 60000) },
        { id: 5,  number: 5,  capacity: 2, status: 'available', zoneId: 1, zone: 'Salón Principal', seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
        { id: 6,  number: 6,  capacity: 4, status: 'cleaning',  zoneId: 1, zone: 'Salón Principal', seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
        { id: 7,  number: 7,  capacity: 4, status: 'available', zoneId: 2, zone: 'Terraza',          seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
        { id: 8,  number: 8,  capacity: 4, status: 'occupied',  zoneId: 2, zone: 'Terraza',          seatedGuests: 2,  orderId: 1246,  orderAmount: 95.00,  occupiedSince: new Date(Date.now() - 38 * 60000) },
        { id: 9,  number: 9,  capacity: 6, status: 'available', zoneId: 2, zone: 'Terraza',          seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
        { id: 10, number: 10, capacity: 2, status: 'available', zoneId: 2, zone: 'Terraza',          seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
        { id: 11, number: 11, capacity: 8, status: 'available', zoneId: 3, zone: 'Privado',          seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
        { id: 12, number: 12, capacity: 4, status: 'cleaning',  zoneId: 3, zone: 'Privado',          seatedGuests: 0,  orderId: null,  orderAmount: 0,     occupiedSince: null },
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
        const countMap = {};
        tables.value.forEach(t => {
            countMap[t.zoneId] = (countMap[t.zoneId] ?? 0) + 1;
        });
        return zonesData.value.map(z => ({
            ...z,
            count: countMap[z.id] ?? 0,
        }));
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
        tables.value = tables.value.filter(t => t.id !== id);
        // TODO: call api.delete(id)
    }

    function setTableStatus(id, status) {
        const table = tables.value.find(t => t.id === id);
        if (table) table.status = status;
        // TODO: call api.updateStatus(id, status)
    }

    function selectZone(zoneId) {
        selectedZoneId.value = zoneId;
    }

    function removeZone(zoneId) {
        tables.value  = tables.value.filter(t => t.zoneId !== zoneId);
        zonesData.value = zonesData.value.filter(z => z.id !== zoneId);
        if (selectedZoneId.value === zoneId) selectedZoneId.value = null;
        // TODO: call api.deleteZone(zoneId)
    }

    function updateZone(updatedZone) {
        // Actualiza metadata de la zona
        zonesData.value = zonesData.value.map(z =>
            z.id === updatedZone.id ? { ...z, ...updatedZone } : z
        );
        // Actualiza el nombre en las mesas que pertenecen a esta zona
        tables.value = tables.value.map(t =>
            t.zoneId === updatedZone.id
                ? { ...t, zone: updatedZone.name }
                : t
        );
        // TODO: call api.updateZone(updatedZone)
    }

    function createZone(newZone) {
        const id = Math.max(0, ...zonesData.value.map(z => z.id)) + 1;
        zonesData.value.push({ id, name: newZone.name, color: newZone.color ?? '#3b82f6', description: newZone.description ?? '' });
        // TODO: call api.createZone(newZone)
    }

    return {
        tables, zonesData, selectedTable, selectedZoneId, isLoading, error,
        totalTables, availableTables, occupiedTables, cleaningTables,
        zones, filteredTables,
        fetchAll, fetchById, create, update, remove, setTableStatus, selectZone, removeZone, updateZone, createZone,
    };
});
