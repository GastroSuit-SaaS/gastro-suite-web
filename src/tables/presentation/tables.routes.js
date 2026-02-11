
const tablesManagement = () => import('./views/tables-management.vue');



const tablesRoutes = [
    {
        path: '/',
        name: 'tables-management',
        component: tablesManagement,
        meta: {
            title: 'Gestión de Mesas',
        }
    },
]

export default tablesRoutes;

