import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { KitchenApi } from '../infrastructure/api/kitchen.api.js';
import { OrderAssembler } from '../infrastructure/assemblers/order.assembler.js';

const api = new KitchenApi();

export const useKitchenStore = defineStore('kitchen', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const orders        = ref([]);
    const selectedOrder = ref(null);
    const isLoading     = ref(false);
    const error         = ref(null);

    // ── Getters ───────────────────────────────────────────────────────────
    const pendingOrders = computed(() => orders.value.filter(o => o.status === 'pending'));

    // ── Actions ───────────────────────────────────────────────────────────
    async function fetchAll() {
        // TODO: call api.getAll(), transform via OrderAssembler.toEntitiesFromResponse
    }

    async function fetchById(id) {
        // TODO: call api.getById(id), transform via OrderAssembler.toEntityFromResource
    }

    async function create(order) {
        // TODO: call api.create(order), refresh list
    }

    async function update(id, order) {
        // TODO: call api.update(id, order), update order in list
    }

    async function remove(id) {
        // TODO: call api.delete(id), refresh list
    }

    return { orders, selectedOrder, isLoading, error, pendingOrders, fetchAll, fetchById, create, update, remove };
});
