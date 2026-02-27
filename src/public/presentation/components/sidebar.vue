<script setup>
import { useRoute } from 'vue-router'

const props = defineProps({
  menuItems: {
    type: Array,
    required: true
  }
})

const route = useRoute()

const isActive = (path) => route.path.startsWith(path)
</script>

<template>
  <nav class="sidebar">
    <!-- Brand / Logo -->
    <div class="sidebar-brand">
      <i class="pi pi-shop brand-icon"></i>
      <span class="brand-name">GastroSuite</span>
    </div>

    <!-- Navigation -->
    <ul class="menu-list">
      <li
        v-for="item in menuItems"
        :key="item.label"
        :class="['menu-item', { active: isActive(item.to) }]"
      >
        <RouterLink :to="item.to" class="menu-link" :title="item.title">
          <i :class="['menu-icon', item.icon]"></i>
          <span class="menu-label">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* ── Sidebar container ────────────────────────────────────────── */
.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  min-width: 220px;
  height: 100%;
  background-color: var(--bg-surface);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  overflow-x: hidden;
  user-select: none;
}

/* ── Brand area ───────────────────────────────────────────────── */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.brand-icon {
  font-size: 1.35rem;
  color: var(--color-primary);
}

.brand-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* ── Menu list ────────────────────────────────────────────────── */
.menu-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
  flex: 1;
}

/* ── Menu item / link ─────────────────────────────────────────── */
.menu-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  margin: 0.125rem 0.5rem;
  border-radius: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.menu-link:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* ── Active state ─────────────────────────────────────────────── */
.menu-item.active .menu-link {
  background-color: rgba(26, 107, 194, 0.15);
  color: var(--color-primary);
  border-left: 3px solid var(--color-primary);
  padding-left: calc(1rem - 3px);
  font-weight: var(--font-weight-semibold);
}

/* ── Icons ────────────────────────────────────────────────────── */
.menu-icon {
  font-size: 1rem;
  min-width: 1rem;
  text-align: center;
}

.menu-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
