<template>
  <div>
    <h2 class="text-2xl font-bold mb-2 text-color">Plataforma Metasoft</h2>
    <p class="text-color-secondary mb-4">
      Administración SaaS de Gastro Suite: planes globales, empresas cliente (restaurantes) y super admins SYSTEM.
      Los dueños de restaurante (OWNER) no acceden aquí; solo consultan su plan dentro de la app operativa.
    </p>
    <div class="grid">
      <div class="col-12 md:col-4">
        <RouterLink to="/platform/plans" class="block surface-card border-round-lg p-4 no-underline text-color">
          <div class="font-bold mb-1">Planes</div>
          <div class="text-sm text-color-secondary">Catálogo y límites</div>
        </RouterLink>
      </div>
      <div class="col-12 md:col-4">
        <RouterLink to="/platform/companies" class="block surface-card border-round-lg p-4 no-underline text-color">
          <div class="font-bold mb-1">Empresas</div>
          <div class="text-sm text-color-secondary">Asignar suscripción</div>
        </RouterLink>
      </div>
      <div class="col-12 md:col-4">
        <RouterLink to="/platform/admins" class="block surface-card border-round-lg p-4 no-underline text-color">
          <div class="font-bold mb-1">Super admins</div>
          <div class="text-sm text-color-secondary">Usuarios SYSTEM</div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
