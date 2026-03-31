<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBranchesStore } from '../../application/branches.store.js'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useUsersStore } from '../../../users/application/users.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import CreateAndEditBranch from './create-and-edit-branch.vue'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'

const store      = useBranchesStore()
const iamStore   = useIamStore()
const usersStore = useUsersStore()
const router     = useRouter()
const { confirmDelete } = useConfirmDialog()

const showDialog    = ref(false)
const editingBranch = ref(null)
const searchQuery   = ref('')
const statusFilter  = ref('all')

onMounted(() => {
    store.fetchAll()
    if (usersStore.users.length === 0) usersStore.fetchAll()
})

function getEncargadoDisplay(branch) {
    if (branch.encargadoId) {
        const user = usersStore.users.find(u => u.id === branch.encargadoId)
        if (user) return user.fullName
    }
    return branch.encargadoNombre || '—'
}

const filteredBranches = computed(() => {
    let list = store.items
    if (statusFilter.value === 'active')   list = list.filter(b => b.isActive)
    if (statusFilter.value === 'inactive') list = list.filter(b => !b.isActive)
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return list
    return list.filter(b =>
        b.nombre.toLowerCase().includes(q) ||
        b.codigo.toLowerCase().includes(q) ||
        b.direccion.toLowerCase().includes(q) ||
        b.distrito.toLowerCase().includes(q) ||
        b.encargadoNombre.toLowerCase().includes(q)
    )
})

const totalBranches    = computed(() => store.items.length)
const activeBranches   = computed(() => store.items.filter(b => b.isActive).length)
const inactiveBranches = computed(() => store.items.filter(b => !b.isActive).length)
const activeBranchId   = computed(() => iamStore.activeBranchId)

function setFilter(filter) {
    statusFilter.value = statusFilter.value === filter ? 'all' : filter
}

function openCreate() {
    editingBranch.value = null
    showDialog.value = true
}

function openEdit(branch) {
    editingBranch.value = { ...branch }
    showDialog.value = true
}

function onDelete(branch) {
    confirmDelete('la sucursal', branch.nombre, () => store.remove(branch.id))
}

function onDialogSaved() {
    showDialog.value = false
    editingBranch.value = null
}

function selectBranch(branch) {
    iamStore.selectBranch(branch.id, branch.nombre)
    router.push('/dashboard')
}

function onToggleActive(branch) {
    store.toggleActive(branch.id)
}

function clearSearch() {
    searchQuery.value = ''
}


</script>

<template>
    <div class="branch-mgmt">

        <!-- ── Stat Chips ────────────────────────────────────────── -->
        <div class="branch-mgmt__stats">
            <div class="stat-chip stat-chip--blue">
                <div class="stat-chip__icon"><i class="pi pi-building"></i></div>
                <div class="stat-chip__body">
                    <span class="stat-chip__value">{{ totalBranches }}</span>
                    <span class="stat-chip__label">Total</span>
                </div>
            </div>
            <button
                :class="['stat-chip', 'stat-chip--btn', 'stat-chip--green', statusFilter === 'active' && 'stat-chip--active-green']"
                @click="setFilter('active')"
            >
                <div class="stat-chip__icon"><i class="pi pi-check-circle"></i></div>
                <div class="stat-chip__body">
                    <span class="stat-chip__value">{{ activeBranches }}</span>
                    <span class="stat-chip__label">Activas</span>
                </div>
            </button>
            <button
                :class="['stat-chip', 'stat-chip--btn', 'stat-chip--orange', statusFilter === 'inactive' && 'stat-chip--active-orange']"
                @click="setFilter('inactive')"
            >
                <div class="stat-chip__icon"><i class="pi pi-pause-circle"></i></div>
                <div class="stat-chip__body">
                    <span class="stat-chip__value">{{ inactiveBranches }}</span>
                    <span class="stat-chip__label">Inactivas</span>
                </div>
            </button>
        </div>

        <!-- ── Toolbar ───────────────────────────────────────────── -->
        <div class="branch-mgmt__toolbar">
            <div class="branch-mgmt__search">
                <i class="pi pi-search branch-mgmt__search-icon"></i>
                <input
                    v-model="searchQuery"
                    type="text"
                    class="branch-mgmt__search-input"
                    placeholder="Buscar por nombre, código, distrito, encargado..."
                />
                <button v-if="searchQuery" class="branch-mgmt__search-clear" @click="clearSearch">
                    <i class="pi pi-times"></i>
                </button>
            </div>
            <div class="branch-mgmt__toolbar-right">
                <span v-if="searchQuery && filteredBranches.length !== store.items.length" class="branch-mgmt__results-count">
                    {{ filteredBranches.length }} resultado{{ filteredBranches.length !== 1 ? 's' : '' }}
                </span>
                <button class="branch-mgmt__btn-new" @click="openCreate">
                    <i class="pi pi-plus"></i>
                    Nueva Sucursal
                </button>
            </div>
        </div>

        <!-- ── Loading / Empty ───────────────────────────────────── -->
        <ModuleStateFeedback
            :loading="store.isLoading"
            :is-empty="filteredBranches.length === 0 && !store.isLoading"
            empty-icon="pi-building"
            empty-title="Sin sucursales"
            empty-subtitle="Cree su primera sucursal para comenzar a operar."
        />

        <!-- ── Grid ──────────────────────────────────────────────── -->
        <div v-if="!store.isLoading && filteredBranches.length > 0" class="branch-mgmt__grid">
            <div
                v-for="branch in filteredBranches"
                :key="branch.id"
                :class="['branch-card', activeBranchId === branch.id && 'branch-card--active', !branch.isActive && 'branch-card--inactive']"
            >
                <!-- Color bar -->
                <div class="branch-card__bar" :style="{ background: branch.isActive ? '#3b82f6' : '#9ca3af' }"></div>

                <!-- Header -->
                <div class="branch-card__header">
                    <div class="branch-card__title-row">
                        <h3 class="branch-card__name">{{ branch.nombre }}</h3>
                        <span :class="['branch-card__status', branch.isActive ? 'branch-card__status--active' : 'branch-card__status--inactive']">
                            {{ branch.isActive ? 'Activa' : 'Inactiva' }}
                        </span>
                    </div>
                    <span class="branch-card__code-badge">{{ branch.codigo }}</span>
                </div>

                <!-- Body info -->
                <div class="branch-card__body">
                    <div class="branch-card__field">
                        <i class="pi pi-map-marker"></i>
                        <div>
                            <div>{{ branch.direccion }}</div>
                            <div v-if="branch.distrito || branch.provincia">{{ [branch.distrito, branch.provincia, branch.departamento].filter(Boolean).join(', ') }}</div>
                        </div>
                    </div>

                    <div class="branch-card__separator"></div>

                    <div v-if="branch.encargadoId || branch.encargadoNombre" class="branch-card__field">
                        <i class="pi pi-user"></i>
                        <span>Encargado: <strong>{{ getEncargadoDisplay(branch) }}</strong></span>
                    </div>
                    <div v-if="branch.telefono" class="branch-card__field">
                        <i class="pi pi-phone"></i>
                        <span>{{ branch.telefono }}</span>
                    </div>
                    <div v-if="branch.email" class="branch-card__field">
                        <i class="pi pi-envelope"></i>
                        <span>{{ branch.email }}</span>
                    </div>
                </div>

                <!-- Current branch indicator -->
                <div v-if="activeBranchId === branch.id" class="branch-card__current">
                    <i class="pi pi-check"></i>
                    Operando actualmente
                </div>

                <!-- Footer -->
                <div class="branch-card__footer">
                    <button
                        v-if="branch.isActive && activeBranchId !== branch.id"
                        class="branch-card__action-btn branch-card__action-btn--view"
                        @click="selectBranch(branch)"
                    >
                        <i class="pi pi-eye"></i>
                        Ver
                    </button>
                    <button
                        class="branch-card__action-btn branch-card__action-btn--edit"
                        @click="openEdit(branch)"
                    >
                        <i class="pi pi-pencil"></i>
                        Editar
                    </button>
                    <button
                        :class="['branch-card__action-btn', branch.isActive ? 'branch-card__action-btn--deactivate' : 'branch-card__action-btn--activate']"
                        @click="onToggleActive(branch)"
                    >
                        <i class="pi pi-power-off"></i>
                        {{ branch.isActive ? 'Desactivar' : 'Activar' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Dialog -->
        <CreateAndEditBranch
            v-if="showDialog"
            :visible="showDialog"
            :branch="editingBranch"
            @close="showDialog = false"
            @saved="onDialogSaved"
        />
    </div>
</template>

<style scoped>
.branch-mgmt { display: flex; flex-direction: column; gap: 1.25rem; padding: 1.25rem; }

/* ── Stat Chips (selectable, full-row) ───────────────────────────────────── */
.branch-mgmt__stats { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.stat-chip {
    flex: 1; min-width: 140px;
    display: flex; align-items: center; gap: 0.85rem;
    padding: 0.85rem 1rem; background: #fff; border-radius: 14px;
    border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.stat-chip--btn { cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
.stat-chip--btn:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
.stat-chip--active-green { border-color: #059669 !important; box-shadow: 0 0 0 2px rgba(5,150,105,0.15) !important; }
.stat-chip--active-orange { border-color: #ea580c !important; box-shadow: 0 0 0 2px rgba(234,88,12,0.15) !important; }
.stat-chip__icon { width: 2.4rem; height: 2.4rem; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
.stat-chip--blue   .stat-chip__icon { background: #dbeafe; color: #2563eb; }
.stat-chip--green  .stat-chip__icon { background: #d1fae5; color: #059669; }
.stat-chip--orange .stat-chip__icon { background: #ffedd5; color: #ea580c; }
.stat-chip__body { display: flex; flex-direction: column; }
.stat-chip__value { font-size: 1.25rem; font-weight: 800; color: #111827; line-height: 1; }
.stat-chip__label { font-size: 0.7rem; font-weight: 500; color: #6b7280; margin-top: 0.15rem; }

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.branch-mgmt__toolbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.branch-mgmt__search { position: relative; flex: 1; max-width: 28rem; }
.branch-mgmt__search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: #9ca3af; pointer-events: none; }
.branch-mgmt__search-input { width: 100%; padding: 0.6rem 2.2rem 0.6rem 2.4rem; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; font-size: 0.85rem; color: #374151; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
.branch-mgmt__search-input::placeholder { color: #9ca3af; }
.branch-mgmt__search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
.branch-mgmt__search-clear { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); width: 1.5rem; height: 1.5rem; border: none; background: #f3f4f6; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #6b7280; transition: background 0.12s; }
.branch-mgmt__search-clear:hover { background: #e5e7eb; }
.branch-mgmt__toolbar-right { display: flex; align-items: center; gap: 0.75rem; margin-left: auto; }
.branch-mgmt__results-count { font-size: 0.78rem; font-weight: 500; color: #6b7280; white-space: nowrap; }
.branch-mgmt__btn-new { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: #3b82f6; color: #fff; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.15s, box-shadow 0.15s; white-space: nowrap; }
.branch-mgmt__btn-new:hover { background: #2563eb; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }

/* ── Grid ────────────────────────────────────────────────────────────────── */
.branch-mgmt__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }

/* ── Branch Card ─────────────────────────────────────────────────────────── */
.branch-card { position: relative; display: flex; flex-direction: column; background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; overflow: hidden; transition: box-shadow 0.15s, border-color 0.15s; }
.branch-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
.branch-card--active { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.branch-card--inactive { opacity: 0.65; filter: grayscale(0.5); transition: opacity 0.2s, filter 0.2s; }
.branch-card--inactive:hover { opacity: 0.85; filter: grayscale(0.2); }

.branch-card__bar { height: 4px; flex-shrink: 0; }

/* Header */
.branch-card__header { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem 1.15rem 0; }
.branch-card__title-row { display: flex; align-items: center; gap: 0.6rem; }
.branch-card__name { font-size: 0.95rem; font-weight: 700; color: #111827; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
.branch-card__status { display: inline-flex; align-items: center; font-size: 0.68rem; font-weight: 600; padding: 0.18rem 0.55rem; border-radius: 999px; flex-shrink: 0; }
.branch-card__status--active   { background: #d1fae5; color: #059669; }
.branch-card__status--inactive { background: #f3f4f6; color: #9ca3af; }
.branch-card__code-badge { display: inline-block; font-size: 0.68rem; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 0.15rem 0.5rem; border-radius: 6px; align-self: flex-start; }

/* Body */
.branch-card__body { display: flex; flex-direction: column; gap: 0.45rem; padding: 0.75rem 1.15rem 0; }
.branch-card__field { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; color: #6b7280; line-height: 1.35; }
.branch-card__field i { margin-top: 0.15rem; flex-shrink: 0; font-size: 0.78rem; color: #9ca3af; }
.branch-card__separator { height: 1px; background: #e5e7eb; margin: 0.35rem 0; }

/* Current indicator */
.branch-card__current { display: flex; align-items: center; gap: 0.4rem; margin: 0.75rem 1.15rem 0; padding: 0.4rem 0.7rem; background: #eff6ff; border-radius: 8px; font-size: 0.75rem; font-weight: 600; color: #2563eb; }

/* Footer */
.branch-card__footer { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.15rem; margin-top: auto; border-top: 1px solid #f3f4f6; }
.branch-card__action-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; flex: 1; padding: 0.45rem 0.5rem; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: background 0.12s, color 0.12s, border-color 0.12s; }
.branch-card__action-btn--view { background: #fff; color: #374151; border: 1px solid #e5e7eb; }
.branch-card__action-btn--view:hover { background: #f9fafb; border-color: #d1d5db; }
.branch-card__action-btn--edit { background: #3b82f6; color: #fff; border: 1px solid #3b82f6; }
.branch-card__action-btn--edit:hover { background: #2563eb; border-color: #2563eb; }
.branch-card__action-btn--deactivate { background: #fff; color: #ea580c; border: 1px solid #fdba74; }
.branch-card__action-btn--deactivate:hover { background: #fff7ed; border-color: #f97316; }
.branch-card__action-btn--activate { background: #fff; color: #059669; border: 1px solid #6ee7b7; }
.branch-card__action-btn--activate:hover { background: #ecfdf5; border-color: #34d399; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
    .branch-mgmt__toolbar { flex-direction: column; align-items: stretch; }
    .branch-mgmt__search  { max-width: none; }
    .branch-mgmt__toolbar-right { justify-content: space-between; }
    .branch-mgmt__grid { grid-template-columns: 1fr; }
    .branch-mgmt__stats { flex-direction: column; }
}
</style>
