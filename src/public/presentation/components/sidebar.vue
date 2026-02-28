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
  <nav class="sidebar flex flex-column h-full overflow-y-auto overflow-x-hidden">

    <!-- Brand / Logo -->
    <div class="flex align-items-center gap-2 px-3 py-4 border-bottom-1 brand-border">
      <i class="pi pi-shop brand-icon"></i>
      <span class="brand-name font-bold white-space-nowrap">GastroSuite</span>
    </div>

    <!-- Navigation -->
    <ul class="list-none m-0 py-2 flex-1">
      <li
        v-for="item in menuItems"
        :key="item.label"
        :class="['menu-item', { active: isActive(item.to) }]"
      >
        <RouterLink :to="item.to" class="menu-link flex align-items-center gap-3 mx-2 my-1 border-round" :title="item.title">
          <i :class="['menu-icon text-center', item.icon]"></i>
          <span class="white-space-nowrap overflow-hidden menu-label">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  width: 220px;
  min-width: 220px;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  user-select: none;
}

.brand-border { border-color: var(--border-color) !important; }
.brand-icon   { font-size: 1.35rem; color: var(--color-primary); }
.brand-name   { font-size: var(--font-size-base); color: var(--text-primary); letter-spacing: 0.02em; }

.menu-link {
  padding: 0.625rem 1rem;
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

.menu-item.active .menu-link {
  background-color: rgba(26, 107, 194, 0.15);
  color: var(--color-primary);
  border-left: 3px solid var(--color-primary);
  padding-left: calc(1rem - 3px);
  font-weight: var(--font-weight-semibold);
}

.menu-icon { font-size: 1rem; min-width: 1rem; }
.menu-label { text-overflow: ellipsis; }
</style>
