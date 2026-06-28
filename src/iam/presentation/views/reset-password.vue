<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IAM_ROUTES } from '../iam.routes.js';

const route  = useRoute();
const router = useRouter();

onMounted(() => {
    router.replace({
        path: IAM_ROUTES.FORGOT_PASSWORD,
        query: {
            step: '2',
            email: route.query.email ?? undefined,
        },
    });
});
</script>

<template>
  <div class="flex align-items-center justify-content-center min-h-screen">
    <pv-progress-spinner />
  </div>
</template>
