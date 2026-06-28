<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { useIamStore } from '../../../iam/application/iam.store.js';

const iamStore = useIamStore();

function signOut() {
    iamStore.logout();
}
</script>

<template>
  <div class="min-h-screen bg-surface">
    <header class="surface-section border-bottom-1 surface-border px-4 py-3 flex align-items-center justify-content-between gap-3 flex-wrap">
      <div>
        <div class="font-bold text-lg text-color">Gastro Suite Platform</div>
        <div class="text-sm text-color-secondary">Administración SaaS</div>
      </div>
      <nav class="flex gap-3 flex-wrap align-items-center">
        <RouterLink to="/platform" class="text-primary no-underline">Inicio</RouterLink>
        <RouterLink to="/platform/plans" class="text-primary no-underline">Planes</RouterLink>
        <RouterLink to="/platform/companies" class="text-primary no-underline">Empresas</RouterLink>
        <RouterLink to="/platform/admins" class="text-primary no-underline">Admins</RouterLink>
        <pv-button label="Salir" severity="secondary" size="small" @click="signOut" />
      </nav>
    </header>
    <main class="p-4">
      <RouterView />
    </main>
  </div>
</template>
