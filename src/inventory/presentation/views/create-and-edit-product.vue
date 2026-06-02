<script setup>
import { reactive, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible:    { type: Boolean, default: false },
    edit:       { type: Boolean, default: false },
    product:    { type: Object,  default: null  },
    /** { label, value } con value = categoryId */
    categories: { type: Array,   default: () => [] },
})

const emit = defineEmits(['update:visible', 'product-saved'])

const UNIT_OPTIONS = [
    { label: 'Unidad',  value: 'unidad' },
    { label: 'Kg',      value: 'kg' },
    { label: 'Litro',   value: 'litro' },
    { label: 'Botella', value: 'botella' },
    { label: 'Paquete', value: 'paquete' },
    { label: 'Frasco',  value: 'frasco' },
    { label: 'Caja',    value: 'caja' },
    { label: 'Bolsa',   value: 'bolsa' },
]

const form = reactive({
    name:        '',
    description: '',
    sku:         '',
    price:       0,
    cost:        0,
    stock:       0,
    minStock:    0,
    maxStock:    null,
    unit:        'unidad',
    categoryId:  null,
    isActive:    true,
})

const errors = reactive({ name: false, sku: false, price: false, categoryId: false })

watch(() => props.visible, (val) => {
    if (val) {
        const src = props.product
        form.name        = src?.name        ?? ''
        form.description = src?.description ?? ''
        form.sku         = src?.sku         ?? ''
        form.price       = src?.price       ?? 0
        form.cost        = src?.cost        ?? 0
        form.stock       = src?.stock       ?? 0
        form.minStock    = src?.minStock    ?? 0
        form.maxStock    = src?.maxStock    ?? null
        form.unit        = src?.unit        ?? 'unidad'
        form.categoryId  = src?.categoryId  ?? null
        form.isActive    = src?.isActive    ?? true
        errors.name  = false
        errors.sku   = false
        errors.price = false
        errors.categoryId = false
    }
})

function onCancel() {
    emit('update:visible', false)
}

function onSave() {
    errors.name  = !form.name.trim()
    errors.sku   = !form.sku.trim()
    errors.price = form.price <= 0
    errors.categoryId = !form.categoryId

    if (errors.name || errors.sku || errors.price || errors.categoryId) return

    emit('product-saved', {
        name:        form.name.trim(),
        description: form.description.trim(),
        sku:         form.sku.trim(),
        price:       form.price,
        cost:        form.cost,
        stock:       props.edit ? undefined : form.stock,
        minStock:    form.minStock,
        maxStock:    form.maxStock,
        unit:        form.unit,
        categoryId:  form.categoryId,
        isActive:    form.isActive,
    })
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="edit"
        entity-name="Producto"
        size="standard"
        :custom-button-label="edit ? 'Actualizar Producto' : 'Crear Producto'"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-3 pt-3">

                <!-- Nombre -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Nombre <span class="text-red-500">*</span>
                    </label>
                    <pv-input-text
                        v-model="form.name"
                        placeholder="Nombre del producto"
                        :invalid="errors.name"
                        class="w-full"
                    />
                    <small v-if="errors.name" class="text-red-500">El nombre es obligatorio</small>
                </div>

                <!-- SKU + Unidad -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-2 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            SKU <span class="text-red-500">*</span>
                        </label>
                        <pv-input-text
                            v-model="form.sku"
                            placeholder="INV-XXX-001"
                            :invalid="errors.sku"
                            class="w-full"
                        />
                        <small v-if="errors.sku" class="text-red-500">El SKU es obligatorio</small>
                    </div>
                    <div class="flex flex-column gap-2" style="width: 40%;">
                        <label class="text-sm font-medium" style="color: #374151;">Unidad</label>
                        <pv-select
                            v-model="form.unit"
                            :options="UNIT_OPTIONS"
                            option-label="label"
                            option-value="value"
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Precio + Costo -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-2 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Precio (S/) <span class="text-red-500">*</span>
                        </label>
                        <pv-input-number
                            v-model="form.price"
                            mode="currency" currency="PEN" locale="es-PE"
                            :min="0" :maxFractionDigits="2"
                            :invalid="errors.price"
                            class="w-full"
                        />
                        <small v-if="errors.price" class="text-red-500">El precio debe ser mayor a 0</small>
                    </div>
                    <div class="flex flex-column gap-2 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">Costo (S/)</label>
                        <pv-input-number
                            v-model="form.cost"
                            mode="currency" currency="PEN" locale="es-PE"
                            :min="0" :maxFractionDigits="2"
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Stock + Min Stock + Max Stock -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-2 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">Stock actual</label>
                        <pv-input-number
                            v-model="form.stock"
                            :min="0"
                            class="w-full"
                            :disabled="edit"
                        />
                        <small v-if="edit" class="text-color-secondary">
                            El stock se ajusta con movimientos de entrada o salida.
                        </small>
                    </div>
                    <div class="flex flex-column gap-2 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">Stock mínimo</label>
                        <pv-input-number v-model="form.minStock" :min="0" class="w-full" />
                    </div>
                    <div class="flex flex-column gap-2 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">Stock máximo</label>
                        <pv-input-number v-model="form.maxStock" :min="0" class="w-full" placeholder="Sin límite" />
                    </div>
                </div>

                <!-- Categoría -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Categoría <span class="text-red-500">*</span>
                    </label>
                    <pv-select
                        v-model="form.categoryId"
                        :options="categories"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                        placeholder="Selecciona categoría"
                        :invalid="errors.categoryId"
                    />
                    <small v-if="errors.categoryId" class="text-red-500">
                        La categoría es obligatoria (créala en la pestaña Categorías si no existe).
                    </small>
                </div>

                <!-- Descripción -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">Descripción</label>
                    <pv-textarea
                        v-model="form.description"
                        :rows="2"
                        class="w-full"
                        placeholder="Descripción del producto"
                        auto-resize
                    />
                </div>

                <!-- Activo -->
                <div class="flex align-items-center justify-content-between p-3 border-round-lg" style="background: var(--surface-ground);">
                    <div class="flex flex-column gap-1">
                        <span class="text-sm font-medium" style="color: #374151;">Producto activo</span>
                        <span class="text-xs text-color-secondary">Los productos inactivos no aparecen en el inventario operativo</span>
                    </div>
                    <pv-input-switch v-model="form.isActive" />
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>
