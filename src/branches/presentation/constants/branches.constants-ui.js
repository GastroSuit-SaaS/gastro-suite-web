/**
 * Configuración UI para el módulo de Sucursales.
 */

export const BRANCH_STATUS_CONFIG = {
    true:  { label: 'Activa',   color: 'var(--green-500)',  bg: 'var(--green-50)',  icon: 'pi pi-check-circle' },
    false: { label: 'Inactiva', color: 'var(--red-500)',    bg: 'var(--red-50)',    icon: 'pi pi-times-circle'  },
};

export const BRANCH_SWITCH_MESSAGES = Object.freeze({
    CONFIRM_HEADER: 'Cambiar de sucursal',
    CONFIRM_INTRO: 'Al cambiar de sucursal se descartará el contexto operativo actual:',
    CONFIRM_FOOTER: 'Los datos mostrados corresponderán a la nueva sucursal seleccionada.',
    CONFIRM_ACCEPT: 'Cambiar sucursal',
    CONFIRM_REJECT: 'Cancelar',
    LEAVE_HEADER: 'Dejar sucursal',
});
