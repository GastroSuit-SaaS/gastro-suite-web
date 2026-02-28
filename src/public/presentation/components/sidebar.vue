<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIamStore } from '../../../iam/application/iam.store.js'

const props = defineProps({
  menuItems: {
    type: Array,
    required: true
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const route    = useRoute()
const router   = useRouter()
const iamStore = useIamStore()

const username = computed(() => iamStore.currentUser?.username || 'Usuario')
const userRole = computed(() => iamStore.currentUser?.roles?.[0] || 'Usuario')

const isActive = (path) => route.path.startsWith(path)

const handleSignOut = async () => {
  await iamStore.logout()
  router.push({ name: 'sign-in' })
}
</script>

<template>
  <nav :class="['sidebar flex flex-column h-full overflow-y-auto overflow-x-hidden', { 'sidebar--collapsed': collapsed }]">

    <!-- Brand / Logo -->
    <div
      :class="['flex align-items-center border-bottom-1 brand-border py-4',
               collapsed ? 'justify-content-center px-0' : 'gap-2 px-3']"
    >
      <i class="pi pi-shop brand-icon flex-shrink-0"></i>
      <span v-show="!collapsed" class="brand-name font-bold white-space-nowrap">GastroSuite</span>
    </div>

    <!-- Navigation -->
    <ul class="list-none m-0 py-2 flex-1">
      <li
        v-for="item in menuItems"
        :key="item.label"
        :class="['menu-item', { active: isActive(item.to) }]"
      >
        <RouterLink
          :to="item.to"
          :class="['menu-link flex align-items-center gap-3 mx-2 my-1 border-round',
                   { 'justify-content-center': collapsed }]"
          :title="item.label"
        >
          <i :class="['menu-icon text-center flex-shrink-0', item.icon]"></i>
          <span v-show="!collapsed" class="white-space-nowrap overflow-hidden menu-label">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>

    <!-- Usuario: solo visible en móvil dentro del drawer -->
    <div class="border-top-1 brand-border md:hidden">
      <!-- Expanded: avatar + info + logout -->
      <div v-if="!collapsed" class="flex align-items-center gap-2 px-3 py-3">
        <div class="user-avatar flex-shrink-0">
          <i class="pi pi-user"></i>
        </div>
        <div class="flex flex-column gap-1 flex-1 overflow-hidden">
          <span class="user-name white-space-nowrap overflow-hidden">{{ username }}</span>
          <span class="user-role white-space-nowrap overflow-hidden">{{ userRole }}</span>
        </div>
        <button class="logout-btn flex align-items-center justify-content-center border-round cursor-pointer flex-shrink-0" title="Cerrar sesión" @click="handleSignOut">
          <i class="pi pi-sign-out"></i>
        </button>
      </div>
      <!-- Collapsed (desktop only): just logout icon centered -->
      <div v-else class="hidden md:flex justify-content-center py-3">
        <button class="logout-btn flex align-items-center justify-content-center border-round cursor-pointer" title="Cerrar sesión" @click="handleSignOut">
          <i class="pi pi-sign-out"></i>
        </button>
      </div>
    </div>

    <!-- Toggle button: solo visible en desktop -->
    <div class="hidden md:flex justify-content-center py-3 border-top-1 brand-border">
      <button
        class="toggle-btn flex align-items-center justify-content-center border-round cursor-pointer"
        :title="collapsed ? 'Expandir menú' : 'Colapsar menú'"
        @click="emit('toggle')"
      >
        <i :class="['pi', collapsed ? 'pi-chevron-right' : 'pi-chevron-left']"></i>
      </button>
    </div>

  </nav>
</template>

<style scoped>
/* ── Sidebar container ────────────────────────────────────────── */
.sidebar {
  width: 220px;
  min-width: 220px;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  user-select: none;
  transition: width 0.25s ease, min-width 0.25s ease;
}

/* Desktop collapsed: icon-only strip */
.sidebar--collapsed {
  width: 60px;
  min-width: 60px;
}

/* Mobile: always full-width drawer, toggle via transform */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 1000;
    width: 220px !important;
    min-width: 220px !important;
    transform: translateX(0);
    transition: transform 0.25s ease;
  }
  .sidebar--collapsed {
    transform: translateX(-100%);
    width: 220px !important;
    min-width: 220px !important;
  }
}

/* ── Brand ────────────────────────────────────────────────────── */
.brand-border { border-color: var(--border-color) !important; }
.brand-icon   { font-size: 1.35rem; color: var(--color-primary); }
.brand-name   { font-size: var(--font-size-base); color: var(--text-primary); letter-spacing: 0.02em; }

/* ── Links ────────────────────────────────────────────────────── */
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

/* ── Active state ─────────────────────────────────────────────── */
.menu-item.active .menu-link {
  background-color: rgba(26, 107, 194, 0.15);
  color: var(--color-primary);
  border-left: 3px solid var(--color-primary);
  padding-left: calc(1rem - 3px);
  font-weight: var(--font-weight-semibold);
}

/* Remove border-left indicator when icon-only (would look off-center) */
.sidebar--collapsed .menu-item.active .menu-link {
  border-left: none;
  padding-left: 1rem;
}

/* ── Icons ────────────────────────────────────────────────────── */
.menu-icon  { font-size: 1rem; min-width: 1rem; }
.menu-label { text-overflow: ellipsis; }

/* ── User section ─────────────────────────────────────────────── */
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px rgba(26, 107, 194, 0.25);
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-overflow: ellipsis;
}

.user-role {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
}

/* ── Toggle button ────────────────────────────────────────────── */
.toggle-btn,
.logout-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.toggle-btn:hover,
.logout-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}
</style>
