<script setup>
import { computed } from 'vue'
import { USER_ROLE_CONFIG } from '../constants/users.constants-ui.js'

const props = defineProps({
    visible: { type: Boolean, default: false },
    user:    { type: Object,  default: null },
})

const emit = defineEmits(['update:visible'])

const roleConfig = computed(() => {
    if (!props.user) return { label: '', icon: 'pi-user', bg: '#f3f4f6', color: '#6b7280' }
    return USER_ROLE_CONFIG[props.user.role] ?? { label: props.user.role, icon: 'pi-user', bg: '#f3f4f6', color: '#6b7280' }
})

function close() { emit('update:visible', false) }
</script>

<template>
    <pv-dialog
        :visible="visible"
        modal
        :closable="true"
        :style="{ width: '480px' }"
        class="p-fluid ce-dialog"
        @update:visible="close"
    >
        <template #header>
            <h2 class="m-0 font-bold" style="font-size: 1.1rem; color: #111827;">Detalle del Usuario</h2>
        </template>

        <template #closebutton="{ closeCallback }">
            <button class="ce-close-btn" @click="closeCallback" aria-label="Cerrar">
                <i class="pi pi-times" />
            </button>
        </template>

        <div v-if="user" class="ud">
            <!-- Profile hero -->
            <div class="ud-hero">
                <div class="ud-avatar" :style="{ background: roleConfig.bg, color: roleConfig.color }">
                    {{ user.initials }}
                </div>
                <div class="ud-name">{{ user.fullName }}</div>
                <div class="ud-username">@{{ user.username }}</div>
                <div class="ud-badges">
                    <span class="ud-role-badge" :style="{ background: roleConfig.bg, color: roleConfig.color }">
                        <i :class="['pi', roleConfig.icon]"></i>
                        {{ roleConfig.label }}
                    </span>
                    <span :class="['ud-status-badge', user.isActive ? 'ud-status-badge--on' : 'ud-status-badge--off']">
                        <i :class="['pi', user.isActive ? 'pi-check-circle' : 'pi-times-circle']" style="font-size: 0.6rem;"></i>
                        {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                </div>
            </div>

            <!-- Info grid -->
            <div class="ud-grid">
                <div class="ud-card">
                    <i class="pi pi-envelope"></i>
                    <span class="ud-card-label">Email</span>
                    <span class="ud-card-value">{{ user.email }}</span>
                </div>
                <div class="ud-card">
                    <i class="pi pi-phone"></i>
                    <span class="ud-card-label">Teléfono</span>
                    <span class="ud-card-value">{{ user.telefono || '—' }}</span>
                </div>
                <div class="ud-card">
                    <i class="pi pi-id-card"></i>
                    <span class="ud-card-label">Documento</span>
                    <span class="ud-card-value">{{ user.tipoDocumento }} {{ user.numeroDocumento }}</span>
                </div>
                <div class="ud-card">
                    <i class="pi pi-building"></i>
                    <span class="ud-card-label">Sucursal</span>
                    <span class="ud-card-value">{{ user.sucursalNombre || 'Sin sucursal' }}</span>
                </div>
                <div v-if="user.createdAt" class="ud-card ud-card--full">
                    <i class="pi pi-calendar"></i>
                    <span class="ud-card-label">Fecha de creación</span>
                    <span class="ud-card-value">{{ new Date(user.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-content-end w-full">
                <pv-button label="Cerrar" outlined severity="secondary" size="small" @click="close" />
            </div>
        </template>
    </pv-dialog>
</template>

<style scoped>
.ud {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

/* ---- Hero (centered profile) ---- */
.ud-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding-bottom: 1.15rem;
    border-bottom: 1px solid #f3f4f6;
}

.ud-avatar {
    width: 3.8rem;
    height: 3.8rem;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 700;
    flex-shrink: 0;
    margin-bottom: 0.25rem;
}

.ud-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
    text-align: center;
}

.ud-username {
    font-size: 0.78rem;
    color: #9ca3af;
}

.ud-badges {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.35rem;
}

.ud-role-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.22rem 0.65rem;
    border-radius: 999px;
    white-space: nowrap;
}

.ud-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
}
.ud-status-badge--on  { background: #dcfce7; color: #15803d; }
.ud-status-badge--off { background: #fee2e2; color: #b91c1c; }

/* ---- Info grid ---- */
.ud-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
}

.ud-card {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    background: #f9fafb;
    border: 1px solid #f3f4f6;
    border-radius: 10px;
    padding: 0.7rem 0.85rem;
}

.ud-card--full {
    grid-column: 1 / -1;
}

.ud-card > i {
    font-size: 0.82rem;
    color: #9ca3af;
    margin-bottom: 0.15rem;
}

.ud-card-label {
    font-size: 0.65rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.ud-card-value {
    font-size: 0.85rem;
    color: #374151;
    font-weight: 500;
    word-break: break-word;
}
</style>
