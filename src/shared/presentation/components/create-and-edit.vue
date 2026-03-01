<script setup>
// ===========================
// IMPORTS
// ===========================
// Importación de dependencias de Vue para estado reactivo y ciclo de vida
import { computed, onMounted } from 'vue'

// ===========================
// PROPS
// ===========================
// Definición de propiedades: configuración del diálogo para crear/editar entidades
const props = defineProps({
  entity: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: false
  },
  entityName: {
    type: String,
    default: ''
  },
  edit: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'standard', 'large'].includes(value)
  },
  customButtonLabel: {
    type: String,
    default: null
  }
})

// ===========================
// EMITS
// ===========================
// Definición de eventos: cancelar y guardar operación
const emit = defineEmits(['canceled-shared', 'saved-shared'])

// ===========================
// COMPUTED PROPERTIES
// ===========================
// Propiedades computadas para títulos, labels y estilos dinámicos del diálogo
const headerTitle = computed(() => {
  return `${props.edit ? 'Editar' : 'Nuevo'} ${props.entityName}`
})

const submitLabel = computed(() => {
  return props.customButtonLabel || (props.edit ? 'Actualizar' : 'Crear')
})

const dialogStyle = computed(() => {
  const styles = {
    default: { width: '400px' },
    standard: { width: '600px' },
    large: { width: '900px' }
  }
  return styles[props.size] || styles.default
})

// ===========================
// METHODS - EVENT HANDLERS
// ===========================
// Métodos para manejar eventos de cancelar y guardar
const onCancelRequested = () => {
  emit('canceled-shared')
}

const onSaveRequested = () => {
  emit('saved-shared', props.entity)
}

// ===========================
// LIFECYCLE HOOKS
// ===========================
// Inicialización y logging al montar el componente
onMounted(() => {
  console.log('Create and Edit component mounted', props.entity)
})
</script>

<template>
  <pv-dialog
    :visible="visible"
    :modal="true"
    :style="dialogStyle"
    :closable="true"
    class="p-fluid ce-dialog"
    @update:visible="$emit('canceled-shared')"
  >
    <template #header>
      <h2 class="m-0 font-bold" style="font-size: 1.1rem; color: #111827;">{{ headerTitle }}</h2>
    </template>

    <!-- Reemplazamos el botón close de Aura (azul por defecto) por uno propio -->
    <template #closebutton="{ closeCallback }">
      <button class="ce-close-btn" @click="closeCallback" aria-label="Cerrar">
        <i class="pi pi-times" />
      </button>
    </template>

    <!-- Slot para el contenido personalizado -->
    <slot name="content"></slot>

    <template #footer>
      <div class="flex justify-content-end align-items-center gap-2 w-full">
        <pv-button
          type="button"
          label="Cancelar"
          text
          size="small"
          @click="onCancelRequested"
        />
        <pv-button
          type="button"
          :label="submitLabel"
          size="small"
          @click="onSaveRequested"
        />
      </div>
    </template>
  </pv-dialog>
</template>

<style>
.ce-dialog .p-dialog-header,
.ce-dialog .p-dialog-content,
.ce-dialog .p-dialog-footer {
  background: #ffffff !important;
  color: #111827 !important;
}

.ce-dialog .p-dialog-header {
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
}

.ce-dialog .p-dialog-content {
  padding: 1rem 1.5rem;
}

.ce-dialog .p-dialog-footer {
  border-top: 1px solid #e5e7eb;
  padding: 0.6rem 1.5rem;
}

/* Botón de cerrar personalizado — reemplaza el Button de Aura vía slot #closebutton */
.ce-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.ce-close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.ce-close-btn .pi {
  font-size: 0.875rem;
}
</style>
