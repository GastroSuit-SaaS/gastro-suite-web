<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { toolbarContext } from '../../../shared/composables/use-toolbar-context.js'
import BranchSwitcher from './branch-switcher.vue'

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
const { showConfirm } = useConfirmDialog()

const userMenu = ref()

const username = computed(() => iamStore.currentUser?.username || 'Usuario')
const userRole = computed(() => iamStore.currentUser?.primaryRole || 'Usuario')

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

function contextString(value) {
    return value !== null && value !== undefined && String(value).trim() !== ''
}

const resolvedTitle = computed(() =>
    contextString(toolbarContext.title) ? toolbarContext.title : props.title,
)
const resolvedDescription = computed(() =>
    contextString(toolbarContext.description) ? toolbarContext.description : props.description,
)
const resolvedBackLabel = computed(() =>
    contextString(toolbarContext.backLabel) ? toolbarContext.backLabel : 'Volver',
)
const resolvedShowBack = computed(() =>
    toolbarContext.showBackButton !== null && toolbarContext.showBackButton !== undefined
        ? toolbarContext.showBackButton
        : props.showBackButton,
)
const contextChips = computed(() => toolbarContext.chips ?? [])

const handleBack = () => {
    if (typeof toolbarContext.onBack === 'function') {
        toolbarContext.onBack()
        return
    }
    const routeTarget = toolbarContext.backRoute ?? props.backRoute
    if (routeTarget) {
        if (typeof routeTarget === 'string') {
            router.push({ name: routeTarget })
        } else {
            router.push(routeTarget)
        }
        return
    }
    emit('back')
    router.back()
}

const handleSignOut = async () => {
    const confirmed = await showConfirm({
        message: '¿Estás seguro que deseas cerrar sesión?',
        header: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        acceptLabel: 'Cerrar sesión',
        rejectLabel: 'Cancelar',
    })
    if (!confirmed) return
    await iamStore.logout()
    router.push({ name: 'sign-in' })
}

const toggleUserMenu = (event) => {
    userMenu.value.toggle(event)
}

function chipStyle(chip) {
    if (!chip.color) return undefined
    return {
        color: chip.color,
        borderColor: chip.borderColor ?? chip.color,
        background: chip.background ?? `${chip.color}18`,
    }
}
</script>

<template>
    <div class="toolbar flex align-items-center gap-3 px-4 py-3">

        <div class="toolbar__leading flex align-items-center gap-2 flex-1 min-w-0">
            <button
                v-if="resolvedShowBack"
                type="button"
                class="toolbar__back"
                :aria-label="resolvedBackLabel"
                @click="handleBack"
            >
                <i class="pi pi-arrow-left" aria-hidden="true"></i>
            </button>

            <div class="toolbar__heading flex flex-column gap-1 min-w-0">
                <h2 class="m-0 toolbar__title">{{ resolvedTitle }}</h2>
                <p v-if="resolvedDescription" class="m-0 toolbar__description">{{ resolvedDescription }}</p>
            </div>
        </div>

        <!-- Context chips (orden, mesa, zona, etc.) -->
        <div v-if="contextChips.length" class="toolbar__chips hidden lg:flex">
            <span
                v-for="(chip, idx) in contextChips"
                :key="idx"
                class="toolbar__chip"
                :class="chip.variant ? `toolbar__chip--${chip.variant}` : ''"
                :style="chipStyle(chip)"
            >
                <i v-if="chip.icon" :class="['pi', chip.icon]"></i>
                {{ chip.label }}
            </span>
        </div>

        <!-- Branch switcher (visible cuando hay sucursal activa) -->
        <BranchSwitcher v-if="iamStore.hasBranchSelected" class="hidden md:flex" />

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

/* ── Leading: flecha atrás + título del módulo ───────────────────────────── */
.toolbar__leading {
    flex-shrink: 1;
}

.toolbar__back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 1.15rem;
    line-height: 1;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: color var(--transition-fast);
}

.toolbar__back:hover {
    color: var(--text-primary);
}

.toolbar__back:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.toolbar__heading {
    flex: 1;
    min-width: 0;
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

/* ── Context chips ───────────────────────────────────────────────────────── */
.toolbar__chips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    flex-shrink: 0;
    max-width: min(42vw, 520px);
}

.toolbar__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.65rem;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-secondary);
    white-space: nowrap;
    line-height: 1.2;
}

.toolbar__chip .pi {
    font-size: 0.68rem;
}

.toolbar__chip--order {
    color: #4b5563;
    border-color: #d1d5db;
    background: #f3f4f6;
}

.toolbar__chip--table {
    color: #1e40af;
    border-color: #93c5fd;
    background: #dbeafe;
}

.toolbar__chip--takeaway {
    color: #b45309;
    border-color: #fcd34d;
    background: #fef3c7;
}

@media (max-width: 1023px) {
    .toolbar__chips {
        display: none;
    }
}

</style>