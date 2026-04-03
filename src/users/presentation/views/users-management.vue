<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '../../application/users.store.js'
import { useBranchesStore } from '../../../branches/application/branches.store.js'
import { useIamStore } from '../../../iam/application/iam.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import { USER_ROLE_CONFIG } from '../constants/users.constants-ui.js'
import { ROLE_ALLOWED_ROUTES } from '../../../shared/presentation/constants/roles.constants.js'
import CreateAndEditUser from './create-and-edit-user.vue'
import UserDetailDialog from './user-detail-dialog.vue'
import ModuleStateFeedback from '../../../shared/presentation/components/module-state-feedback.vue'

const store       = useUsersStore()
const branchStore = useBranchesStore()
const iamStore    = useIamStore()
const { confirmDelete } = useConfirmDialog()

const activeTab    = ref('users')  // 'users' | 'roles'
const showDialog   = ref(false)
const editingUser  = ref(null)
const showDetail   = ref(false)
const detailUser   = ref(null)
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

function openDetail(user) {
    detailUser.value = user
    showDetail.value = true
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
            <div class="flex align-items-center gap-2">
                <div class="search-wrapper flex-1">
                    <i class="pi pi-search search-wrapper__icon"></i>
                    <pv-input-text
                        v-model="searchQuery"
                        placeholder="Buscar por nombre, usuario, email, documento..."
                        class="w-full search-wrapper__input"
                    />
                </div>
                <pv-select
                    v-model="filterBranch"
                    :options="[{ value: '', label: 'Todas las sucursales' }, ...branchOptions]"
                    option-label="label"
                    option-value="value"
                    placeholder="Sucursal"
                    class="user-filter-select"
                />
                <pv-select
                    v-model="filterRole"
                    :options="[{ value: '', label: 'Todos los roles' }, ...roleOptions]"
                    option-label="label"
                    option-value="value"
                    placeholder="Rol"
                    class="user-filter-select"
                />
                <pv-button label="Nuevo Usuario" icon="pi pi-plus" size="small" severity="info" @click="openCreate" />
            </div>

            <!-- ── Loading / Empty ───────────────────────────────────── -->
            <ModuleStateFeedback
                :loading="store.isLoading"
                :is-empty="filteredUsers.length === 0 && !store.isLoading"
                empty-icon="pi-users"
                empty-title="Sin usuarios"
                empty-subtitle="Cree usuarios para asignarlos a las sucursales."
            />

            <!-- ── Table ──────────────────────────────────────────────── -->
            <div v-if="!store.isLoading && filteredUsers.length > 0" class="user-table-wrap">
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Sucursal</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="user in filteredUsers"
                            :key="user.id"
                            :class="['user-row', !user.isActive && 'user-row--inactive']"
                            @click="openDetail(user)"
                        >
                            <td>
                                <div class="user-cell-name">
                                    <div class="user-cell-avatar" :style="{ background: roleConfig(user.role).bg, color: roleConfig(user.role).color }">
                                        {{ user.initials }}
                                    </div>
                                    <div>
                                        <span class="user-cell-fullname">{{ user.fullName }}</span>
                                        <span class="user-cell-username">@{{ user.username }}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="td-email">{{ user.email }}</td>
                            <td>
                                <span class="user-role-badge" :style="{ background: roleConfig(user.role).bg, color: roleConfig(user.role).color }">
                                    <i :class="['pi', roleConfig(user.role).icon]"></i>
                                    {{ roleConfig(user.role).label }}
                                </span>
                            </td>
                            <td class="td-branch">{{ user.sucursalNombre || '—' }}</td>
                            <td>
                                <span :class="['status-badge', user.isActive ? 'status-badge--on' : 'status-badge--off']">
                                    {{ user.isActive ? 'Activo' : 'Inactivo' }}
                                </span>
                            </td>
                            <td class="td-actions">
                                <pv-button icon="pi pi-power-off" text rounded size="small"
                                    :severity="user.isActive ? 'success' : 'secondary'"
                                    :title="user.isActive ? 'Desactivar' : 'Activar'"
                                    @click.stop="store.toggleActive(user.id)"
                                />
                                <pv-button icon="pi pi-pencil" text rounded size="small" severity="info"
                                    @click.stop="openEdit(user)"
                                />
                                <pv-button icon="pi pi-trash" text rounded size="small" severity="danger"
                                    @click.stop="onDelete(user)"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Dialog crear/editar -->
            <CreateAndEditUser
                v-if="showDialog"
                :visible="showDialog"
                :user="editingUser"
                @close="showDialog = false"
                @saved="onDialogSaved"
            />

            <!-- Dialog detalle -->
            <UserDetailDialog
                v-model:visible="showDetail"
                :user="detailUser"
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
    position: sticky;
    top: 0;
    z-index: 10;
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
.search-wrapper {
    position: relative;
}

.search-wrapper__icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #9ca3af);
    font-size: 0.9rem;
    z-index: 1;
    pointer-events: none;
}

.search-wrapper__input {
    padding-left: 2.25rem !important;
}

.user-filter-select { width: 220px; }

/* ── Table ────────────────────────────────────────────────────────────────── */
.user-table-wrap {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}

.user-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.83rem;
}

.user-table thead tr {
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
}

.user-table th {
    padding: 0.7rem 0.85rem;
    text-align: left;
    font-size: 0.73rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
}

.user-row {
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background 0.1s;
}
.user-row:hover { background: #fafafe; }
.user-row--inactive { opacity: 0.55; }
.user-row--inactive:hover { opacity: 0.75; }

.user-table td {
    padding: 0.65rem 0.85rem;
    color: #374151;
    vertical-align: middle;
}

/* Name cell: avatar + name/username */
.user-cell-name {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.user-cell-avatar {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
}

.user-cell-fullname {
    display: block;
    font-weight: 600;
    color: #111827;
    white-space: nowrap;
}

.user-cell-username {
    display: block;
    font-size: 0.72rem;
    color: #9ca3af;
}

.td-email {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #6b7280;
    font-size: 0.8rem;
}

.td-branch {
    white-space: nowrap;
    color: #6b7280;
    font-size: 0.8rem;
}

.user-role-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    white-space: nowrap;
}

.status-badge {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
}
.status-badge--on  { background: #dcfce7; color: #15803d; }
.status-badge--off { background: #fee2e2; color: #b91c1c; }

.td-actions { white-space: nowrap; width: 7rem; }

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
    .roles-grid { grid-template-columns: 1fr; }
    .stat-row { flex-direction: column; }
}
</style>
