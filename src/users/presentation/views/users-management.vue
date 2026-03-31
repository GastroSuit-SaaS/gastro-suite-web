<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '../../application/users.store.js'
import { useBranchesStore } from '../../../branches/application/branches.store.js'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { USER_ROLE_CONFIG } from '../constants/users.constants-ui.js'
import { ROLE_ALLOWED_ROUTES } from '../../../shared/presentation/constants/roles.constants.js'
import CreateAndEditUser from './create-and-edit-user.vue'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'

const store       = useUsersStore()
const branchStore = useBranchesStore()
const iamStore    = useIamStore()
const { confirmDelete } = useConfirmDialog()

const activeTab    = ref('users')  // 'users' | 'roles'
const showDialog   = ref(false)
const editingUser  = ref(null)
const searchQuery  = ref('')
const filterRole   = ref('')
const filterBranch = ref('')
const selectedStatus = ref(null)   // null | 'active' | 'inactive'

onMounted(async () => {
    await Promise.all([store.fetchAll(), branchStore.fetchAll()])
})

// ── Computed ──────────────────────────────────────────────
const filteredUsers = computed(() => {
    let list = store.users

    // Filtro por estado (stat chip toggle)
    if (selectedStatus.value === 'active') {
        list = list.filter(u => u.isActive)
    } else if (selectedStatus.value === 'inactive') {
        list = list.filter(u => !u.isActive)
    }

    // Filtro por sucursal
    if (filterBranch.value) {
        list = list.filter(u => u.sucursalId === filterBranch.value)
    }

    // Filtro por rol
    if (filterRole.value) {
        list = list.filter(u => u.role === filterRole.value)
    }

    // Búsqueda texto
    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
        list = list.filter(u =>
            u.fullName.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.numeroDocumento.includes(q)
        )
    }

    return list
})

const totalUsers    = computed(() => store.users.length)
const activeUsers   = computed(() => store.users.filter(u => u.isActive).length)
const inactiveUsers = computed(() => store.users.filter(u => !u.isActive).length)

const branchOptions = computed(() =>
    branchStore.items.map(b => ({ value: b.id, label: b.nombre }))
)

const roleOptions = computed(() =>
    Object.entries(USER_ROLE_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))
)

// ── Roles & Permissions data ──────────────────────────────
const MODULE_LABELS = {
    '/dashboard':      { label: 'Dashboard',      icon: 'pi-chart-bar',   desc: 'Resumen y métricas' },
    '/tables':         { label: 'Mesas',           icon: 'pi-th-large',    desc: 'Gestión de mesas y zonas' },
    '/menu':           { label: 'Menú',            icon: 'pi-book',        desc: 'Carta y categorías' },
    '/pos':            { label: 'Punto de Venta',  icon: 'pi-shopping-cart', desc: 'Toma de pedidos y ventas' },
    '/stations':       { label: 'Estaciones',      icon: 'pi-desktop',     desc: 'Estaciones de cocina/bar' },
    '/payments':       { label: 'Pagos',           icon: 'pi-credit-card', desc: 'Cobros y transacciones' },
    '/cash-register':  { label: 'Caja',            icon: 'pi-wallet',      desc: 'Apertura/cierre de caja' },
    '/inventory':      { label: 'Inventario',      icon: 'pi-box',         desc: 'Stock y productos' },
    '/reports':        { label: 'Reportes',        icon: 'pi-chart-line',  desc: 'Informes y estadísticas' },
    '/users':          { label: 'Usuarios',        icon: 'pi-users',       desc: 'Gestión de personal' },
    '/branches':       { label: 'Sucursales',      icon: 'pi-building',    desc: 'Gestión de sedes' },
    '/select-branch':  { label: 'Selección Sede',  icon: 'pi-map-marker',  desc: 'Elegir sucursal activa' },
}

const ROLE_DESCRIPTIONS = {
    BRANCH_ADMIN: 'Administra una sucursal completa: personal, stock, reportes y operación diaria.',
    WAITER:       'Opera el salón: toma pedidos, gestiona mesas asignadas y atiende comensales.',
    CASHIER:      'Gestiona cobros, apertura/cierre de caja y registra pagos de los pedidos.',
    COOK:         'Recibe y prepara pedidos desde estaciones de cocina o bar.',
}

const rolePermissions = computed(() => {
    return Object.entries(USER_ROLE_CONFIG).map(([key, cfg]) => {
        const routes = ROLE_ALLOWED_ROUTES[key] ?? []
        const modules = routes
            .map(r => ({ route: r, ...(MODULE_LABELS[r] ?? { label: r, icon: 'pi-circle', desc: '' }) }))
        const userCount = store.users.filter(u => u.role === key).length
        return {
            key,
            ...cfg,
            description: ROLE_DESCRIPTIONS[key] ?? '',
            modules,
            userCount,
        }
    })
})

// ── Actions ───────────────────────────────────────────────
function toggleStatus(status) {
    selectedStatus.value = selectedStatus.value === status ? null : status
}

function openCreate() {
    editingUser.value = null
    showDialog.value = true
}

function openEdit(user) {
    editingUser.value = { ...user }
    showDialog.value = true
}

function onDelete(user) {
    confirmDelete('el usuario', user.fullName, () => store.remove(user.id))
}

function onDialogSaved() {
    showDialog.value = false
    editingUser.value = null
}

function roleConfig(role) {
    return USER_ROLE_CONFIG[role] ?? { label: role, icon: 'pi-user', bg: '#f3f4f6', color: '#6b7280' }
}

function clearFilters() {
    searchQuery.value = ''
    filterRole.value = ''
    filterBranch.value = ''
    selectedStatus.value = null
}

function clearSearch() {
    searchQuery.value = ''
}
</script>

<template>
    <div class="user-layout">

        <!-- ── Tab navigation ──────────────────────────────────────── -->
        <div class="user-tabs">
            <button
                :class="['tab-btn', activeTab === 'users' && 'tab-btn--active']"
                @click="activeTab = 'users'"
            >
                <i class="pi pi-users"></i> Usuarios
            </button>
            <button
                :class="['tab-btn', activeTab === 'roles' && 'tab-btn--active']"
                @click="activeTab = 'roles'"
            >
                <i class="pi pi-shield"></i> Roles y Permisos
            </button>
        </div>

        <!-- ══════════════════ TAB: USUARIOS ═════════════════════════ -->
        <div v-if="activeTab === 'users'" class="user-tab-content">

            <!-- ── Stat chips (full-row, selectable) ─────────────────── -->
            <div class="stat-row">
                <div class="stat-chip">
                    <span class="stat-chip__dot" style="background:#3b82f6"></span>
                    <span class="stat-chip__label">Total</span>
                    <span class="stat-chip__value">{{ totalUsers }}</span>
                </div>
                <button
                    :class="['stat-chip', 'stat-chip--btn', selectedStatus === 'active' && 'stat-chip--active-green']"
                    @click="toggleStatus('active')"
                >
                    <span class="stat-chip__dot" style="background:#22c55e"></span>
                    <span class="stat-chip__label">Activos</span>
                    <span class="stat-chip__value" style="color:#059669">{{ activeUsers }}</span>
                </button>
                <button
                    :class="['stat-chip', 'stat-chip--btn', selectedStatus === 'inactive' && 'stat-chip--active-orange']"
                    @click="toggleStatus('inactive')"
                >
                    <span class="stat-chip__dot" style="background:#ea580c"></span>
                    <span class="stat-chip__label">Inactivos</span>
                    <span class="stat-chip__value" style="color:#ea580c">{{ inactiveUsers }}</span>
                </button>
                <div v-for="(cfg, key) in USER_ROLE_CONFIG" :key="key" class="stat-chip">
                    <i :class="['pi', cfg.icon]" :style="{ color: cfg.color, fontSize: '0.8rem' }"></i>
                    <span class="stat-chip__label">{{ cfg.label }}</span>
                    <span class="stat-chip__value" :style="{ color: cfg.color }">{{ store.users.filter(u => u.role === key).length }}</span>
                </div>
            </div>

            <!-- ── Toolbar ───────────────────────────────────────────── -->
            <div class="user-mgmt__toolbar">
                <div class="user-mgmt__search">
                    <i class="pi pi-search user-mgmt__search-icon"></i>
                    <input
                        v-model="searchQuery"
                        type="text"
                        class="user-mgmt__search-input"
                        placeholder="Buscar por nombre, usuario, email, documento..."
                    />
                    <button v-if="searchQuery" class="user-mgmt__search-clear" @click="clearSearch">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <div class="user-mgmt__filters">
                    <select v-model="filterBranch" class="user-mgmt__filter-select">
                        <option value="">Todas las sucursales</option>
                        <option v-for="b in branchOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
                    </select>
                    <select v-model="filterRole" class="user-mgmt__filter-select">
                        <option value="">Todos los roles</option>
                        <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
                    </select>
                    <button v-if="filterBranch || filterRole || selectedStatus" class="user-mgmt__filter-clear" @click="clearFilters">
                        <i class="pi pi-filter-slash"></i>
                    </button>
                </div>

                <div class="user-mgmt__toolbar-right">
                    <span v-if="filteredUsers.length !== store.users.length" class="user-mgmt__results-count">
                        {{ filteredUsers.length }} resultado{{ filteredUsers.length !== 1 ? 's' : '' }}
                    </span>
                    <button class="user-mgmt__btn-new" @click="openCreate">
                        <i class="pi pi-plus"></i>
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            <!-- ── Loading / Empty ───────────────────────────────────── -->
            <ModuleStateFeedback
                :loading="store.isLoading"
                :is-empty="filteredUsers.length === 0 && !store.isLoading"
                empty-icon="pi-users"
                empty-title="Sin usuarios"
                empty-subtitle="Cree usuarios para asignarlos a las sucursales."
            />

            <!-- ── Grid ──────────────────────────────────────────────── -->
            <div v-if="!store.isLoading && filteredUsers.length > 0" class="user-mgmt__grid">
                <div
                    v-for="user in filteredUsers"
                    :key="user.id"
                    :class="['user-card', !user.isActive && 'user-card--inactive']"
                >
                    <!-- Color bar -->
                    <div class="user-card__bar" :style="{ background: user.isActive ? roleConfig(user.role).color : '#9ca3af' }"></div>

                    <!-- Header -->
                    <div class="user-card__header">
                        <div class="user-card__avatar" :style="{ background: roleConfig(user.role).bg, color: roleConfig(user.role).color }">
                            {{ user.initials }}
                        </div>
                        <div class="user-card__info">
                            <div class="user-card__name">{{ user.fullName }}</div>
                            <div class="user-card__username">@{{ user.username }}</div>
                        </div>
                        <div class="flex flex-column align-items-end gap-1">
                            <span class="user-card__role-badge" :style="{ background: roleConfig(user.role).bg, color: roleConfig(user.role).color }">
                                <i :class="['pi', roleConfig(user.role).icon]"></i>
                                {{ roleConfig(user.role).label }}
                            </span>
                            <span :class="['user-card__active-badge', user.isActive ? 'user-card__active-badge--on' : 'user-card__active-badge--off']">
                                {{ user.isActive ? 'Activo' : 'Inactivo' }}
                            </span>
                        </div>
                    </div>

                    <!-- Body -->
                    <div class="user-card__body">
                        <div class="user-card__field">
                            <i class="pi pi-envelope"></i>
                            <span>{{ user.email }}</span>
                        </div>
                        <div v-if="user.telefono" class="user-card__field">
                            <i class="pi pi-phone"></i>
                            <span>{{ user.telefono }}</span>
                        </div>
                        <div class="user-card__field">
                            <i class="pi pi-id-card"></i>
                            <span>{{ user.tipoDocumento }} {{ user.numeroDocumento }}</span>
                        </div>
                        <div class="user-card__field">
                            <i class="pi pi-building"></i>
                            <span>{{ user.sucursalNombre || 'Sin sucursal' }}</span>
                        </div>
                    </div>

                    <!-- Footer / Actions -->
                    <div class="user-card__footer">
                        <div class="user-card__actions">
                            <button
                                :class="['user-card__icon-btn', 'user-card__icon-btn--power', user.isActive ? 'user-card__icon-btn--power-on' : 'user-card__icon-btn--power-off']"
                                :title="user.isActive ? 'Desactivar usuario' : 'Activar usuario'"
                                @click="store.toggleActive(user.id)"
                            >
                                <i class="pi pi-power-off"></i>
                            </button>
                            <button class="user-card__icon-btn user-card__icon-btn--edit" @click="openEdit(user)">
                                <i class="pi pi-pencil"></i>
                            </button>
                            <button class="user-card__icon-btn user-card__icon-btn--delete" @click="onDelete(user)">
                                <i class="pi pi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dialog -->
            <CreateAndEditUser
                v-if="showDialog"
                :visible="showDialog"
                :user="editingUser"
                @close="showDialog = false"
                @saved="onDialogSaved"
            />
        </div>

        <!-- ══════════════════ TAB: ROLES Y PERMISOS ═════════════════ -->
        <div v-else class="user-tab-content">

            <div class="roles-intro">
                <div class="roles-intro__icon"><i class="pi pi-shield"></i></div>
                <div>
                    <div class="roles-intro__title">Roles y Permisos del Sistema</div>
                    <div class="roles-intro__desc">Cada rol define a qué módulos tiene acceso un usuario. Los permisos están configurados a nivel de sistema.</div>
                </div>
            </div>

            <div class="roles-grid">
                <div v-for="role in rolePermissions" :key="role.key" class="role-card">
                    <div class="role-card__bar" :style="{ background: role.color }"></div>

                    <div class="role-card__header">
                        <div class="role-card__icon" :style="{ background: role.bg, color: role.color }">
                            <i :class="['pi', role.icon]"></i>
                        </div>
                        <div class="role-card__title-wrap">
                            <div class="role-card__title">{{ role.label }}</div>
                            <div class="role-card__count">{{ role.userCount }} usuario{{ role.userCount !== 1 ? 's' : '' }}</div>
                        </div>
                    </div>

                    <div class="role-card__desc">{{ role.description }}</div>

                    <div class="role-card__section-label">
                        <i class="pi pi-lock-open"></i> Módulos con acceso
                    </div>

                    <div class="role-card__modules">
                        <span v-for="mod in role.modules" :key="mod.route" class="role-card__module-pill" :style="{ color: role.color, background: role.bg }">
                            <i :class="['pi', mod.icon]"></i>
                            {{ mod.label }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.user-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.user-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #e5e7eb;
    background: #fff;
    padding: 0 1.25rem;
    flex-shrink: 0;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.15s;
}
.tab-btn--active {
    color: #6366f1;
    border-bottom-color: #6366f1;
    font-weight: 600;
}
.tab-btn:hover:not(.tab-btn--active) { color: #374151; }

/* ── Tab content ──────────────────────────────────────────────────────── */
.user-tab-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem;
}

/* ── Stat Row (full-width chips, like tables) ────────────────────────── */
.stat-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
}

.stat-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.85rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    white-space: nowrap;
    flex: 1;
    justify-content: center;
}

.stat-chip__dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}

.stat-chip--btn {
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.stat-chip--btn:hover { background: #f3f4f6; }

.stat-chip--active-green {
    background: #dcfce7 !important;
    border-color: #22c55e !important;
    box-shadow: 0 0 0 2px #bbf7d0;
}
.stat-chip--active-orange {
    background: #ffedd5 !important;
    border-color: #ea580c !important;
    box-shadow: 0 0 0 2px #fed7aa;
}

.stat-chip__label {
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 500;
}

.stat-chip__value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.user-mgmt__toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.user-mgmt__search {
    position: relative;
    flex: 1;
    max-width: 22rem;
}

.user-mgmt__search-icon {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.85rem;
    color: #9ca3af;
    pointer-events: none;
}

.user-mgmt__search-input {
    width: 100%;
    padding: 0.55rem 2.2rem 0.55rem 2.4rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    font-size: 0.82rem;
    color: #374151;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.user-mgmt__search-input::placeholder { color: #9ca3af; }
.user-mgmt__search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}

.user-mgmt__search-clear {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: #f3f4f6;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    color: #6b7280;
}
.user-mgmt__search-clear:hover { background: #e5e7eb; }

.user-mgmt__filters {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.user-mgmt__filter-select {
    padding: 0.55rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    font-size: 0.82rem;
    color: #374151;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
}
.user-mgmt__filter-select:focus { border-color: #3b82f6; }

.user-mgmt__filter-clear {
    width: 2rem;
    height: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    color: #6b7280;
    transition: background 0.12s;
}
.user-mgmt__filter-clear:hover { background: #fef2f2; color: #dc2626; }

.user-mgmt__toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: auto;
}

.user-mgmt__results-count {
    font-size: 0.78rem;
    font-weight: 500;
    color: #6b7280;
    white-space: nowrap;
}

.user-mgmt__btn-new {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.25rem;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
    white-space: nowrap;
}
.user-mgmt__btn-new:hover {
    background: #2563eb;
    box-shadow: 0 4px 12px rgba(59,130,246,0.3);
}

/* ── Grid ────────────────────────────────────────────────────────────────── */
.user-mgmt__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
}

/* ── User Card ───────────────────────────────────────────────────────────── */
.user-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    transition: box-shadow 0.15s;
}
.user-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.09);
}

.user-card--inactive {
    opacity: 0.55;
    filter: grayscale(0.7);
    transition: opacity 0.2s, filter 0.2s;
}
.user-card--inactive:hover {
    opacity: 0.75;
    filter: grayscale(0.4);
}

.user-card__bar {
    height: 4px;
    flex-shrink: 0;
}

.user-card__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1rem 0;
}

.user-card__avatar {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    flex-shrink: 0;
}

.user-card__info {
    flex: 1;
    min-width: 0;
}

.user-card__name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-card__username {
    font-size: 0.72rem;
    font-weight: 500;
    color: #9ca3af;
    margin-top: 1px;
}

.user-card__role-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    flex-shrink: 0;
    white-space: nowrap;
}

.user-card__active-badge {
    font-size: 0.63rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
    flex-shrink: 0;
}
.user-card__active-badge--on  { background: #dcfce7; color: #15803d; }
.user-card__active-badge--off { background: #fee2e2; color: #b91c1c; }

.user-card__body {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.75rem 1rem 0;
    flex: 1;
}

.user-card__field {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.35;
}
.user-card__field i {
    margin-top: 0.15rem;
    flex-shrink: 0;
    font-size: 0.75rem;
    color: #9ca3af;
}

.user-card__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.65rem 1rem;
    margin-top: 0.5rem;
    border-top: 1px solid #f3f4f6;
}

.user-card__actions {
    display: flex;
    gap: 0.35rem;
    opacity: 0;
    transition: opacity 0.15s;
}
.user-card:hover .user-card__actions { opacity: 1; }

.user-card__icon-btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.82rem;
    color: #6b7280;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.user-card__icon-btn--edit:hover   { background: #eff6ff; color: #2563eb; border-color: #93c5fd; }
.user-card__icon-btn--delete:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }

/* Power toggle button */
.user-card__icon-btn--power { transition: background 0.15s, color 0.15s, border-color 0.15s; }
.user-card__icon-btn--power-on  { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
.user-card__icon-btn--power-on:hover  { background: #dcfce7; color: #15803d; border-color: #86efac; }
.user-card__icon-btn--power-off { color: #9ca3af; border-color: #e5e7eb; background: #f9fafb; }
.user-card__icon-btn--power-off:hover { background: #f0fdf4; color: #16a34a; border-color: #86efac; }

/* ══════════════════ ROLES & PERMISSIONS TAB ═══════════════════════════ */

.roles-intro {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
}

.roles-intro__icon {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ede9fe;
    color: #7c3aed;
    font-size: 1.15rem;
    flex-shrink: 0;
}

.roles-intro__title {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
}

.roles-intro__desc {
    font-size: 0.82rem;
    color: #6b7280;
    margin-top: 2px;
}

.roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
}

/* ── Role Card ───────────────────────────────────────────────────────── */
.role-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    overflow: hidden;
    transition: box-shadow 0.15s;
}
.role-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
}

.role-card__bar {
    height: 4px;
}

.role-card__header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1rem 1rem 0;
}

.role-card__icon {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.15rem;
}

.role-card__title-wrap {
    flex: 1;
}

.role-card__title {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
}

.role-card__count {
    font-size: 0.72rem;
    font-weight: 500;
    color: #9ca3af;
    margin-top: 1px;
}

.role-card__desc {
    font-size: 0.82rem;
    color: #6b7280;
    padding: 0.6rem 1rem 0;
    line-height: 1.4;
}

.role-card__section-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.85rem 1rem 0.35rem;
}

.role-card__modules {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0 1rem 1rem;
}

.role-card__module-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    white-space: nowrap;
}
.role-card__module-pill i {
    font-size: 0.7rem;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
    .user-mgmt__toolbar { flex-direction: column; align-items: stretch; }
    .user-mgmt__search  { max-width: none; }
    .user-mgmt__filters { flex-wrap: wrap; }
    .user-mgmt__toolbar-right { justify-content: space-between; }
    .user-mgmt__grid { grid-template-columns: 1fr; }
    .roles-grid { grid-template-columns: 1fr; }
    .stat-row { flex-direction: column; }
}
</style>
