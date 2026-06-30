<script setup>
import ModuleEmptyState from './module-empty-state.vue'

defineProps({
    loading:       { type: Boolean, default: false },
    isEmpty:       { type: Boolean, default: false },
    error:         { type: String,  default: null  },
    loadingLabel:  { type: String,  default: 'Cargando...' },
    emptyIcon:     { type: String,  default: 'pi-inbox' },
    emptyTitle:    { type: String,  default: 'Sin datos' },
    emptySubtitle: { type: String,  default: '' },
})

defineEmits(['retry'])
</script>

<template>
    <!-- ── Cargando ─────────────────────────────────────────────────── -->
    <div v-if="loading" class="gs-module-loading">
        <div class="gs-module-loading__inner">
            <pv-progress-spinner
                style="width:3rem;height:3rem"
                stroke-width="3"
                animation-duration=".9s"
            />
            <span class="gs-module-loading__label">{{ loadingLabel }}</span>
        </div>
    </div>

    <!-- ── Error ────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="gs-error-wrap">

        <div class="gs-error-banner">
            <i class="pi pi-exclamation-triangle gs-error-banner__icon"></i>
            <div class="gs-error-banner__body">
                <span class="gs-error-banner__title">Error al cargar</span>
                <span class="gs-error-banner__msg">{{ error }}</span>
            </div>
            <button class="gs-error-banner__retry" @click="$emit('retry')">
                <i class="pi pi-refresh"></i>
                Reintentar
            </button>
        </div>
    </div>

    <!-- ── Contenido ────────────────────────────────────────────────── -->
    <slot v-else-if="!isEmpty" />

    <!-- ── Vacío ────────────────────────────────────────────────────── -->
    <module-empty-state
        v-else
        :icon="emptyIcon"
        :title="emptyTitle"
        :subtitle="emptySubtitle"
        variant="plain"
    >
        <slot name="empty-actions" />
    </module-empty-state>
</template>

<style scoped>
/* ── Estado: cargando ─────────────────────────────────────────────────── */
.gs-module-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 260px;
    width: 100%;
    padding: 2rem;
}

.gs-module-loading__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.1rem;
}

.gs-module-loading__label {
    color: #9ca3af;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.02em;
}

/* ── Estado: error ────────────────────────────────────────────────────── */
.gs-error-wrap {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: 120px;
    padding: 1.5rem 1rem;
    width: 100%;
}

.gs-error-banner {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 1rem 1.25rem;
    background: var(--notify-error-bg, #fef2f2);
    border: 1px solid var(--notify-error-border, #fca5a5);
    border-left: 4px solid var(--notify-error-border, #ef4444);
    border-radius: 12px;
    max-width: 580px;
    width: 100%;
}

.gs-error-banner__icon {
    font-size: 1.3rem;
    color: #ef4444;
    flex-shrink: 0;
}

.gs-error-banner__body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
    min-width: 0;
}

.gs-error-banner__title {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--notify-error-title, #991b1b);
}

.gs-error-banner__msg {
    font-size: 0.82rem;
    color: var(--notify-error-detail, #b91c1c);
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
    line-height: 1.45;
}

.gs-error-banner__retry {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 1rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    background: #dc2626;
    color: #fff;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
}

.gs-error-banner__retry:hover {
    background: #b91c1c;
}
</style>
