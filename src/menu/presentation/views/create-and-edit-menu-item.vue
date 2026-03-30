<script setup>
import { reactive, ref, computed, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import FileUploader  from '../../../shared/presentation/components/file-uploader.vue'
import { useStationsStore } from '../../../stations/application/stations.store.js'

// ===========================
// PROPS & EMITS
// ===========================
const props = defineProps({
    visible:    { type: Boolean, default: false },
    edit:       { type: Boolean, default: false },
    item:       { type: Object,  default: null  },
    categories: { type: Array,   default: () => [] },
})

const emit = defineEmits(['update:visible', 'item-saved'])

// ===========================
// STATIONS (from store — fuente de verdad)
// ===========================
const stationsStore = useStationsStore()

const stationOptions = computed(() => [
    { id: null, name: 'Ninguna (No requiere preparación)', icon: 'pi-ban', color: '#ef4444' },
    ...stationsStore.activeStations.map(s => ({ id: s.id, name: s.name, icon: s.icon, color: s.color })),
])

// ===========================
// FORM STATE
// ===========================
const form = reactive({
    name:        '',
    description: '',
    categoryId:  null,
    sku:         '',
    price:       0,
    cost:        0,
    prepTime:    0,
    stationId:   null,
    isAvailable: true,
})

const imageFile = ref(null)

const errors = reactive({ name: false, categoryId: false, sku: false, price: false })

// ===========================
// WATCHERS
// ===========================
watch(() => props.visible, (val) => {
    if (val) {
        const src = props.item
        form.name        = src?.name        ?? ''
        form.description = src?.description ?? ''
        form.categoryId  = src?.categoryId  ?? null
        form.sku         = src?.sku         ?? ''
        form.price       = src?.price       ?? 0
        form.cost        = src?.cost        ?? 0
        form.prepTime    = src?.prepTime    ?? 0
        form.stationId   = src?.stationId   ?? null
        form.isAvailable = src?.isAvailable ?? true
        imageFile.value  = null
        errors.name       = false
        errors.categoryId = false
        errors.sku        = false
        errors.price      = false
    }
})

// ===========================
// METHODS
// ===========================
function onSave() {
    errors.name       = !form.name.trim()
    errors.categoryId = form.categoryId === null
    errors.sku        = !form.sku.trim()
    errors.price      = form.price <= 0

    if (errors.name || errors.categoryId || errors.sku || errors.price) return

    const selectedStation = stationOptions.value.find(s => s.id === form.stationId)

    emit('item-saved', {
        name:        form.name.trim(),
        description: form.description.trim(),
        categoryId:  form.categoryId,
        sku:         form.sku.trim(),
        price:       form.price,
        cost:        form.cost,
        prepTime:    form.prepTime,
        stationId:   form.stationId,
        station:     selectedStation?.id !== null ? selectedStation?.name ?? null : null,
        isAvailable: form.isAvailable,
        imageFile:   imageFile.value,
    })
    emit('update:visible', false)
}

function onClose() {
    emit('update:visible', false)
}
</script>

<template>
    <CreateAndEdit
        entity-name="Producto"
        :visible="visible"
        :edit="edit"
        size="standard"
        @update:visible="$emit('update:visible', $event)"
        @canceled-shared="onClose"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-3">

                <!-- Nombre del Producto -->
                <div class="flex flex-column gap-1">
                    <label class="field-label">Nombre del Producto <span class="required">*</span></label>
                    <pv-input-text
                        v-model="form.name"
                        placeholder="Ej: Lomo Saltado"
                        :invalid="errors.name"
                        class="w-full"
                    />
                    <small v-if="errors.name" class="text-red-500">El nombre es requerido</small>
                </div>

                <!-- Descripción -->
                <div class="flex flex-column gap-1">
                    <label class="field-label">Descripción</label>
                    <pv-textarea
                        v-model="form.description"
                        placeholder="Descripción del producto"
                        auto-resize
                        rows="3"
                        class="w-full"
                    />
                </div>

                <!-- Categoría + SKU -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="field-label">Categoría <span class="required">*</span></label>
                        <pv-select
                            v-model="form.categoryId"
                            :options="categories"
                            option-label="name"
                            option-value="id"
                            placeholder="Seleccionar categoría"
                            :invalid="errors.categoryId"
                            class="w-full"
                        />
                        <small v-if="errors.categoryId" class="text-red-500">Seleccione una categoría</small>
                    </div>
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="field-label">SKU <span class="required">*</span></label>
                        <pv-input-text
                            v-model="form.sku"
                            placeholder="PROD-001"
                            :invalid="errors.sku"
                            class="w-full"
                        />
                        <small v-if="errors.sku" class="text-red-500">El SKU es requerido</small>
                    </div>
                </div>

                <!-- Precio de Venta + Costo -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="field-label">Precio de Venta <span class="required">*</span></label>
                        <pv-input-number
                            v-model="form.price"
                            prefix="S/  "
                            :min-fraction-digits="2"
                            :max-fraction-digits="2"
                            :min="0"
                            :invalid="errors.price"
                            class="w-full"
                        />
                        <small v-if="errors.price" class="text-red-500">Ingrese un precio válido</small>
                    </div>
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="field-label">Costo</label>
                        <pv-input-number
                            v-model="form.cost"
                            prefix="S/  "
                            :min-fraction-digits="2"
                            :max-fraction-digits="2"
                            :min="0"
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Tiempo de Preparación -->
                <div class="flex flex-column gap-1">
                    <label class="field-label">Tiempo de Preparación</label>
                    <pv-input-number
                        v-model="form.prepTime"
                        :min="0"
                        suffix=" min"
                        class="w-full"
                    />
                    <small class="text-color-secondary">Tiempo estimado hasta que el plato esté listo</small>
                </div>

                <!-- Estación de Preparación -->
                <div class="flex flex-column gap-1">
                    <label class="field-label">Estación de Preparación</label>
                    <pv-select
                        v-model="form.stationId"
                        :options="stationOptions"
                        option-label="name"
                        option-value="id"
                        class="w-full"
                    >
                        <template #value="{ value }">
                            <div class="flex align-items-center gap-2">
                                <i
                                    :class="['pi', stationOptions.find(s => s.id === value)?.icon ?? 'pi-bolt']"
                                    :style="{ color: stationOptions.find(s => s.id === value)?.color ?? '#6b7280' }"
                                ></i>
                                <span>{{ stationOptions.find(s => s.id === value)?.name ?? 'Seleccionar estación' }}</span>
                            </div>
                        </template>
                        <template #option="{ option }">
                            <div class="flex align-items-center gap-2">
                                <i :class="['pi', option.icon]" :style="{ color: option.color }"></i>
                                <span>{{ option.name }}</span>
                            </div>
                        </template>
                    </pv-select>
                    <small class="text-color-secondary">Seleccione la estación donde se preparará este producto</small>
                </div>

                <!-- Disponibilidad -->
                <div class="flex align-items-center gap-2">
                    <pv-checkbox v-model="form.isAvailable" :binary="true" input-id="item-available" />
                    <label for="item-available" class="cursor-pointer" style="color: #374151;">Producto disponible para venta</label>
                </div>

                <!-- Imagen del Producto -->
                <div class="flex flex-column gap-1">
                    <label class="field-label">Imagen del Producto</label>
                    <FileUploader
                        v-model="imageFile"
                        file-type="image"
                        placeholder="Haz clic o arrastra la imagen del producto aquí"
                    />
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.required {
    color: #ef4444;
}
</style>
