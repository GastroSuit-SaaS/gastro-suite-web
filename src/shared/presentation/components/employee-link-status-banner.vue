<script setup>
import { computed, ref } from 'vue'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { requiresBranch } from '../constants/roles.constants.js'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

const iamStore = useIamStore()
const route = useRoute()
const toast = useToast()
const linking = ref(false)

const isReportsRoute = computed(() => route.path.startsWith('/reports'))

const isOperationalRoute = computed(() =>
    requiresBranch(route.path)
    || route.path.startsWith('/dashboard')
    || route.path.startsWith('/pos'),
)

const visible = computed(() => {
    if (!iamStore.isAuthenticated) return false
    if (iamStore.employeeLinkStatus === 'missing_company' || iamStore.employeeLinkStatus === 'error') {
        return isOperationalRoute.value || isReportsRoute.value
    }
    if (!iamStore.hasEmployeeLink && (isOperationalRoute.value || isReportsRoute.value)) {
        return true
    }
    return false
})

const bannerMessage = computed(() => {
    if (iamStore.employeeLinkStatus === 'missing_company' || iamStore.employeeLinkStatus === 'error') {
        return iamStore.employeeLinkMessage
    }
    if (!iamStore.hasEmployeeLink) {
        return 'Tu usuario no está vinculado a un empleado. Cobros, caja y reportes pueden fallar hasta completar el vínculo.'
    }
    return ''
})

const severity = computed(() => {
    if (iamStore.employeeLinkStatus === 'error') return 'error'
    return 'warn'
})

const showLinkAction = computed(() =>
    visible.value
    && !iamStore.hasEmployeeLink
    && iamStore.employeeLinkStatus !== 'missing_company'
    && iamStore.employeeLinkStatus !== 'error',
)

async function linkEmployeeNow() {
    linking.value = true
    try {
        const result = await iamStore.ensureEmployeeLink()
        if (result.ok) {
            toast.add({
                severity: 'success',
                summary: 'Vínculo completado',
                detail: 'Tu perfil de empleado quedó asociado a tu usuario.',
                life: 4000,
            })
        } else if (result.reason === 'missing_company') {
            toast.add({
                severity: 'warn',
                summary: 'Empresa requerida',
                detail: iamStore.employeeLinkMessage ?? 'Selecciona o registra una empresa antes de vincular.',
                life: 5000,
            })
        } else {
            toast.add({
                severity: 'warn',
                summary: 'No se pudo vincular',
                detail: iamStore.employeeLinkMessage ?? 'Intenta de nuevo o contacta al administrador.',
                life: 5000,
            })
        }
    } finally {
        linking.value = false
    }
}
</script>

<template>
    <pv-message
        v-if="visible"
        :severity="severity"
        :closable="false"
        class="employee-link-banner mb-3"
    >
        <div class="employee-link-banner__content">
            <span>{{ bannerMessage }}</span>
            <pv-button
                v-if="showLinkAction"
                label="Vincular ahora"
                size="small"
                severity="secondary"
                :loading="linking"
                class="employee-link-banner__cta"
                @click="linkEmployeeNow"
            />
        </div>
    </pv-message>
</template>

<style scoped>
.employee-link-banner {
    width: 100%;
}

.employee-link-banner__content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
}

.employee-link-banner__cta {
    flex-shrink: 0;
}
</style>
