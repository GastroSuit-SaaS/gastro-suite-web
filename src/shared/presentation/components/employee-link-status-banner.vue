<script setup>
import { computed } from 'vue'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { requiresBranch } from '../constants/roles.constants.js'
import { REPORTS_MESSAGES } from '../../../reports/presentation/constants/reports.constants-ui.js'
import { useRoute } from 'vue-router'

const iamStore = useIamStore()
const route = useRoute()

const isReportsRoute = computed(() => route.path.startsWith('/reports'))

const visible = computed(() => {
    if (!iamStore.isAuthenticated || !iamStore.hasBranchSelected) return false
    if (!requiresBranch(route.path) && !route.path.startsWith('/dashboard')) return false
    if (iamStore.employeeLinkStatus === 'missing_company' || iamStore.employeeLinkStatus === 'error') {
        return true
    }
    return isReportsRoute.value && !iamStore.hasEmployeeLink
})

const bannerMessage = computed(() => {
    if (iamStore.employeeLinkStatus === 'missing_company' || iamStore.employeeLinkStatus === 'error') {
        return iamStore.employeeLinkMessage
    }
    if (isReportsRoute.value && !iamStore.hasEmployeeLink) {
        return REPORTS_MESSAGES.EMPLOYEE_LINK_REQUIRED
    }
    return ''
})

const severity = computed(() => {
    if (iamStore.employeeLinkStatus === 'error') return 'error'
    return 'warn'
})
</script>

<template>
    <pv-message
        v-if="visible"
        :severity="severity"
        :closable="false"
        class="employee-link-banner mb-3"
    >
        {{ bannerMessage }}
    </pv-message>
</template>

<style scoped>
.employee-link-banner {
    width: 100%;
}
</style>
