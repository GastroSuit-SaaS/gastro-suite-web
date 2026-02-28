const tablesManagement = () => import('./views/tables-management.vue');



const tablesRoutes = [
    {
        path: '',
        name: 'tables-management',
        component: tablesManagement,
        meta: {
            title: 'Mesas',
            titleModule: 'Mesas del restaurante',
            description: 'Gestión de mesas del restaurante',
            showBackButton: false,
        }
    },
]

export default tablesRoutes;

