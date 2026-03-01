<script setup>
import { reactive, computed, watch } from 'vue'
import { SucursalRegistration } from '../../domain/models/sucursal-registration.vo.js'
import {
    PERU_DEPARTAMENTOS,
    PERU_PROVINCIAS,
    PERU_DISTRITOS,
    PERU_DISTRITOS_DEFAULT,
} from '../constants/peru-geo.constants.js'

/**
 * SignUpStepSucursal — Step 2: Primera sucursal.
 *
 * Expone:
 *   validate() → boolean  — valida y actualiza errores, retorna true si OK
 *   data       → SucursalRegistration — estado actual del formulario
 */

const data   = reactive(new SucursalRegistration())
const errors = reactive(Object.fromEntries(Object.keys(new SucursalRegistration().validate()).map(k => [k, false])))

const provinciasFiltradas = computed(() =>
    data.departamento ? (PERU_PROVINCIAS[data.departamento] ?? []) : []
)

const distritosFiltrados = computed(() =>
    data.provincia ? (PERU_DISTRITOS[data.provincia] ?? PERU_DISTRITOS_DEFAULT) : []
)

watch(() => data.departamento, () => {
    data.provincia = ''
    data.distrito  = ''
})
watch(() => data.provincia, () => {
    data.distrito = ''
})

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
            <h3 class="text-xl font-bold m-0 text-color">Primera Sucursal</h3>
            <p class="text-sm text-color-secondary m-0 mt-1">Configura los datos de tu primera sucursal</p>
        </div>

        <div class="flex flex-column gap-3">

            <!-- Código + Nombre -->
            <div class="flex gap-3">
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Código de Sucursal <span class="text-red-500">*</span></label>
                    <pv-input-text
                        v-model="data.codigo"
                        placeholder="SUC-CENTRO"
                        :invalid="errors.codigo"
                        class="w-full"
                        @input="data.codigo = data.codigo.toUpperCase()"
                    />
                    <small v-if="errors.codigo" class="text-red-500">El código es requerido</small>
                </div>
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Nombre de la Sucursal <span class="text-red-500">*</span></label>
                    <pv-input-text
                        v-model="data.nombre"
                        placeholder="Sucursal Centro - Lima"
                        :invalid="errors.nombre"
                        class="w-full"
                    />
                    <small v-if="errors.nombre" class="text-red-500">El nombre es requerido</small>
                </div>
            </div>

            <!-- Dirección Completa -->
            <div class="flex flex-column gap-1">
                <label class="font-semibold text-sm text-color">Dirección Completa <span class="text-red-500">*</span></label>
                <pv-icon-field>
                    <pv-input-icon class="pi pi-map-marker" />
                    <pv-input-text
                        v-model="data.direccion"
                        placeholder="Av. Javier Prado 1234"
                        :invalid="errors.direccion"
                        class="w-full"
                    />
                </pv-icon-field>
                <small v-if="errors.direccion" class="text-red-500">La dirección es requerida</small>
            </div>

            <!-- Departamento + Provincia -->
            <div class="flex gap-3">
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Departamento <span class="text-red-500">*</span></label>
                    <pv-select
                        v-model="data.departamento"
                        :options="PERU_DEPARTAMENTOS"
                        placeholder="Seleccionar"
                        :invalid="errors.departamento"
                        class="w-full"
                    />
                    <small v-if="errors.departamento" class="text-red-500">Selecciona un departamento</small>
                </div>
                <div class="flex flex-column gap-1 flex-1">
                    <label class="font-semibold text-sm text-color">Provincia <span class="text-red-500">*</span></label>
                    <pv-select
                        v-model="data.provincia"
                        :options="provinciasFiltradas"
                        placeholder="Seleccionar"
                        :invalid="errors.provincia"
                        :disabled="!data.departamento"
                        class="w-full"
                    />
                    <small v-if="errors.provincia" class="text-red-500">Selecciona una provincia</small>
                </div>
            </div>

            <!-- Distrito -->
            <div class="flex flex-column gap-1">
                <label class="font-semibold text-sm text-color">Distrito <span class="text-red-500">*</span></label>
                <pv-select
                    v-model="data.distrito"
                    :options="distritosFiltrados"
                    placeholder="Seleccionar distrito"
                    :invalid="errors.distrito"
                    :disabled="!data.provincia"
                    class="w-full"
                />
                <small v-if="errors.distrito" class="text-red-500">Selecciona un distrito</small>
            </div>

        </div>
    </div>
</template>
