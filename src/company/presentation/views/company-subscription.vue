<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useCompanyStore } from '../../application/company.store.js'
import {
    ACCESS_STATE_LABELS,
    BILLING_PERIOD_OPTIONS,
    COMPANY_MESSAGES,
    PLAN_FEATURES,
    PLAN_MARKETING,
    SUBSCRIPTION_TYPE_LABELS,
    USAGE_METRICS,
    isPlanFeatureEnabled,
} from '../constants/company.constants-ui.js'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'

const store = useCompanyStore()
const toast = useToast()

const billingPeriod = ref('MENSUAL')
const pageReady = ref(false)
const paymentDialogVisible = ref(false)
const selectedPlan = ref(null)
const paymentReference = ref('')
const ownerNotes = ref('')

const REQUEST_TYPE_LABELS = {
    NEW_CONTRACT: 'Nuevo contrato',
    RENEWAL: 'Renovación',
}

onMounted(async () => {
    await store.fetchSubscriptionSummary()
    if (store.availablePlans.length === 0) {
        await store.fetchAvailablePlans()
    }
    pageReady.value = true
})

async function reloadPage() {
    pageReady.value = false
    await store.fetchSubscriptionSummary()
    if (store.availablePlans.length === 0) {
        await store.fetchAvailablePlans()
    }
    pageReady.value = true
}

const summary = computed(() => store.subscriptionSummary)
const limits = computed(() => summary.value?.limits ?? null)
const features = computed(() => summary.value?.features ?? null)
const usage = computed(() => summary.value?.usage ?? null)
const currentPlanId = computed(() => summary.value?.subscriptionId ?? null)

const accessMeta = computed(() => {
    const state = summary.value?.accessState ?? 'NONE'
    return ACCESS_STATE_LABELS[state] ?? ACCESS_STATE_LABELS.NONE
})

const subscriptionTypeLabel = computed(() => {
    const type = summary.value?.subscriptionType
    return type ? (SUBSCRIPTION_TYPE_LABELS[type] ?? type) : '—'
})

const pageLoading = computed(() => !pageReady.value && !store.error)

const hasPendingRequest = computed(() => store.hasPendingRequest)

const contextAlert = computed(() => {
    if (hasPendingRequest.value) {
        return { severity: 'warn', text: COMPANY_MESSAGES.PENDING_REQUEST_BANNER }
    }
    if (store.inGracePeriod) {
        return { severity: 'warn', text: COMPANY_MESSAGES.GRACE_BANNER }
    }
    if (!store.hasSubscription) {
        return { severity: 'warn', text: COMPANY_MESSAGES.NO_SUBSCRIPTION }
    }
    if (summary.value?.accessState === 'ACTIVE') {
        return { severity: 'success', text: COMPANY_MESSAGES.SUBSCRIPTION_ACTIVE_BANNER }
    }
    return { severity: 'info', text: COMPANY_MESSAGES.SUBSCRIPTION_SELF_SERVICE_HINT }
})

function isRenewalFlow() {
    return store.hasSubscription && (store.inGracePeriod || summary.value?.accessState === 'EXPIRED')
}

function planActionLabel(plan) {
    if (isCurrentPlan(plan)) return 'Plan activo'
    if (hasPendingRequest.value) return 'Solicitud pendiente'
    return isRenewalFlow() ? 'Solicitar renovación' : 'Solicitar plan'
}

function formatDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function formatPrice(value) {
    const amount = Number(value ?? 0)
    return amount.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function planPrice(plan) {
    return billingPeriod.value === 'ANUAL'
        ? plan.subscriptionPriceAnnual
        : plan.subscriptionPriceMontly
}

function planPeriodLabel() {
    return billingPeriod.value === 'ANUAL' ? '/ año' : '/ mes'
}

function planTagline(name) {
    return PLAN_MARKETING[name] ?? 'Plan comercial Gastro Suite.'
}

function planFeatures(plan) {
    const mapped = {
        hasInventory: plan.subscriptionHasInventory,
        hasReports: plan.subscriptionHasReports,
        allowDailySalesReport: !plan.subscriptionHasReports,
        hasReservations: plan.subscriptionHasReservations,
        hasKitchen: plan.subscriptionHasKitchen,
        hasDashboardComparison: plan.subscriptionHasDashboardComparison,
        hasExcelExport: plan.subscriptionHasExcelExport,
        hasPushNotifications: plan.subscriptionHasPushNotifications,
    }
    return PLAN_FEATURES.filter((feature) => isPlanFeatureEnabled(feature.key, mapped))
}

function isCurrentPlan(plan) {
    return currentPlanId.value != null && plan.subscriptionId === currentPlanId.value
}

function usagePercent(used, max) {
    if (max == null || max <= 0) return 0
    return Math.min(100, Math.round((used / max) * 100))
}

function usageTone(used, max) {
    const pct = usagePercent(used, max)
    if (pct >= 90) return 'danger'
    if (pct >= 70) return 'warn'
    return 'success'
}

function metricUsage(metric) {
    return usage.value?.[metric.usageKey] ?? 0
}

function metricLimit(metric) {
    return limits.value?.[metric.limitKey] ?? 0
}

async function onChoosePlan(plan) {
    if (isCurrentPlan(plan) || hasPendingRequest.value) return

    selectedPlan.value = plan
    paymentReference.value = ''
    ownerNotes.value = ''
    paymentDialogVisible.value = true
}

async function submitPlanRequest() {
    const plan = selectedPlan.value
    if (!plan) return

    const ref = paymentReference.value?.trim()
    if (!ref) {
        toast.add({
            severity: 'warn',
            summary: 'Referencia requerida',
            detail: COMPANY_MESSAGES.PAYMENT_REFERENCE_HINT,
            life: 3500,
        })
        return
    }

    const renewal = isRenewalFlow()
    const result = await store.choosePlan(
        plan.subscriptionId,
        billingPeriod.value,
        ref,
        ownerNotes.value?.trim() ?? '',
    )
    if (result.ok) {
        paymentDialogVisible.value = false
        selectedPlan.value = null
        toast.add({
            severity: 'success',
            summary: renewal ? 'Renovación solicitada' : 'Solicitud enviada',
            detail: renewal ? COMPANY_MESSAGES.PLAN_RENEW_SUCCESS : COMPANY_MESSAGES.PLAN_CHOOSE_SUCCESS,
            life: 4500,
        })
        await store.fetchSubscriptionSummary()
    }
}
</script>

<template>
  <div class="plan-page">
    <module-state-feedback
      :loading="pageLoading"
      :error="store.error"
      :is-empty="false"
      loading-label="Cargando tu plan..."
      @retry="reloadPage()"
    >
      <template v-if="summary">
        <section class="plan-hero">
          <div class="plan-hero__main">
            <p class="plan-hero__eyebrow">Suscripción Gastro Suite</p>
            <h2 class="plan-hero__title">
              {{ summary.planName ?? 'Sin plan activo' }}
            </h2>
            <p class="plan-hero__meta">
              <span v-if="store.hasSubscription">
                {{ subscriptionTypeLabel }} · vence {{ formatDate(summary.endDate) }}
              </span>
              <span v-else>Elige un plan para habilitar módulos y límites de tu restaurante.</span>
            </p>
          </div>
          <pv-tag
            :value="accessMeta.label"
            :severity="accessMeta.severity"
            class="plan-hero__status"
          />
        </section>

        <pv-message
          :severity="contextAlert.severity"
          :closable="false"
          class="plan-alert"
        >
          {{ contextAlert.text }}
        </pv-message>

        <div
          v-if="hasPendingRequest && summary.pendingPlanName"
          class="surface-card pending-request-card"
        >
          <div class="pending-request-card__head">
            <i class="pi pi-clock"></i>
            <strong>{{ COMPANY_MESSAGES.PENDING_REQUEST_DETAIL }}</strong>
          </div>
          <p class="m-0">
            {{ summary.pendingPlanName }}
            <span v-if="summary.pendingRequestType">
              · {{ REQUEST_TYPE_LABELS[summary.pendingRequestType] ?? summary.pendingRequestType }}
            </span>
          </p>
          <p v-if="summary.pendingPaymentReference" class="pending-request-card__ref m-0">
            Ref. pago: {{ summary.pendingPaymentReference }}
          </p>
          <p v-if="summary.pendingSubmittedAt" class="pending-request-card__meta m-0">
            Enviada {{ formatDate(summary.pendingSubmittedAt) }}
          </p>
        </div>

        <div class="plan-layout">
          <aside class="plan-sidebar">
            <div class="surface-card plan-sidebar__card">
              <h3 class="section-title">Resumen</h3>
              <dl class="summary-dl">
                <div><dt>Periodicidad</dt><dd>{{ subscriptionTypeLabel }}</dd></div>
                <div><dt>Inicio</dt><dd>{{ formatDate(summary.startDate) }}</dd></div>
                <div><dt>Vencimiento</dt><dd>{{ formatDate(summary.endDate) }}</dd></div>
              </dl>

              <div v-if="features && store.hasSubscription" class="plan-sidebar__features">
                <p class="section-subtitle">Módulos activos</p>
                <div class="feature-tags">
                  <pv-tag
                    v-for="feature in PLAN_FEATURES.filter(f => isPlanFeatureEnabled(f.key, features))"
                    :key="feature.key"
                    :value="feature.label"
                    severity="success"
                  />
                </div>
              </div>
            </div>

            <div class="surface-card plan-sidebar__card">
              <h3 class="section-title">Uso vs límites</h3>
              <p class="section-hint">
                <template v-if="store.hasBranchSelected">
                  {{ COMPANY_MESSAGES.BRANCH_USAGE_HINT }}
                </template>
                <template v-else>
                  {{ COMPANY_MESSAGES.NO_BRANCH_SELECTED }}
                </template>
              </p>

              <div v-if="limits" class="usage-list">
                <div v-for="metric in USAGE_METRICS" :key="metric.key" class="usage-item">
                  <div class="usage-item__head">
                    <span>{{ metric.label }}</span>
                    <span>{{ metricUsage(metric) }} / {{ metricLimit(metric) }}</span>
                  </div>
                  <pv-progress-bar
                    :value="usagePercent(metricUsage(metric), metricLimit(metric))"
                    :show-value="false"
                    :class="`usage-bar--${usageTone(metricUsage(metric), metricLimit(metric))}`"
                  />
                </div>
              </div>
              <p v-else class="usage-empty">Activa un plan para ver límites y consumo.</p>
            </div>
          </aside>

          <section class="plan-catalog">
            <div class="catalog-head">
              <div>
                <h3 class="section-title">Planes disponibles</h3>
                <p class="section-hint">Precios referenciales sin IGV.</p>
              </div>
              <pv-select
                v-model="billingPeriod"
                :options="BILLING_PERIOD_OPTIONS"
                option-label="label"
                option-value="value"
                class="billing-select"
              />
            </div>

            <div v-if="store.plansError" class="plans-error">
              <i class="pi pi-exclamation-circle"></i>
              <div>
                <strong>No se pudieron cargar los planes</strong>
                <p>{{ store.plansError }}</p>
              </div>
              <pv-button label="Reintentar" size="small" outlined @click="store.fetchAvailablePlans()" />
            </div>

            <div v-if="store.isPlansLoading" class="plan-skeleton-grid">
              <div v-for="n in 4" :key="n" class="plan-skeleton"></div>
            </div>

            <div v-else-if="!store.plansError && store.availablePlans.length === 0" class="plans-empty surface-card">
              <i class="pi pi-box"></i>
              <p>{{ COMPANY_MESSAGES.NO_PLANS_CATALOG }}</p>
              <pv-button label="Recargar catálogo" size="small" outlined @click="reloadPage()" />
            </div>

            <div v-else class="plan-grid">
              <article
                v-for="plan in store.availablePlans"
                :key="plan.subscriptionId"
                :class="['plan-card', { 'plan-card--current': isCurrentPlan(plan) }]"
              >
                <div class="plan-card__head">
                  <div>
                    <h4 class="plan-card__name">{{ plan.subscriptionName }}</h4>
                    <p class="plan-card__tagline">{{ planTagline(plan.subscriptionName) }}</p>
                  </div>
                  <pv-tag v-if="isCurrentPlan(plan)" value="Actual" severity="success" />
                </div>

                <p class="plan-card__price">
                  S/ {{ formatPrice(planPrice(plan)) }}
                  <span>{{ planPeriodLabel() }}</span>
                </p>

                <ul class="plan-card__limits">
                  <li>{{ plan.subscriptionMaxBranches }} sucursales</li>
                  <li>{{ plan.subscriptionMaxUsers }} usuarios</li>
                  <li>{{ plan.subscriptionMaxTables }} mesas / sucursal</li>
                  <li>{{ plan.subscriptionMaxMenuItems }} platos / sucursal</li>
                </ul>

                <div class="plan-card__features">
                  <pv-tag
                    v-for="feature in planFeatures(plan)"
                    :key="feature.key"
                    :value="feature.label"
                    severity="secondary"
                  />
                </div>

                <pv-button
                  :label="planActionLabel(plan)"
                  :severity="isCurrentPlan(plan) ? 'secondary' : 'primary'"
                  :outlined="isCurrentPlan(plan)"
                  :disabled="isCurrentPlan(plan) || store.isChoosingPlan || hasPendingRequest"
                  :loading="store.isChoosingPlan && selectedPlan?.subscriptionId === plan.subscriptionId"
                  class="w-full plan-card__cta"
                  @click="onChoosePlan(plan)"
                />
              </article>
            </div>
          </section>
        </div>
      </template>
    </module-state-feedback>

    <pv-dialog
      v-model:visible="paymentDialogVisible"
      :header="isRenewalFlow() ? 'Solicitar renovación' : 'Solicitar plan'"
      modal
      :style="{ width: 'min(28rem, 95vw)' }"
    >
      <div v-if="selectedPlan" class="flex flex-column gap-3">
        <p class="m-0 text-sm text-color-secondary">
          {{ selectedPlan.subscriptionName }} · S/ {{ formatPrice(planPrice(selectedPlan)) }}{{ planPeriodLabel() }}
        </p>
        <p class="m-0 text-sm">
          Realiza el pago acordado con Metasoft y registra la referencia. Un super admin validará manualmente antes de
          {{ isRenewalFlow() ? 'extender' : 'activar' }} tu suscripción.
        </p>
        <div class="flex flex-column gap-1">
          <label class="font-semibold text-sm">{{ COMPANY_MESSAGES.PAYMENT_REFERENCE_LABEL }}</label>
          <pv-input-text
            v-model="paymentReference"
            class="w-full"
            :placeholder="COMPANY_MESSAGES.PAYMENT_REFERENCE_HINT"
            maxlength="120"
          />
        </div>
        <div class="flex flex-column gap-1">
          <label class="font-semibold text-sm">{{ COMPANY_MESSAGES.OWNER_NOTES_LABEL }}</label>
          <pv-textarea v-model="ownerNotes" rows="3" class="w-full" auto-resize maxlength="500" />
        </div>
        <div class="flex gap-2 justify-content-end">
          <pv-button label="Cancelar" severity="secondary" text @click="paymentDialogVisible = false" />
          <pv-button
            :label="isRenewalFlow() ? 'Enviar renovación' : 'Enviar solicitud'"
            :loading="store.isChoosingPlan"
            @click="submitPlanRequest"
          />
        </div>
      </div>
    </pv-dialog>
  </div>
</template>

<style scoped>
.plan-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2rem;
}

.plan-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 55%, #ffffff 100%);
  border: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.plan-hero__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6366f1;
}

.plan-hero__title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  color: #111827;
}

.plan-hero__meta {
  margin: 0.45rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.plan-hero__status {
  flex-shrink: 0;
}

.plan-alert {
  margin-bottom: 1.25rem;
}

.pending-request-card {
  margin-bottom: 1.25rem;
  padding: 1rem 1.15rem;
  border-color: #fcd34d;
  background: #fffbeb;
}

.pending-request-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  color: #92400e;
}

.pending-request-card__head i {
  font-size: 1.1rem;
}

.pending-request-card__ref,
.pending-request-card__meta {
  margin-top: 0.35rem !important;
  font-size: 0.85rem;
  color: #78716c;
}

.plan-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.plan-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-sidebar__card,
.surface-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.1rem 1.15rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 700;
}

.section-subtitle,
.section-hint {
  margin: 0 0 0.65rem;
  font-size: 0.82rem;
  color: #6b7280;
}

.summary-dl {
  display: grid;
  gap: 0.65rem;
  margin: 0;
}

.summary-dl div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.summary-dl dt {
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

.summary-dl dd {
  margin: 0;
  font-weight: 600;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.usage-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.usage-item__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.84rem;
  font-weight: 600;
}

.usage-empty {
  margin: 0;
  font-size: 0.84rem;
  color: #6b7280;
}

.usage-bar--danger :deep(.p-progressbar-value) { background: #dc2626; }
.usage-bar--warn :deep(.p-progressbar-value) { background: #f59e0b; }
.usage-bar--success :deep(.p-progressbar-value) { background: #059669; }

.plan-catalog {
  min-width: 0;
}

.catalog-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.billing-select {
  min-width: 140px;
}

.plans-error {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.85rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  margin-bottom: 1rem;
}

.plans-error i {
  color: #dc2626;
  font-size: 1.2rem;
  margin-top: 0.15rem;
}

.plans-error strong {
  display: block;
  margin-bottom: 0.25rem;
}

.plans-error p {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: #991b1b;
}

.plans-empty {
  text-align: center;
  padding: 2.5rem 1.5rem;
  color: #6b7280;
}

.plans-empty i {
  font-size: 2rem;
  color: #cbd5e1;
  margin-bottom: 0.75rem;
}

.plan-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.plan-skeleton {
  height: 320px;
  border-radius: 1rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
}

.plan-card {
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.plan-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.plan-card--current {
  border-color: #059669;
  box-shadow: 0 0 0 1px #059669 inset;
}

.plan-card__head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.plan-card__name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.plan-card__tagline {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: #6b7280;
  line-height: 1.4;
}

.plan-card__price {
  margin: 1rem 0 0.75rem;
  font-size: 1.45rem;
  font-weight: 800;
  color: #111827;
}

.plan-card__price span {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
}

.plan-card__limits {
  margin: 0 0 0.75rem;
  padding-left: 1.1rem;
  color: #374151;
  font-size: 0.84rem;
  line-height: 1.5;
}

.plan-card__features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-height: 2.5rem;
  flex: 1;
}

.plan-card__cta {
  margin-top: 0.85rem;
}

@media (max-width: 960px) {
  .plan-layout {
    grid-template-columns: 1fr;
  }
}
</style>
