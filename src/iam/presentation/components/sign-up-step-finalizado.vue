<script setup>
import { useRouter } from 'vue-router'

/**
 * SignUpStepFinalizado — Step 4: Resumen y confirmación.
 *
 * Props:
 *   empresaNombre  — string: nombre comercial de la empresa
 *   sucursalNombre — string: nombre de la sucursal
 *   usuarioNombre  — string: nombre completo del administrador
 */

defineProps({
    empresaNombre:  { type: String, required: true },
    sucursalNombre: { type: String, required: true },
    usuarioNombre:  { type: String, required: true },
})

const router = useRouter()
</script>

<template>
    <div class="flex flex-column gap-4">

        <!-- Ícono + Título -->
        <div class="flex flex-column align-items-center text-center gap-2 pt-2">
            <div class="success-icon-circle flex align-items-center justify-content-center">
                <i class="pi pi-megaphone" style="font-size: 1.5rem; color: #22c55e;"></i>
            </div>
            <h3 class="text-2xl font-bold m-0 text-color">¡Configuración Completada!</h3>
            <p class="text-sm text-primary m-0">Tu restaurante está listo para comenzar a operar</p>
        </div>

        <!-- Resumen -->
        <div class="flex flex-column gap-2">
            <p class="font-semibold text-sm text-color m-0">Resumen de Configuración</p>
            <div class="summary-card flex flex-column gap-3 p-3 border-round-lg">
                <div class="flex align-items-center gap-3">
                    <i class="pi pi-building text-color-secondary" style="font-size: 1.1rem; width: 1.25rem;"></i>
                    <div>
                        <p class="font-semibold text-sm text-color m-0">Empresa:</p>
                        <p class="text-sm text-color-secondary m-0">{{ empresaNombre }}</p>
                    </div>
                </div>
                <div class="flex align-items-center gap-3">
                    <i class="pi pi-shop text-color-secondary" style="font-size: 1.1rem; width: 1.25rem;"></i>
                    <div>
                        <p class="font-semibold text-sm text-color m-0">Sucursal:</p>
                        <p class="text-sm text-color-secondary m-0">{{ sucursalNombre }}</p>
                    </div>
                </div>
                <div class="flex align-items-center gap-3">
                    <i class="pi pi-user text-color-secondary" style="font-size: 1.1rem; width: 1.25rem;"></i>
                    <div>
                        <p class="font-semibold text-sm text-color m-0">Administrador:</p>
                        <p class="text-sm text-color-secondary m-0">{{ usuarioNombre }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Felicitaciones card -->
        <div class="congrats-card flex align-items-start gap-3 p-3 border-round-lg">
            <i class="pi pi-star-fill" style="font-size: 1.1rem; color: var(--color-primary); margin-top: 2px;"></i>
            <div>
                <p class="font-semibold text-sm text-primary m-0 mb-1">¡Felicidades!</p>
                <p class="text-sm text-primary m-0 line-height-3">
                    Has completado la configuración inicial de tu restaurante en GastroSuite.
                    Ahora puedes comenzar a gestionar tus operaciones y ofrecer servicios a tus clientes.
                </p>
            </div>
        </div>

        <!-- Botón Ir al sistema -->
        <pv-button
            label="Ir al sistema"
            icon="pi pi-arrow-right"
            icon-pos="right"
            class="w-full"
            @click="router.push('/sign-in')"
        />

    </div>
</template>

<style scoped>
.success-icon-circle {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background-color: color-mix(in srgb, #22c55e 15%, transparent);
}
.summary-card {
    background-color: var(--color-gray-50, #f9fafb);
    border: 1px solid var(--color-gray-200, #e5e7eb);
}
.congrats-card {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
}
</style>
