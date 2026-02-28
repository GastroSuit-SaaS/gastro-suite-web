<script setup>
import { useRoute } from 'vue-router'
import Sidebar from '../components/sidebar.vue'
import Toolbar from '../components/toolbar.vue'
import { menuItems } from '../constants/layout.constants-ui.js'

const route = useRoute()
</script>

<template>
  <div class="app-layout">
    <sidebar :menu-items="menuItems" />
    <main class="app-content">
      <Toolbar
        :title="route.meta.titleModule || ''"
        :description="route.meta.description || ''"
        :show-back-button="route.meta.showBackButton ?? false"
      />
      <div class="content-area">
        <router-view />
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
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: whitesmoke;
}
</style>