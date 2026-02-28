const tablesManagement = () => import('./views/tables-management.vue');



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
]

export default tablesRoutes;

