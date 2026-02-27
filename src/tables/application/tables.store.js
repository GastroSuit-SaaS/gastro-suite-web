import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { TablesApi } from '../infrastructure/api/tables.api.js';
import { TableAssembler } from '../infrastructure/assemblers/table.assembler.js';

const api = new TablesApi();

export const useTablesStore = defineStore('tables', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const tables        = ref([]);
    const selectedTable = ref(null);
    const isLoading     = ref(false);
    const error         = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const availableTables = computed(() => tables.value.filter(t => t.status === 'available'));

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

    return { tables, selectedTable, isLoading, error, availableTables, fetchAll, fetchById, create, update, remove };
});
