<script setup>
import { computed, watch } from 'vue'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useCompanyStore } from '../../../company/application/company.store.js'
import { ROLES } from '../constants/roles.constants.js'
import { COMPANY_MESSAGES } from '../../../company/presentation/constants/company.constants-ui.js'

const iamStore = useIamStore()
const companyStore = useCompanyStore()

const visible = computed(() =>
    iamStore.isAuthenticated
    && iamStore.userRole === ROLES.OWNER
    && companyStore.inGracePeriod,
)

watch(
    () => [iamStore.isAuthenticated, iamStore.userRole, iamStore.companyId, iamStore.activeBranchId],
    ([authenticated, role]) => {
        if (authenticated && role === ROLES.OWNER) {
            companyStore.fetchSubscriptionSummary()
        }
    },
    { immediate: true },
)
</script>

<template>
  <pv-message
    v-if="visible"
    severity="warn"
    :closable="false"
    class="subscription-grace-banner mb-3"
  >
    {{ COMPANY_MESSAGES.GRACE_BANNER }}
  </pv-message>
</template>

<style scoped>
.subscription-grace-banner {
  width: 100%;
}
</style>
