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

            <!-- Dirección Fiscal -->
            <div class="flex flex-column gap-1">
                <label class="font-semibold text-sm text-color">Dirección Fiscal <span class="text-red-500">*</span></label>
                <pv-input-text
                    v-model="data.direccion"
                    placeholder="Av. Javier Prado Este 1234, San Isidro, Lima"
                    :invalid="errors.direccion"
                    class="w-full"
                />
                <small v-if="errors.direccion" class="text-red-500">La dirección fiscal es requerida</small>
            </div>

            <!-- Info card -->
            <div class="empresa-info-card flex align-items-start gap-3 p-3 border-round-lg mt-1">
                <i class="pi pi-info-circle text-primary mt-1" style="font-size: 1.1rem;"></i>
                <div>
                    <p class="font-semibold text-sm text-color m-0 mb-1">Datos fiscales</p>
                    <p class="text-sm text-color-secondary m-0 line-height-3">
                        Estos datos corresponden a la información registrada en SUNAT.
                        Serán usados para la facturación electrónica.
                    </p>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.empresa-info-card {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
}
</style>
