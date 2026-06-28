<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { usePlatformStore } from '../../application/platform.store.js';

const store = usePlatformStore();

onMounted(() => {
    store.loadDashboard();
});
</script>

<template>
  <div class="platform-page module-page">
    <div class="platform-page__body">
      <pv-message v-if="store.error" severity="error">{{ store.error }}</pv-message>

      <div class="grid">
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="stat-card__label">Pendientes de validación</div>
            <div class="stat-card__value stat-card__value--warn">{{ store.dashboard?.pendingRequestsCount ?? '—' }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="stat-card__label">Activas</div>
            <div class="stat-card__value stat-card__value--success">{{ store.dashboard?.activeCompaniesCount ?? '—' }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="stat-card__label">En gracia</div>
            <div class="stat-card__value stat-card__value--grace">{{ store.dashboard?.graceCompaniesCount ?? '—' }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="stat-card__label">Vencidas</div>
            <div class="stat-card__value stat-card__value--danger">{{ store.dashboard?.expiredCompaniesCount ?? '—' }}</div>
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="col-12 md:col-4">
          <RouterLink to="/platform/requests" class="nav-card">
            <div class="nav-card__title">
              <i class="pi pi-inbox"></i>
              Solicitudes
            </div>
            <div class="nav-card__hint">Validar pagos y activar contratos</div>
          </RouterLink>
        </div>
        <div class="col-12 md:col-4">
          <RouterLink to="/platform/companies" class="nav-card">
            <div class="nav-card__title">
              <i class="pi pi-building"></i>
              Empresas
            </div>
            <div class="nav-card__hint">Estado de suscripción por restaurante</div>
          </RouterLink>
        </div>
        <div class="col-12 md:col-4">
          <RouterLink to="/platform/plans" class="nav-card">
            <div class="nav-card__title">
              <i class="pi pi-star"></i>
              Planes
            </div>
            <div class="nav-card__hint">Catálogo comercial y límites</div>
          </RouterLink>
        </div>
        <div class="col-12 md:col-4">
          <RouterLink to="/platform/audit" class="nav-card">
            <div class="nav-card__title">
              <i class="pi pi-history"></i>
              Auditoría
            </div>
            <div class="nav-card__hint">Quién hizo cada cambio en la plataforma</div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.platform-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.platform-page__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem 1.5rem;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.1rem 1.15rem;
  height: 100%;
}

.stat-card__label {
  font-size: 0.82rem;
  color: #6b7280;
  margin-bottom: 0.35rem;
}

.stat-card__value {
  font-size: 1.65rem;
  font-weight: 800;
  color: #111827;
}

.stat-card__value--warn { color: #ea580c; }
.stat-card__value--success { color: #059669; }
.stat-card__value--grace { color: #ca8a04; }
.stat-card__value--danger { color: #dc2626; }

.nav-card {
  display: block;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.1rem 1.15rem;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s, border-color 0.15s;
  height: 100%;
}

.nav-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}

.nav-card__title {
  font-weight: 700;
  margin-bottom: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #111827;
}

.nav-card__title i {
  color: var(--color-primary, #1a6bc2);
}

.nav-card__hint {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
