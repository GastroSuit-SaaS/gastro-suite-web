<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useIamStore } from '../../../iam/application/iam.store.js'

const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    showBackButton: {
        type: Boolean,
        default: false,
    },
    backRoute: {
        type: [String, Object],
        default: null,
    },
})

const emit = defineEmits(['back'])

const router    = useRouter()
const iamStore  = useIamStore()

const userMenu = ref()

const username = computed(() => iamStore.currentUser?.username || 'Usuario')
const userRole = computed(() => iamStore.currentUser?.roles?.[0] || 'Usuario')

const menuItems = ref([
    {
        label: 'Perfil',
        icon: 'pi pi-user',
        disabled: true,
    },
    { separator: true },
    {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => handleSignOut(),
    },
])

const handleBack = () => {
    if (props.backRoute) {
        if (typeof props.backRoute === 'string') {
            router.push({ name: props.backRoute })
        } else {
            router.push(props.backRoute)
        }
    } else {
        emit('back')
        router.back()
    }
}

const handleSignOut = async () => {
    await iamStore.logout()
    router.push({ name: 'sign-in' })
}

const toggleUserMenu = (event) => {
    userMenu.value.toggle(event)
}
</script>

<template>
    <div class="toolbar flex align-items-center gap-3 px-4 py-3">

        <!-- Back button -->
        <pv-button
            v-if="showBackButton"
            icon="pi pi-arrow-left"
            text
            rounded
            class="toolbar__back-btn"
            aria-label="Volver atrás"
            @click="handleBack"
        />

        <!-- Title + description -->
        <div class="flex-1 flex flex-column gap-1 min-w-0">
            <h2 class="m-0 toolbar__title">{{ title }}</h2>
            <p v-if="description" class="m-0 toolbar__description">{{ description }}</p>
        </div>

        <!-- Slot for extra action buttons -->
        <slot name="actions" />

        <!-- User menu trigger: oculto en móvil, se muestra en el sidebar -->
        <div class="toolbar__user hidden md:flex" @click="toggleUserMenu">
            <div class="toolbar__avatar">
                <i class="pi pi-user"   ></i>
            </div>
            <div class="flex flex-column gap-1 hidden md:flex">
                <span class="toolbar__username">{{ username }}</span>
                <span class="toolbar__role">{{ userRole }}</span>
            </div>
            <i class="pi pi-chevron-down toolbar__chevron" ></i>
        </div>

        <!-- Dropdown -->
        <pv-menu ref="userMenu" :model="menuItems" popup>
            <template #start>
                <div class="flex align-items-center gap-3 px-3 py-3 border-bottom-1" style="border-color: var(--border-color)">
                    <div class="toolbar__avatar">
                        <i class="pi pi-user" ></i>
                    </div>
                    <div class="flex flex-column gap-1">
                        <span class="font-semibold" style="color: var(--text-primary)">{{ username }}</span>
                        <span class="text-xs" style="color: var(--text-secondary)">{{ userRole }}</span>
                    </div>
                </div>
            </template>
        </pv-menu>

    </div>
</template>

<style scoped>
/* ── Toolbar shell ───────────────────────────────────────────────────────── */
.toolbar {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    min-height: 60px;
    position: relative;
    overflow: hidden;
}

.toolbar::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
        90deg,
        transparent 0%,
        var(--color-primary) 30%,
        var(--color-primary) 70%,
        transparent 100%
    );
    opacity: 0.5;
}

/* ── Back button ─────────────────────────────────────────────────────────── */
.toolbar__back-btn {
    color: var(--text-secondary) !important;
    transition: color var(--transition-fast), transform var(--transition-fast);
}

.toolbar__back-btn:hover {
    color: var(--text-primary) !important;
    transform: translateX(-2px);
}

/* ── Title / description ─────────────────────────────────────────────────── */
.toolbar__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    line-height: var(--line-height-tight);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.toolbar__description {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── User menu trigger ───────────────────────────────────────────────────── */
.toolbar__user {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    cursor: pointer;
    transition:
        background var(--transition-fast),
        border-color var(--transition-fast),
        transform var(--transition-fast);
    user-select: none;
    flex-shrink: 0;
}

.toolbar__user:hover {
    background: var(--bg-hover);
    border-color: var(--color-primary);
    transform: translateY(-1px);
}

/* ── Avatar circle ───────────────────────────────────────────────────────── */
.toolbar__avatar {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: var(--color-white);
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(26, 107, 194, 0.25);
}

/* ── Username / role labels ──────────────────────────────────────────────── */
.toolbar__username {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    line-height: var(--line-height-tight);
    white-space: nowrap;
}

.toolbar__role {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: var(--line-height-tight);
    white-space: nowrap;
}

/* ── Chevron ─────────────────────────────────────────────────────────────── */
.toolbar__chevron {
    font-size: 0.7rem;
    color: var(--text-muted);
    transition: color var(--transition-fast), transform var(--transition-fast);
}

.toolbar__user:hover .toolbar__chevron {
    color: var(--text-secondary);
    transform: translateY(2px);
}
</style>