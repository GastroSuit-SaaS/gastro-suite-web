<script setup>
import { reactive } from 'vue'
import { EmpresaRegistration } from '../../domain/models/empresa-registration.vo.js'

/**
 * SignUpStepEmpresa — Step 1: Datos de la empresa.
 *
 * Expone:
 *   validate() → boolean  — valida y actualiza errores, retorna true si OK
 *   data       → EmpresaRegistration — estado actual del formulario
 */

const data   = reactive(new EmpresaRegistration())
const errors = reactive(Object.fromEntries(Object.keys(new EmpresaRegistration().validate()).map(k => [k, false])))

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
            <h3 class="text-xl font-bold m-0 text-color">Datos de la Empresa</h3>
            <p class="text-sm text-color-secondary m-0 mt-1">Información general de tu restaurante</p>
        </div>

        <div class="flex flex-column gap-3">

            <!-- RUC -->
            <div class="flex flex-column gap-1">
                <label class="font-semibold text-sm text-color">RUC <span class="text-red-500">*</span></label>
                <pv-input-text
                    v-model="data.ruc"
                    placeholder="20123456789"
                    :invalid="errors.ruc"
                    class="w-full"
                    maxlength="11"
                    @input="data.ruc = data.ruc.replace(/\D/g, '')"
                />
                <small v-if="errors.ruc" class="text-red-500">El RUC debe tener 11 dígitos</small>
            </div>

            <!-- Razón Social -->
            <div class="flex flex-column gap-1">
                <label class="font-semibold text-sm text-color">Razón Social <span class="text-red-500">*</span></label>
                <pv-input-text
                    v-model="data.razonSocial"
                    placeholder="RESTAURANTE EL SABOR PERUANO S.A.C."
                    :invalid="errors.razonSocial"
                    class="w-full"
                />
                <small v-if="errors.razonSocial" class="text-red-500">La razón social es requerida</small>
            </div>

            <!-- Nombre Comercial -->
            <div class="flex flex-column gap-1">
                <label class="font-semibold text-sm text-color">Nombre Comercial <span class="text-red-500">*</span></label>
                <pv-input-text
                    v-model="data.nombreComercial"
                    placeholder="El Sabor Peruano"
                    :invalid="errors.nombreComercial"
                    class="w-full"
                />
                <small v-if="errors.nombreComercial" class="text-red-500">El nombre comercial es requerido</small>
            </div>

            <!-- Email + Teléfono -->
            <div class="flex gap-3">
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Email Corporativo <span class="text-red-500">*</span></label>
                    <div class="input-icon-wrapper">
                        <i class="pi pi-envelope input-icon-wrapper__icon"></i>
                        <pv-input-text
                            v-model="data.email"
                            placeholder="contacto@empresa.pe"
                            type="email"
                            :invalid="errors.email"
                            class="w-full input-icon-wrapper__input"
                        />
                    </div>
                    <small v-if="errors.email" class="text-red-500">El email es requerido</small>
                </div>
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Teléfono <span class="text-red-500">*</span></label>
                    <div class="input-icon-wrapper">
                        <i class="pi pi-phone input-icon-wrapper__icon"></i>
                        <pv-input-text
                            v-model="data.telefono"
                            placeholder="+51 987 654 321"
                            :invalid="errors.telefono"
                            class="w-full input-icon-wrapper__input"
                        />
                    </div>
                    <small v-if="errors.telefono" class="text-red-500">El teléfono es requerido</small>
                </div>
            </div>

            <!-- Contraseña -->
            <div class="flex flex-column gap-1">
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
                <small v-if="errors.password" class="text-red-500">La contraseña debe tener al menos 8 caracteres</small>
            </div>

            <!-- Confirmar Contraseña -->
            <div class="flex flex-column gap-1">
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
    </div>
</template>
