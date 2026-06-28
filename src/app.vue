<script setup>
import LoginDoorsReveal from './shared/presentation/components/login-doors-reveal.vue'
</script>

<template>

  <pv-toast position="top-right" />
  <pv-confirm-dialog></pv-confirm-dialog>
  <login-doors-reveal />
  <router-view />

</template>

<style scoped>


</style>
