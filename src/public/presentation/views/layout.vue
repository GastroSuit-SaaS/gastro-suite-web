<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { clearToolbarContext } from '../../../shared/composables/use-toolbar-context.js'
import Sidebar from '../components/sidebar.vue'
import Toolbar from '../components/toolbar.vue'
import { getMenuItemsByRole } from '../constants/layout.constants-ui.js'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useOperationalBootstrap } from '../../../shared/composables/use-operational-bootstrap.js'
import { useOperationalSocket } from '../../../shared/composables/use-operational-socket.js'
import CashRegisterStatusBanner from '../../../shared/presentation/components/cash-register-status-banner.vue'
import EmployeeLinkStatusBanner from '../../../shared/presentation/components/employee-link-status-banner.vue'
import LowStockStatusBanner from '../../../shared/presentation/components/low-stock-status-banner.vue'
import OfflineStatusBanner from '../../../shared/presentation/components/offline-status-banner.vue'
import SubscriptionGraceBanner from '../../../shared/presentation/components/subscription-grace-banner.vue'
import NotificationsBell from '../../../communication/presentation/components/notifications-bell.vue'
import { useNotificationsBootstrap } from '../../../shared/composables/use-notifications-bootstrap.js'
import { useCompanyStore } from '../../../company/application/company.store.js'
import { ROLES } from '../../../shared/presentation/constants/roles.constants.js'

useOperationalBootstrap()
useOperationalSocket()
useNotificationsBootstrap()

const route    = useRoute()
const iamStore = useIamStore()
const companyStore = useCompanyStore()
const collapsed = ref(window.innerWidth < 768)
const toggleSidebar = () => { collapsed.value = !collapsed.value }

const filteredMenuItems = computed(() =>
    getMenuItemsByRole(
        iamStore.userRole,
        iamStore.hasBranchSelected,
        companyStore.features,
        companyStore.subscriptionSummary,
    ),
)

/** Rutas que fijan el viewport: paneles internos con scroll (POS). */
const isPosFullscreenLayout = computed(() =>
  route.name === 'pos-order'
  || route.name === 'pos-payment'
)

watch(() => route.fullPath, () => {
  clearToolbarContext()
})

watch(
  () => [iamStore.isAuthenticated, iamStore.userRole, iamStore.companyId],
  ([authenticated, role]) => {
    if (authenticated && role && role !== ROLES.SYSTEM) {
      companyStore.fetchSubscriptionSummary()
    }
  },
  { immediate: true },
)

watch(
  () => iamStore.isAuthenticated,
  (authenticated) => {
    if (authenticated) iamStore.loadRolesCatalog()
  },
  { immediate: true },
)
</script>

<template>
  <div class="app-layout">

    <!-- Overlay oscuro para móvil cuando sidebar está abierto -->
    <transition name="fade">
      <div v-if="!collapsed" class="sidebar-overlay" @click="toggleSidebar" />
    </transition>

    <sidebar :menu-items="filteredMenuItems" :collapsed="collapsed" @toggle="toggleSidebar" />

    <main class="app-content">
      <Toolbar
        :title="route.meta.titleModule || ''"
        :description="route.meta.description || ''"
        :show-back-button="route.meta.showBackButton ?? false"
        :back-route="route.meta.backRoute ?? null"
        :back-label="route.meta.backLabel ?? ''"
      >
        <!-- Botón hamburguesa: solo visible en móvil para abrir el drawer -->
        <template #actions>
          <pv-button
            icon="pi pi-bars"
            text
            rounded
            class="block md:hidden"
            aria-label="Abrir menú"
            @click="toggleSidebar"
          />
        </template>
      </Toolbar>
      <div class="content-area" :class="{ 'content-area--pos-fullscreen': isPosFullscreenLayout }">
        <div class="content-area__inner" :class="{ 'content-area__inner--pos-fullscreen': isPosFullscreenLayout }">
          <employee-link-status-banner />
          <subscription-grace-banner />
          <cash-register-status-banner />
          <low-stock-status-banner />
          <offline-status-banner />
          <router-view :key="iamStore.activeBranchId ?? 'global'" />
        </div>
      </div>
    </main>

  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.app-content {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top-left-radius: 1.25rem;
  border-bottom-left-radius: 1.25rem;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: whitesmoke;
}

.content-area__inner {
  padding: 0;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.content-area--pos-fullscreen {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-area__inner--pos-fullscreen {
  flex: 1;
  min-height: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area__inner--pos-fullscreen > :not(:last-child) {
  flex-shrink: 0;
}

.content-area__inner--pos-fullscreen :deep(.pos-order-layout),
.content-area__inner--pos-fullscreen :deep(.payment-layout) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Overlay — solo visible en móvil */
.sidebar-overlay {
  display: none;
}

@media (max-width: 767px) {
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }
</style>