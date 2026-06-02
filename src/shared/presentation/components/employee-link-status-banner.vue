<script setup>
import { computed } from 'vue'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { requiresBranch } from '../constants/roles.constants.js'
import { useRoute } from 'vue-router'

const iamStore = useIamStore()
const route = useRoute()

const visible = computed(() => {
    if (!iamStore.isAuthenticated || !iamStore.hasBranchSelected) return false
    if (!requiresBranch(route.path) && !route.path.startsWith('/dashboard')) return false
    return iamStore.employeeLinkStatus === 'missing_company'
        || iamStore.employeeLinkStatus === 'error'
})

const severity = computed(() =>
    iamStore.employeeLinkStatus === 'missing_company' ? 'warn' : 'error',
)
</script>

<template>
    <pv-message
        v-if="visible"
        :severity="severity"
        :closable="false"
        class="employee-link-banner mb-3"
    >
        {{ iamStore.employeeLinkMessage }}
    </pv-message>
</template>

<style scoped>
.employee-link-banner {
    width: 100%;
}
</style>
