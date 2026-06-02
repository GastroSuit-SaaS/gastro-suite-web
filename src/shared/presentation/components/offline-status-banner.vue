<script setup>
import { computed } from 'vue';
import { useNetworkStatus } from '../../composables/use-network-status.js';
import { outboxCount } from '../../infrustructure/offline/outbox-storage.js';
import { ref, onMounted, onUnmounted } from 'vue';

const { isOnline } = useNetworkStatus();
const pending = ref(outboxCount());

function refreshPending() {
    pending.value = outboxCount();
}

onMounted(() => {
    window.addEventListener('gastro:outbox-changed', refreshPending);
    window.addEventListener('gastro:network-online', refreshPending);
});
onUnmounted(() => {
    window.removeEventListener('gastro:outbox-changed', refreshPending);
    window.removeEventListener('gastro:network-online', refreshPending);
});

const message = computed(() => {
    if (isOnline.value && pending.value > 0) {
        return `Sincronizando ${pending.value} operación(es) pendiente(s)…`;
    }
    if (!isOnline.value) {
        const extra = pending.value > 0 ? ` · ${pending.value} en cola local` : '';
        return `Sin conexión: POS con menú/mesas en caché; comandas y pedidos se sincronizan al reconectar. Cobro requiere internet${extra}.`;
    }
    return '';
});

const visible = computed(() => !isOnline.value || pending.value > 0);
</script>

<template>
    <div v-if="visible" class="offline-banner" :class="{ 'offline-banner--offline': !isOnline }">
        <i :class="isOnline ? 'pi pi-sync' : 'pi pi-wifi'"></i>
        <span>{{ message }}</span>
    </div>
</template>

<style scoped>
.offline-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 1rem;
    font-size: 0.85rem;
    background: #fef3c7;
    color: #92400e;
    border-bottom: 1px solid #fcd34d;
}
.offline-banner--offline {
    background: #fee2e2;
    color: #991b1b;
    border-bottom-color: #fca5a5;
}
</style>
