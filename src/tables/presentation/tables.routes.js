const tablesManagement = () => import('./views/tables-management.vue');
const reservationsManagement = () => import('./views/reservations-management.vue');

const tablesRoutes = [
    {
        path: '',
        name: 'tables-management',
        component: tablesManagement,
        meta: {
            title: 'Mesas',
            titleModule: 'Gestión de Mesas',
            description: 'Administre zonas y mesas del restaurante',
            showBackButton: false,
        }
    },
    {
        path: 'reservations',
        name: 'tables-reservations',
        component: reservationsManagement,
        meta: {
            title: 'Reservas',
            titleModule: 'Reservas del día',
            description: 'Crear, cancelar y check-in de reservas',
            showBackButton: true,
            backRoute: { name: 'tables-management' },
        }
    },
]

export default tablesRoutes;

