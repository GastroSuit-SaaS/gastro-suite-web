<script setup>
import { reactive, computed, watch } from 'vue'
import { MOVEMENT_TYPE, MOVEMENT_DIRECTION } from '../../domain/models/stock-movement.entity.js'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible:  { type: Boolean, default: false },
    products: { type: Array,   default: () => [] },
})

const emit = defineEmits(['update:visible', 'movement-saved'])

const directionOptions = [
    { label: 'Salida (consumo / merma)',   value: MOVEMENT_DIRECTION.OUT },
    { label: 'Entrada (compra / ajuste)',  value: MOVEMENT_DIRECTION.IN  },
]

const typeOptionsOut = [
    { label: 'Uso en cocina',     value: MOVEMENT_TYPE.USAGE      },
    { label: 'Merma / vencido',   value: MOVEMENT_TYPE.WASTE      },
    { label: 'Ajuste por conteo', value: MOVEMENT_TYPE.ADJUSTMENT },
    { label: 'Transferencia',     value: MOVEMENT_TYPE.TRANSFER   },
]

const typeOptionsIn = [
    { label: 'Compra a proveedor', value: MOVEMENT_TYPE.PURCHASE   },
    { label: 'Devolución',         value: MOVEMENT_TYPE.RETURN     },
    { label: 'Ajuste por conteo',  value: MOVEMENT_TYPE.ADJUSTMENT },
    { label: 'Transferencia',      value: MOVEMENT_TYPE.TRANSFER   },
]

const form = reactive({
    productId: null,
    direction: MOVEMENT_DIRECTION.OUT,
    type:      MOVEMENT_TYPE.USAGE,
    quantity:  1,
    reason:    '',
    notes:     '',
})

const typeOptions = computed(() =>
    form.direction === MOVEMENT_DIRECTION.IN ? typeOptionsIn : typeOptionsOut
)

const selectedProduct = computed(() =>
    props.products.find(p => p.id === form.productId) ?? null
)

const newStockPreview = computed(() => {
    if (!selectedProduct.value) return null
    const current = selectedProduct.value.stock
    const qty = Number(form.quantity) || 0
    return form.direction === MOVEMENT_DIRECTION.IN
        ? current + qty
        : Math.max(0, current - qty)
})

watch(() => form.direction, () => {
    const validTypes = typeOptions.value.map(o => o.value)
    if (!validTypes.includes(form.type)) {
        form.type = validTypes[0]
    }
})

watch(() => props.visible, (val) => {
    if (val) {
        form.productId = null
        form.direction = MOVEMENT_DIRECTION.OUT
        form.type      = MOVEMENT_TYPE.USAGE
        form.quantity  = 1
        form.reason    = ''
        form.notes     = ''
    }
})

const productOptions = computed(() =>
    props.products
        .filter(p => p.isActive)
        .map(p => ({ label: `${p.name} (${p.stock} ${p.unit})`, value: p.id }))
)

const canSave = computed(() =>
    form.productId && form.quantity > 0
)

const onCancel = () => emit('update:visible', false)

const onSave = () => {
    if (!canSave.value) return
    const typeOpt = typeOptions.value.find(o => o.value === form.type)
    emit('movement-saved', {
        productId: form.productId,
        direction: form.direction,
        type:      form.type,
        quantity:  Number(form.quantity),
        reason:    typeOpt?.label ?? form.type,
        notes:     form.notes.trim(),
    })
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="false"
        entity-name="Movimiento de Stock"
        custom-button-label="Registrar Movimiento"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-4 pt-3">

                <!-- Dirección -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Tipo de movimiento <span class="text-red-500">*</span>
                    </label>
                    <pv-select
                        v-model="form.direction"
                        :options="directionOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar dirección"
                    />
                </div>

                <!-- Producto -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Producto <span class="text-red-500">*</span>
                    </label>
                    <pv-select
                        v-model="form.productId"
                        :options="productOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar producto"
                        filter
                        filter-placeholder="Buscar producto..."
                    />
                </div>

                <!-- Stock actual + preview -->
                <div v-if="selectedProduct" class="stock-preview">
                    <div class="stock-preview__row">
                        <span class="stock-preview__label">Stock actual</span>
                        <span class="stock-preview__value">{{ selectedProduct.stock }} {{ selectedProduct.unit }}</span>
                    </div>
                    <div class="stock-preview__row">
                        <span class="stock-preview__label">Stock resultante</span>
                        <span class="stock-preview__value" :class="{ 'text-red-500': newStockPreview <= (selectedProduct.minStock ?? 0), 'text-green-600': newStockPreview > (selectedProduct.minStock ?? 0) }">
                            {{ newStockPreview }} {{ selectedProduct.unit }}
                        </span>
                    </div>
                </div>

                <!-- Cantidad -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Cantidad <span class="text-red-500">*</span>
                    </label>
                    <pv-input-number
                        v-model="form.quantity"
                        :min="0.01"
                        :min-fraction-digits="0"
                        :max-fraction-digits="2"
                        placeholder="0"
                        show-buttons
                        :suffix="selectedProduct ? ` ${selectedProduct.unit}` : ''"
                    />
                </div>

                <!-- Motivo -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">Motivo</label>
                    <pv-select
                        v-model="form.type"
                        :options="typeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar motivo"
                    />
                </div>

                <!-- Nota -->
                <div class="flex flex-column gap-2">
                    <label class="text-sm font-medium" style="color: #374151;">Nota (opcional)</label>
                    <pv-textarea
                        v-model="form.notes"
                        placeholder="Ej: Turno almuerzo, Factura #F001-2480, Conteo físico..."
                        :rows="2"
                        auto-resize
                    />
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.stock-preview {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}
.stock-preview__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.stock-preview__label {
    font-size: 0.8rem;
    color: #6b7280;
}
.stock-preview__value {
    font-size: 0.9rem;
    font-weight: 700;
    color: #111827;
}
</style>
