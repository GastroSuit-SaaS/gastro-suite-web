<script setup>
import { reactive, watch, computed, onMounted } from 'vue'
import { useBranchesStore } from '../../application/branches.store.js'
import { useUsersStore } from '../../../users/application/users.store.js'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    branch:  { type: Object,  default: null  },
})

const emit = defineEmits(['close', 'saved'])
const store      = useBranchesStore()
const usersStore = useUsersStore()

const isEdit = computed(() => !!props.branch?.id)

onMounted(() => {
    if (usersStore.users.length === 0) usersStore.fetchAll()
})

const managerCandidates = computed(() =>
    usersStore.activeUsers
        .filter(u => ['OWNER', 'BRANCH_ADMIN'].includes(u.role))
        .map(u => ({ label: `${u.fullName} (${u.role === 'OWNER' ? 'Dueño' : 'Admin. Sucursal'})`, value: u.id, fullName: u.fullName }))
)

const form = reactive({
    codigo:          '',
    nombre:          '',
    direccion:       '',
    departamento:    '',
    provincia:       '',
    distrito:        '',
    telefono:        '',
    email:           '',
    encargadoId:     null,
    isActive:        true,
})

watch(() => props.visible, (val) => {
    if (val) {
        form.codigo       = props.branch?.codigo       ?? ''
        form.nombre       = props.branch?.nombre       ?? ''
        form.direccion    = props.branch?.direccion    ?? ''
        form.departamento = props.branch?.departamento ?? ''
        form.provincia    = props.branch?.provincia    ?? ''
        form.distrito     = props.branch?.distrito     ?? ''
        form.telefono     = props.branch?.telefono     ?? ''
        form.email        = props.branch?.email        ?? ''
        form.encargadoId  = props.branch?.encargadoId  ?? null
        form.isActive     = props.branch?.isActive     ?? true
    }
}, { immediate: true })

const canSave = computed(() =>
    form.nombre.trim() && form.codigo.trim()
)

function resolveEncargadoNombre() {
    const match = managerCandidates.value.find(c => c.value === form.encargadoId)
    return match?.fullName ?? ''
}

function onCancel() {
    emit('close')
}

async function onSave() {
    if (!canSave.value) return
    const payload = {
        ...form,
        encargadoNombre: resolveEncargadoNombre(),
    }
    if (isEdit.value) {
        await store.update(props.branch.id, payload)
    } else {
        await store.create(payload)
    }
    emit('saved')
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="isEdit"
        entity-name="Sucursal"
        size="standard"
        :custom-button-label="isEdit ? 'Actualizar Sucursal' : 'Crear Sucursal'"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="ceb-form">

                <!-- ── Sección: Información básica ─────────────── -->
                <div class="ceb-section">
                    <h4 class="ceb-section__title">
                        <i class="pi pi-building"></i>
                        Información de la Sucursal
                    </h4>
                    <div class="ceb-section__body">
                        <div class="flex gap-3">
                            <div class="flex flex-column gap-1" style="width: 35%;">
                                <label class="ceb-label">
                                    Código <span class="text-red-500">*</span>
                                </label>
                                <pv-input-text v-model="form.codigo" placeholder="Ej: SUC-001" />
                            </div>
                            <div class="flex flex-column gap-1 flex-1">
                                <label class="ceb-label">
                                    Nombre <span class="text-red-500">*</span>
                                </label>
                                <pv-input-text v-model="form.nombre" placeholder="Ej: Sede Central" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Sección: Encargado (solo edición) ──────── -->
                <div v-if="isEdit" class="ceb-section">
                    <h4 class="ceb-section__title">
                        <i class="pi pi-user"></i>
                        Encargado de Sucursal
                    </h4>
                    <div class="ceb-section__body">
                        <div class="flex flex-column gap-1">
                            <label class="ceb-label">
                                Gerente / Administrador
                            </label>
                            <pv-select
                                v-model="form.encargadoId"
                                :options="managerCandidates"
                                option-label="label"
                                option-value="value"
                                placeholder="Seleccionar encargado"
                                class="w-full"
                                showClear
                                filter
                                filterPlaceholder="Buscar usuario..."
                            />
                            <small class="ceb-hint ceb-hint--info">
                                <i class="pi pi-info-circle"></i>
                                El encargado se asigna automáticamente al crear un usuario con rol Admin. Sucursal. Puede cambiarlo aquí si lo necesita.
                            </small>
                        </div>
                    </div>
                </div>

                <!-- ── Sección: Ubicación ──────────────────────── -->
                <div class="ceb-section">
                    <h4 class="ceb-section__title">
                        <i class="pi pi-map-marker"></i>
                        Ubicación
                    </h4>
                    <div class="ceb-section__body">
                        <div class="flex flex-column gap-1">
                            <label class="ceb-label">Dirección</label>
                            <pv-input-text v-model="form.direccion" placeholder="Ej: Av. La Marina 2000" />
                        </div>
                        <div class="flex gap-3">
                            <div class="flex flex-column gap-1 flex-1">
                                <label class="ceb-label">Departamento</label>
                                <pv-input-text v-model="form.departamento" placeholder="Lima" />
                            </div>
                            <div class="flex flex-column gap-1 flex-1">
                                <label class="ceb-label">Provincia</label>
                                <pv-input-text v-model="form.provincia" placeholder="Lima" />
                            </div>
                            <div class="flex flex-column gap-1 flex-1">
                                <label class="ceb-label">Distrito</label>
                                <pv-input-text v-model="form.distrito" placeholder="San Miguel" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Sección: Contacto ───────────────────────── -->
                <div class="ceb-section">
                    <h4 class="ceb-section__title">
                        <i class="pi pi-phone"></i>
                        Contacto
                    </h4>
                    <div class="ceb-section__body">
                        <div class="flex gap-3">
                            <div class="flex flex-column gap-1 flex-1">
                                <label class="ceb-label">Teléfono</label>
                                <pv-input-text v-model="form.telefono" placeholder="Ej: 01-452-8900" />
                            </div>
                            <div class="flex flex-column gap-1 flex-1">
                                <label class="ceb-label">Email</label>
                                <pv-input-text v-model="form.email" placeholder="Ej: central@gastrosuite.pe" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Estado ──────────────────────────────────── -->
                <div class="ceb-section ceb-section--inline">
                    <div class="flex align-items-center gap-2">
                        <pv-input-switch v-model="form.isActive" />
                        <label class="ceb-label" style="margin: 0;">
                            {{ form.isActive ? 'Sucursal activa' : 'Sucursal inactiva' }}
                        </label>
                    </div>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.ceb-form { display: flex; flex-direction: column; gap: 1.5rem; padding-top: 0.5rem; }
.ceb-section { display: flex; flex-direction: column; gap: 0.85rem; }
.ceb-section__title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; font-weight: 700; color: #374151; margin: 0; padding-bottom: 0.45rem; border-bottom: 1px solid #f3f4f6; }
.ceb-section__title i { font-size: 0.82rem; color: #6b7280; }
.ceb-section__body { display: flex; flex-direction: column; gap: 1rem; }
.ceb-section--inline { padding: 0.5rem 0; }
.ceb-label { font-size: 0.82rem; font-weight: 500; color: #374151; }
.ceb-hint { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: #d97706; margin-top: 0.2rem; }
.ceb-hint--info { color: #6b7280; }
.ceb-hint i { font-size: 0.7rem; }
</style>