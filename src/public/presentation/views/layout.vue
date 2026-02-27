<script setup>
import Sidebar from '../components/sidebar.vue'
import { menuItems } from './constants/layout.constants-ui.js'
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar fijo a la izquierda -->
    <sidebar :menu-items="menuItems" />

    <!-- Área de contenido: ocupa todo el espacio restante y permite scroll -->
    <main class="app-content">
      <router-view />
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
  min-width: 0;        /* evita overflow en contenedores flex */
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--bg-primary);
}
</style>