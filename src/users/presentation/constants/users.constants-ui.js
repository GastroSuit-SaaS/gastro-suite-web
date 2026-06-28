/**
 * Users Presentation - UI Constants
 *
 * Constantes relacionadas con la presentación del módulo Users.
 * NO contienen lógica de negocio.
 */

export const USERS_ROUTES = {
    LIST: '/users',
};

export const USER_ROLE_OPTIONS = [
    { value: 'BRANCH_ADMIN', label: 'Administrador de Sucursal', icon: 'pi-shield', color: '#7c3aed' },
    { value: 'WAITER',       label: 'Mesero',                    icon: 'pi-user',   color: '#2563eb' },
    { value: 'CASHIER',      label: 'Cajero',                    icon: 'pi-wallet',  color: '#059669' },
    { value: 'COOK',         label: 'Cocinero',                  icon: 'pi-box',     color: '#ea580c' },
];

/** Fallback estático si GET /roles no está disponible (PLAN-04). */
export const USER_ROLE_OPTIONS_FALLBACK = USER_ROLE_OPTIONS;

export const USER_ROLE_CONFIG = Object.freeze({
    BRANCH_ADMIN: { label: 'Admin Sucursal', icon: 'pi-shield', bg: '#ede9fe', color: '#7c3aed' },
    WAITER:       { label: 'Mesero',         icon: 'pi-user',   bg: '#dbeafe', color: '#2563eb' },
    CASHIER:      { label: 'Cajero',         icon: 'pi-wallet',  bg: '#d1fae5', color: '#059669' },
    COOK:         { label: 'Cocinero',       icon: 'pi-box',     bg: '#ffedd5', color: '#ea580c' },
});

/**
 * @param {string[]} roleNames — típicamente `iamStore.assignableRoles`
 * @returns {Array<{ value: string, label: string, icon: string, color: string }>}
 */
export function buildUserRoleOptions(roleNames) {
    return roleNames.map((value) => {
        const preset = USER_ROLE_OPTIONS.find((o) => o.value === value);
        if (preset) return preset;
        const cfg = USER_ROLE_CONFIG[value];
        return {
            value,
            label: cfg?.label ?? value,
            icon: cfg?.icon ?? 'pi-user',
            color: cfg?.color ?? '#6b7280',
        };
    });
}

export const TIPOS_DOCUMENTO = ['DNI', 'CE', 'Pasaporte'];

export const USERS_MESSAGES = {
    CREATE_SUCCESS: 'Usuario creado correctamente',
    UPDATE_SUCCESS: 'Usuario actualizado correctamente',
    DELETE_SUCCESS: 'Usuario eliminado correctamente',
    DELETE_ERROR:   'Error al eliminar usuario',
};
