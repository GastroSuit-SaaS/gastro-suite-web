<script setup>
</script>

<template>

<div>

    <h1 class="text-2xl font-bold mb-4">Gestión de Mesas</h1>
    
    <p class="mb-6">
        Aquí puedes gestionar las mesas de tu restaurante. Agrega nuevas mesas, edita las existentes o elimínalas según sea necesario.
    </p>
    
    <!-- Botón para agregar una nueva mesa -->
    <button
        class="bg-green-500 text-white px-4 py-2 rounded mb-4 hover:bg-green-600 transition-colors"
        @click="console.log('Agregar nueva mesa')"
    >
        Agregar Mesa
    </button>
    
   
</div>
   
</template>

<style scoped>
</style>