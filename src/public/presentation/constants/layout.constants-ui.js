import { ROLE_ALLOWED_ROUTES, BRANCH_REQUIRED_ROUTES } from '../../../shared/presentation/constants/roles.constants.js';

/**
 * Todos los items de menú disponibles en el sistema.
 * El layout filtra dinámicamente según el rol del usuario.
 */
const ALL_MENU_ITEMS = [
    {
        label: 'Dashboard',
        icon: 'pi pi-fw pi-home',
        to: '/dashboard',
        title: 'Panel de Control',
    },
    {
        label: 'Sucursales',
        icon: 'pi pi-fw pi-building',
        to: '/branches',
        title: 'Gestión de Sucursales',
    },
    {
        label: 'Mesas',
        icon: 'pi pi-fw pi-table',
        to: '/tables',
        title: 'Gestión de Mesas',
    },
    {
        label: 'Menú',
        icon: 'pi pi-fw pi-book',
        to: '/menu',
        title: 'Menú del Restaurante',
    },
    {
        label: 'Punto de Venta',
        icon: 'pi pi-fw pi-shopping-cart',
        to: '/pos',
        title: 'Punto de Venta',
    },
    {
        label: 'Estaciones',
        icon: 'pi pi-fw pi-bolt',
        to: '/stations',
        title: 'Estaciones de Preparación',
    },
    {
        label: 'Pagos',
        icon: 'pi pi-fw pi-credit-card',
        to: '/payments',
        title: 'Gestión de Pagos',
    },
    {
        label: 'Caja',
        icon: 'pi pi-fw pi-dollar',
        to: '/cash-register',
        title: 'Caja y Movimientos',
    },
    {
        label: 'Inventario',
        icon: 'pi pi-fw pi-box',
        to: '/inventory',
        title: 'Gestión de Inventario',
    },
    {
        label: 'Reportes',
        icon: 'pi pi-fw pi-chart-bar',
        to: '/reports',
        title: 'Reportes y Estadísticas',
    },
    {
        label: 'Usuarios',
        icon: 'pi pi-fw pi-users',
        to: '/users',
        title: 'Gestión de Usuarios',
    },
];

/**
 * Filtra los items de menú según el rol del usuario y si tiene sucursal activa.
 * Sin sucursal seleccionada, oculta las rutas operativas (BRANCH_REQUIRED_ROUTES).
 *
 * @param {string} role        — Rol del usuario actual
 * @param {boolean} hasBranch  — Si tiene sucursal activa seleccionada
 * @returns {Array} Items de menú visibles
 */
export function getMenuItemsByRole(role, hasBranch = false) {
    if (!role) return ALL_MENU_ITEMS;
    const allowed = ROLE_ALLOWED_ROUTES[role];
    if (!allowed) return [];

    return ALL_MENU_ITEMS.filter(item => {
        // 1. Debe ser una ruta permitida para el rol
        if (!allowed.some(r => item.to.startsWith(r))) return false;
        // 2. Sin sucursal activa → ocultar rutas que la requieren
        if (!hasBranch && BRANCH_REQUIRED_ROUTES.some(r => item.to.startsWith(r))) return false;
        return true;
    });
}

/** Fallback: todos los items (para compatibilidad) */
export const menuItems = ALL_MENU_ITEMS;
