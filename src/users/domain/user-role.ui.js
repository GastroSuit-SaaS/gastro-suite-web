/** Metadatos UI de roles de usuario (labels, iconos, colores). */

export const USER_ROLE_OPTIONS = [
    { value: 'BRANCH_ADMIN', label: 'Administrador de Sucursal', icon: 'pi-shield', color: '#7c3aed' },
    { value: 'WAITER',       label: 'Mesero',                    icon: 'pi-user',   color: '#2563eb' },
    { value: 'CASHIER',      label: 'Cajero',                    icon: 'pi-wallet',  color: '#059669' },
    { value: 'COOK',         label: 'Cocinero',                  icon: 'pi-box',     color: '#ea580c' },
];

export const USER_ROLE_CONFIG = Object.freeze({
    BRANCH_ADMIN: { label: 'Admin Sucursal', icon: 'pi-shield', bg: '#ede9fe', color: '#7c3aed' },
    WAITER:       { label: 'Mesero',         icon: 'pi-user',   bg: '#dbeafe', color: '#2563eb' },
    CASHIER:      { label: 'Cajero',         icon: 'pi-wallet',  bg: '#d1fae5', color: '#059669' },
    COOK:         { label: 'Cocinero',       icon: 'pi-box',     bg: '#ffedd5', color: '#ea580c' },
});

/**
 * @param {string[]} roleNames
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
