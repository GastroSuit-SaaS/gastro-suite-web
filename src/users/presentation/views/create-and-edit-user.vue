<script setup>
import { reactive, watch, computed } from 'vue'
import { useUsersStore } from '../../application/users.store.js'
import { useBranchesStore } from '../../../branches/application/branches.store.js'
import { USER_ROLE_OPTIONS, TIPOS_DOCUMENTO } from '../constants/users.constants-ui.js'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    user:    { type: Object,  default: null  },
})

const emit = defineEmits(['close', 'saved'])

const store       = useUsersStore()
const branchStore = useBranchesStore()

const isEditing = computed(() => !!props.user?.id)

const form = reactive({
    username:        '',
    nombres:         '',
    apellidos:       '',
    email:           '',
    telefono:        '',
    tipoDocumento:   'DNI',
    numeroDocumento: '',
    role:            '',
    sucursalId:      null,
    isActive:        true,
    password:        '',
    confirmPassword: '',
})

const errors = reactive({
    username: false,
    nombres: false,
    apellidos: false,
    email: false,
    telefono: false,
    tipoDocumento: false,
    numeroDocumento: false,
    role: false,
    sucursalId: false,
    password: false,
    confirmPassword: false,
})

watch(() => props.visible, (val) => {
    if (val && props.user) {
        form.username        = props.user.username        ?? ''
        form.nombres         = props.user.nombres         ?? ''
        form.apellidos       = props.user.apellidos       ?? ''
        form.email           = props.user.email           ?? ''
        form.telefono        = props.user.telefono        ?? ''
        form.tipoDocumento   = props.user.tipoDocumento   ?? 'DNI'
        form.numeroDocumento = props.user.numeroDocumento ?? ''
        form.role            = props.user.role            ?? ''
        form.sucursalId      = props.user.sucursalId      ?? null
        form.isActive        = props.user.isActive        ?? true
        form.password        = ''
        form.confirmPassword = ''
    } else if (val) {
        Object.assign(form, {
            username: '', nombres: '', apellidos: '', email: '', telefono: '',
            tipoDocumento: 'DNI', numeroDocumento: '', role: '', sucursalId: null,
            isActive: true, password: '', confirmPassword: '',
        })
    }
    // Reset errors
    Object.keys(errors).forEach(k => errors[k] = false)
})

// Limpiar sucursal cuando se selecciona OWNER
watch(() => form.role, (newRole) => {
    if (newRole === 'OWNER') {
        form.sucursalId = null
    }
})

const branchOptions = computed(() =>
    branchStore.items.filter(b => b.isActive).map(b => ({ value: b.id, label: b.nombre }))
)

const selectedBranchLabel = computed(() => {
    const found = branchStore.items.find(b => b.id === form.sucursalId)
    return found?.nombre ?? ''
})

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{4,}$/

function validate() {
    errors.username        = !USERNAME_REGEX.test(form.username)
    errors.nombres         = !form.nombres.trim()
    errors.apellidos       = !form.apellidos.trim()
    errors.email           = !EMAIL_REGEX.test(form.email.trim())
    errors.telefono        = !form.telefono.trim()
    errors.tipoDocumento   = !form.tipoDocumento
    errors.numeroDocumento = !form.numeroDocumento.trim()
    errors.role            = !form.role
    errors.sucursalId      = form.role !== 'OWNER' && !form.sucursalId

    // Password obligatorio solo al crear
    if (!isEditing.value) {
        errors.password        = form.password.length < 8
        errors.confirmPassword = form.password !== form.confirmPassword
    } else {
        // Al editar, si se escribió algo, validar
        errors.password        = form.password.length > 0 && form.password.length < 8
        errors.confirmPassword = form.password.length > 0 && form.password !== form.confirmPassword
    }

    return Object.values(errors).every(v => !v)
}

function onCancel() {
    emit('close')
}

async function onSave() {
    if (!validate()) return

    const payload = {
        username:        form.username,
        nombres:         form.nombres,
        apellidos:       form.apellidos,
        email:           form.email,
        telefono:        form.telefono,
        tipoDocumento:   form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
        role:            form.role,
        sucursalId:      form.sucursalId,
        sucursalNombre:  selectedBranchLabel.value,
        isActive:        form.isActive,
    }

    if (form.password) {
        payload.password = form.password
    }

    if (isEditing.value) {
        await store.update(props.user.id, payload)
    } else {
        await store.create(payload)
    }

    // Si el rol es BRANCH_ADMIN y tiene sucursal, actualizar el encargado de la sucursal
    if (form.role === 'BRANCH_ADMIN' && form.sucursalId) {
        const fullName = `${form.nombres} ${form.apellidos}`.trim()
        const savedUser = store.users.find(u =>
            u.username === form.username && u.sucursalId === form.sucursalId
        )
        const userId = isEditing.value ? props.user.id : savedUser?.id
        if (userId) {
            await branchStore.update(form.sucursalId, {
                encargadoId: userId,
                encargadoNombre: fullName,
            })
        }
    }

    emit('saved')
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :edit="isEditing"
        entity-name="Usuario"
        size="standard"
        :custom-button-label="isEditing ? 'Actualizar Usuario' : 'Crear Usuario'"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="flex flex-column gap-3 pt-3">

                <!-- Nombres + Apellidos -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Nombres <span class="text-red-500">*</span>
                        </label>
                        <pv-input-text v-model="form.nombres" placeholder="Carlos" :invalid="errors.nombres" class="w-full" />
                        <small v-if="errors.nombres" class="text-red-500">Requerido</small>
                    </div>
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Apellidos <span class="text-red-500">*</span>
                        </label>
                        <pv-input-text v-model="form.apellidos" placeholder="Mendoza Rivera" :invalid="errors.apellidos" class="w-full" />
                        <small v-if="errors.apellidos" class="text-red-500">Requerido</small>
                    </div>
                </div>

                <!-- Username -->
                <div class="flex flex-column gap-1">
                    <label class="text-sm font-medium" style="color: #374151;">
                        Nombre de Usuario <span class="text-red-500">*</span>
                    </label>
                    <pv-input-text
                        v-model="form.username"
                        placeholder="carlos.mendoza"
                        :invalid="errors.username"
                        class="w-full"
                        @input="form.username = form.username.toLowerCase().replace(/[^a-z0-9._-]/g, '')"
                    />
                    <small style="color: #6b7280;">Mín. 4 caracteres. Solo letras, números, puntos y guiones.</small>
                    <small v-if="errors.username" class="text-red-500">Username inválido (mín. 4 caracteres)</small>
                </div>

                <!-- Tipo Doc + Número Doc -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-1" style="min-width: 8rem;">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Tipo Doc. <span class="text-red-500">*</span>
                        </label>
                        <pv-select
                            v-model="form.tipoDocumento"
                            :options="TIPOS_DOCUMENTO"
                            placeholder="DNI"
                            :invalid="errors.tipoDocumento"
                            class="w-full"
                        />
                    </div>
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Nro. Documento <span class="text-red-500">*</span>
                        </label>
                        <pv-input-text
                            v-model="form.numeroDocumento"
                            placeholder="45678912"
                            :invalid="errors.numeroDocumento"
                            class="w-full"
                            @input="form.numeroDocumento = form.numeroDocumento.replace(/\D/g, '')"
                        />
                        <small v-if="errors.numeroDocumento" class="text-red-500">Requerido</small>
                    </div>
                </div>

                <!-- Email + Teléfono -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Email <span class="text-red-500">*</span>
                        </label>
                        <pv-input-text v-model="form.email" placeholder="carlos@empresa.pe" type="email" :invalid="errors.email" class="w-full" />
                        <small v-if="errors.email" class="text-red-500">Email inválido</small>
                    </div>
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Teléfono <span class="text-red-500">*</span>
                        </label>
                        <pv-input-text v-model="form.telefono" placeholder="987 654 321" :invalid="errors.telefono" class="w-full" />
                        <small v-if="errors.telefono" class="text-red-500">Requerido</small>
                    </div>
                </div>

                <!-- Rol + Sucursal -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Rol <span class="text-red-500">*</span>
                        </label>
                        <pv-select
                            v-model="form.role"
                            :options="USER_ROLE_OPTIONS"
                            option-label="label"
                            option-value="value"
                            placeholder="Seleccionar rol"
                            :invalid="errors.role"
                            class="w-full"
                        />
                        <small v-if="errors.role" class="text-red-500">Seleccione un rol</small>
                    </div>
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Sucursal <span v-if="form.role && form.role !== 'OWNER'" class="text-red-500">*</span>
                        </label>
                        <pv-select
                            v-model="form.sucursalId"
                            :options="branchOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Seleccionar sucursal"
                            :invalid="errors.sucursalId"
                            :disabled="form.role === 'OWNER'"
                            class="w-full"
                        />
                        <small v-if="errors.sucursalId" class="text-red-500">Seleccione una sucursal</small>
                        <small v-if="form.role === 'BRANCH_ADMIN' && form.sucursalId" style="color: #6b7280; display: flex; align-items: center; gap: 0.25rem;">
                            <i class="pi pi-info-circle" style="font-size: 0.7rem;"></i>
                            Este usuario será asignado como encargado de la sucursal seleccionada.
                        </small>
                        <small v-if="form.role === 'OWNER'" style="color: #6b7280; display: flex; align-items: center; gap: 0.25rem;">
                            <i class="pi pi-info-circle" style="font-size: 0.7rem;"></i>
                            El dueño tiene acceso a todas las sucursales.
                        </small>
                    </div>
                </div>

                <!-- Password + Confirm (obligatorio al crear, opcional al editar) -->
                <div class="flex gap-3">
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Contraseña <span v-if="!isEditing" class="text-red-500">*</span>
                        </label>
                        <pv-password
                            v-model="form.password"
                            :placeholder="isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'"
                            toggle-mask
                            :invalid="errors.password"
                            class="w-full"
                            :feedback="!isEditing"
                            prompt-label="Ingresa una contraseña"
                            weak-label="Débil"
                            medium-label="Media"
                            strong-label="Fuerte"
                        />
                        <small v-if="errors.password" class="text-red-500">Mínimo 8 caracteres</small>
                    </div>
                    <div class="flex flex-column gap-1 flex-1">
                        <label class="text-sm font-medium" style="color: #374151;">
                            Confirmar <span v-if="!isEditing" class="text-red-500">*</span>
                        </label>
                        <pv-password
                            v-model="form.confirmPassword"
                            :placeholder="isEditing ? 'Confirmar nueva contraseña' : 'Repite la contraseña'"
                            toggle-mask
                            :feedback="false"
                            :invalid="errors.confirmPassword"
                            class="w-full"
                        />
                        <small v-if="errors.confirmPassword" class="text-red-500">Las contraseñas no coinciden</small>
                    </div>
                </div>

                <!-- Activo toggle -->
                <div class="flex align-items-center gap-3 mt-1">
                    <pv-input-switch v-model="form.isActive" input-id="user-active" />
                    <div class="flex flex-column gap-0">
                        <label for="user-active" class="cursor-pointer text-sm font-medium" style="color: #374151;">
                            Usuario activo
                        </label>
                        <span class="text-xs" style="color: #6b7280;">
                            {{ form.isActive ? 'Puede iniciar sesión y operar' : 'Acceso deshabilitado' }}
                        </span>
                    </div>
                </div>

            </div>
        </template>
    </CreateAndEdit>
</template>
