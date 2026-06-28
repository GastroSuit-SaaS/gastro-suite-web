/**
 * Menú lateral para super admin Metasoft (rol SYSTEM).
 */
export const PLATFORM_DOCUMENT_TYPES = Object.freeze([
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carnet de extranjería' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
]);

export const PLATFORM_AUDIT_ACTION_LABELS = Object.freeze({
    PLATFORM_BOOTSTRAP: 'Bootstrap inicial',
    PLATFORM_ADMIN_CREATED: 'Super admin creado',
    SUBSCRIPTION_PLAN_CREATED: 'Plan creado',
    SUBSCRIPTION_PLAN_UPDATED: 'Plan actualizado',
    SUBSCRIPTION_PLAN_DELETED: 'Plan eliminado',
    SUBSCRIPTION_REQUEST_APPROVED: 'Solicitud aprobada',
    SUBSCRIPTION_REQUEST_REJECTED: 'Solicitud rechazada',
});

export const PLATFORM_MENU_ITEMS = [
    {
        label: 'Inicio',
        icon: 'pi pi-fw pi-home',
        to: '/platform',
        title: 'Panel Metasoft',
    },
    {
        label: 'Solicitudes',
        icon: 'pi pi-fw pi-inbox',
        to: '/platform/requests',
        title: 'Validar pagos y contratos',
    },
    {
        label: 'Empresas',
        icon: 'pi pi-fw pi-building',
        to: '/platform/companies',
        title: 'Empresas cliente',
    },
    {
        label: 'Planes',
        icon: 'pi pi-fw pi-star',
        to: '/platform/plans',
        title: 'Catálogo de planes',
    },
    {
        label: 'Super admins',
        icon: 'pi pi-fw pi-shield',
        to: '/platform/admins',
        title: 'Usuarios SYSTEM',
    },
    {
        label: 'Auditoría',
        icon: 'pi pi-fw pi-history',
        to: '/platform/audit',
        title: 'Trazabilidad de acciones',
    },
];
