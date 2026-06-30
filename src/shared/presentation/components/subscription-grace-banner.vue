<script setup>
import { computed, watch } from 'vue'
import { useShellFacade } from '../../application/shell.facade.js'
import { ROLES } from '../constants/roles.constants.js'
import { COMPANY_MESSAGES } from '../../../company/presentation/constants/company.constants-ui.js'

const shell = useShellFacade()

const visible = computed(() =>
    shell.isAuthenticated.value
    && shell.userRole.value === ROLES.OWNER
    && shell.inGracePeriod.value,
)

watch(
    () => [shell.isAuthenticated.value, shell.userRole.value, shell.companyId.value, shell.activeBranchId.value],
    ([authenticated, role]) => {
        if (authenticated && role === ROLES.OWNER) {
            shell.fetchSubscriptionSummary()
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
