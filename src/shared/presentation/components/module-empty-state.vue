<script setup>
defineProps({
    icon: { type: String, default: 'pi-inbox' },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    /** card = borde y fondo; plain = solo contenido centrado (tabs, listados internos) */
    variant: {
        type: String,
        default: 'card',
        validator: (value) => ['card', 'plain'].includes(value),
    },
});
</script>

<template>
  <div :class="['gs-empty', variant === 'plain' && 'gs-empty--plain']">
    <i :class="['pi', icon, 'gs-empty__icon']"></i>
    <span class="gs-empty__title">{{ title }}</span>
    <span v-if="subtitle" class="gs-empty__sub">{{ subtitle }}</span>
    <slot />
  </div>
</template>

<style scoped>
.gs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 3rem 2rem;
  text-align: center;
  min-height: 220px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.gs-empty--plain {
  background: transparent;
  border: none;
  border-radius: 0;
  min-height: 180px;
  padding: 2rem 1rem;
}

.gs-empty__icon {
  font-size: 2.25rem;
  color: #d1d5db;
}

.gs-empty__title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.gs-empty__sub {
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 28rem;
  line-height: 1.45;
}
</style>
