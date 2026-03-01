<script setup>
import { reactive } from 'vue'
import { UsuarioRegistration } from '../../domain/models/usuario-registration.vo.js'
import { TIPOS_DOCUMENTO } from '../constants/peru-geo.constants.js'

/**
 * SignUpStepUsuario — Step 3: Usuario administrador principal.
 *
 * Props:
 *   sucursalNombre — string: nombre de la sucursal del Step 2 (para el info card)
 *
 * Expone:
 *   validate() → boolean         — valida y actualiza errores, retorna true si OK
 *   data       → UsuarioRegistration — estado actual del formulario
 */

defineProps({
    sucursalNombre: { type: String, default: 'creada en el paso anterior' },
})

const data   = reactive(new UsuarioRegistration())
const errors = reactive(Object.fromEntries(Object.keys(new UsuarioRegistration().validate()).map(k => [k, false])))

function validate() {
    const result = data.validate()
    Object.assign(errors, result)
    return Object.values(result).every(v => !v)
}

defineExpose({ validate, data })
</script>

<template>
    <div>
        <div class="text-center mb-4">
            <h3 class="text-xl font-bold m-0 text-color">Usuario Administrador</h3>
            <p class="text-sm text-color-secondary m-0 mt-1">Crearás el administrador principal del sistema</p>
        </div>

        <div class="flex flex-column gap-3">

            <!-- Nombres + Apellidos -->
            <div class="flex gap-3">
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Nombres <span class="text-red-500">*</span></label>
                    <pv-input-text
                        v-model="data.nombres"
                        placeholder="María"
                        :invalid="errors.nombres"
                        class="w-full"
                    />
                    <small v-if="errors.nombres" class="text-red-500">Los nombres son requeridos</small>
                </div>
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Apellidos <span class="text-red-500">*</span></label>
                    <pv-input-text
                        v-model="data.apellidos"
                        placeholder="García"
                        :invalid="errors.apellidos"
                        class="w-full"
                    />
                    <small v-if="errors.apellidos" class="text-red-500">Los apellidos son requeridos</small>
                </div>
            </div>

            <!-- Nombre de Usuario -->
            <div class="flex flex-column gap-1">
                <label class="font-semibold text-sm text-color">Nombre de Usuario (para iniciar sesión) <span class="text-red-500">*</span></label>
                <pv-icon-field>
                    <pv-input-icon class="pi pi-user" />
                    <pv-input-text
                        v-model="data.username"
                        placeholder="maria.garcia"
                        :invalid="errors.username"
                        class="w-full"
                        @input="data.username = data.username.toLowerCase().replace(/[^a-z0-9._-]/g, '')"
                    />
                </pv-icon-field>
                <small class="text-color-secondary">
                    Este es el nombre que usarás para iniciar sesión. Solo letras, números, puntos, guiones.
                    <span class="font-semibold text-primary">Mínimo 4 caracteres.</span>
                </small>
                <small v-if="errors.username" class="text-red-500">Username inválido: mín. 4 caracteres, solo letras, números, puntos y guiones</small>
            </div>

            <!-- Tipo de Documento + Número de Documento -->
            <div class="flex gap-3">
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Tipo de Documento <span class="text-red-500">*</span></label>
                    <pv-select
                        v-model="data.tipoDocumento"
                        :options="TIPOS_DOCUMENTO"
                        placeholder="DNI"
                        :invalid="errors.tipoDocumento"
                        class="w-full"
                    />
                    <small v-if="errors.tipoDocumento" class="text-red-500">Selecciona un tipo de documento</small>
                </div>
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Número de Documento <span class="text-red-500">*</span></label>
                    <pv-input-text
                        v-model="data.numeroDocumento"
                        placeholder="12345678"
                        :invalid="errors.numeroDocumento"
                        class="w-full"
                        @input="data.numeroDocumento = data.numeroDocumento.replace(/\D/g, '')"
                    />
                    <small v-if="errors.numeroDocumento" class="text-red-500">El número de documento es requerido</small>
                </div>
            </div>

            <!-- Email + Teléfono -->
            <div class="flex gap-3">
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Email <span class="text-red-500">*</span></label>
                    <pv-icon-field>
                        <pv-input-icon class="pi pi-envelope" />
                        <pv-input-text
                            v-model="data.email"
                            placeholder="admin@empresa.pe"
                            type="email"
                            :invalid="errors.email"
                            class="w-full"
                        />
                    </pv-icon-field>
                    <small v-if="errors.email" class="text-red-500">El email es requerido</small>
                </div>
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Teléfono <span class="text-red-500">*</span></label>
                    <pv-icon-field>
                        <pv-input-icon class="pi pi-phone" />
                        <pv-input-text
                            v-model="data.telefono"
                            placeholder="+51 987 654 321"
                            :invalid="errors.telefono"
                            class="w-full"
                        />
                    </pv-icon-field>
                    <small v-if="errors.telefono" class="text-red-500">El teléfono es requerido</small>
                </div>
            </div>

            <!-- Contraseña + Confirmar Contraseña -->
            <div class="flex gap-3">
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Contraseña <span class="text-red-500">*</span></label>
                    <pv-password
                        v-model="data.password"
                        placeholder="Mínimo 8 caracteres"
                        toggle-mask
                        :invalid="errors.password"
                        class="w-full"
                        prompt-label="Ingresa una contraseña"
                        weak-label="Débil"
                        medium-label="Media"
                        strong-label="Fuerte"
                    />
                    <small v-if="errors.password" class="text-red-500">Mínimo 8 caracteres</small>
                </div>
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Confirmar Contraseña <span class="text-red-500">*</span></label>
                    <pv-password
                        v-model="data.confirmPassword"
                        placeholder="Repite tu contraseña"
                        toggle-mask
                        :feedback="false"
                        :invalid="errors.confirmPassword"
                        class="w-full"
                    />
                    <small v-if="errors.confirmPassword" class="text-red-500">Las contraseñas no coinciden</small>
                </div>
            </div>

            <!-- Info card -->
            <div class="admin-info-card flex align-items-start gap-3 p-3 border-round-lg mt-1">
                <i class="pi pi-file-edit text-primary mt-1" style="font-size: 1.1rem;"></i>
                <div>
                    <p class="font-semibold text-sm text-color m-0 mb-1">Usuario Administrador Principal</p>
                    <p class="text-sm text-color-secondary m-0 line-height-3">
                        Este usuario será el administrador principal de la sucursal
                        <span class="font-semibold text-color">{{ sucursalNombre }}</span>.
                        Tendrá acceso completo al sistema y podrá crear otros usuarios,
                        gestionar sucursales y configurar todos los aspectos de la plataforma.
                    </p>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.admin-info-card {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
}
</style>
