<script setup>
import { ref, onMounted } from 'vue'
import { useCompanyStore } from '../../application/company.store.js'
import { COMPANY_MESSAGES } from '../constants/company.constants-ui.js'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'
import { useNotification } from '../../../shared/presentation/composables/use-notification.js'

const store = useCompanyStore()
const { showSuccess, showError } = useNotification()

const isEditing = ref(false)

const form = ref({
    companyTradeName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    isActive: true,
})

function syncFormFromCompany() {
    if (!store.company) return
    form.value = {
        companyTradeName: store.company.companyTradeName ?? '',
        companyAddress: store.company.companyAddress ?? '',
        companyPhone: store.company.companyPhone ?? '',
        companyEmail: store.company.companyEmail ?? '',
        isActive: store.company.isActive ?? true,
    }
}

onMounted(async () => {
    await store.fetchCompany()
    syncFormFromCompany()
})

function startEdit() {
    syncFormFromCompany()
    isEditing.value = true
}

function cancelEdit() {
    syncFormFromCompany()
    isEditing.value = false
    store.error = null
}

async function onSubmit() {
    const result = await store.updateCompany({
        companyTradeName: form.value.companyTradeName?.trim() || null,
        companyAddress: form.value.companyAddress?.trim() || null,
        companyPhone: form.value.companyPhone?.trim() || null,
        companyEmail: form.value.companyEmail?.trim() || null,
        isActive: form.value.isActive,
    })
    if (result.ok) {
        isEditing.value = false
        showSuccess(COMPANY_MESSAGES.SAVE_SUCCESS)
    } else {
        showError(result.message ?? store.error)
    }
}
</script>

<template>
  <div class="company-page p-4 md:p-6">
    <module-state-feedback
      :loading="store.isLoading"
      :error="store.error"
      :is-empty="!store.isLoading && !store.company && !store.error"
      empty-title="No se encontraron datos de la empresa."
      @retry="store.fetchCompany()"
    />

    <template v-if="store.company">
      <div class="grid">
        <div class="col-12 lg:col-4">
          <div class="surface-card identity-card p-4 border-round-xl h-full">
            <div class="identity-card__icon">
              <i class="pi pi-building"></i>
            </div>
            <h3 class="identity-card__title">{{ store.company.companyTradeName || store.company.companyName }}</h3>
            <p class="identity-card__subtitle">{{ store.company.companyName }}</p>

            <dl class="identity-dl">
              <div>
                <dt>RUC</dt>
                <dd>{{ store.company.companyRuc }}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <pv-tag
                    :value="store.company.isActive ? 'Activa' : 'Inactiva'"
                    :severity="store.company.isActive ? 'success' : 'secondary'"
                  />
                </dd>
              </div>
            </dl>

            <pv-message severity="info" :closable="false" class="mt-3">
              {{ COMPANY_MESSAGES.IDENTITY_READONLY }}
            </pv-message>
          </div>
        </div>

        <div class="col-12 lg:col-8">
          <div class="surface-card p-4 md:p-5 border-round-xl">
            <div class="section-head">
              <div>
                <h3 class="m-0 text-lg font-semibold">{{ COMPANY_MESSAGES.EDIT_SECTION_TITLE }}</h3>
                <p class="m-0 mt-1 text-sm text-color-secondary">
                  {{ COMPANY_MESSAGES.EDIT_SECTION_HINT }}
                </p>
              </div>
              <div class="section-head__actions">
                <pv-button
                  v-if="!isEditing"
                  label="Editar"
                  icon="pi pi-pencil"
                  severity="secondary"
                  outlined
                  @click="startEdit"
                />
                <template v-else>
                  <pv-button
                    label="Cancelar"
                    severity="secondary"
                    text
                    @click="cancelEdit"
                  />
                  <pv-button
                    label="Guardar cambios"
                    icon="pi pi-check"
                    :loading="store.isSaving"
                    @click="onSubmit"
                  />
                </template>
              </div>
            </div>

            <div class="grid formgrid p-fluid mt-3">
              <div class="field col-12 md:col-6">
                <label for="tradeName">Nombre comercial</label>
                <pv-input-text
                  id="tradeName"
                  v-model="form.companyTradeName"
                  :disabled="!isEditing"
                  placeholder="Nombre visible para el equipo"
                />
              </div>
              <div class="field col-12 md:col-6">
                <label for="phone">Teléfono</label>
                <pv-input-text
                  id="phone"
                  v-model="form.companyPhone"
                  :disabled="!isEditing"
                  placeholder="Ej. 999 888 777"
                />
              </div>
              <div class="field col-12 md:col-6">
                <label for="email">Email de contacto</label>
                <pv-input-text
                  id="email"
                  v-model="form.companyEmail"
                  type="email"
                  :disabled="!isEditing"
                  placeholder="contacto@restaurante.com"
                />
              </div>
              <div class="field col-12">
                <label for="address">Dirección</label>
                <pv-textarea
                  id="address"
                  v-model="form.companyAddress"
                  rows="3"
                  auto-resize
                  :disabled="!isEditing"
                  placeholder="Dirección fiscal o de operación"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.company-page {
  max-width: 1100px;
  margin: 0 auto;
}

.surface-card {
  border: 1px solid var(--surface-border, #e5e7eb);
  background: #fff;
}

.identity-card {
  display: flex;
  flex-direction: column;
}

.identity-card__icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.85rem;
  display: grid;
  place-items: center;
  background: #eef2ff;
  color: #4338ca;
  font-size: 1.25rem;
  margin-bottom: 0.85rem;
}

.identity-card__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}

.identity-card__subtitle {
  margin: 0.35rem 0 1rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.identity-dl {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.identity-dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.identity-dl dt {
  margin: 0;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.identity-dl dd {
  margin: 0;
  font-weight: 600;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-head__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.field label {
  display: block;
  margin-bottom: 0.45rem;
  font-weight: 600;
  color: #374151;
}

.field :deep(.p-inputtext),
.field :deep(.p-textarea) {
  width: 100%;
}
</style>
