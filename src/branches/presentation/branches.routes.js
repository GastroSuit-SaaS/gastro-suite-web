const branchManagement = () => import('./views/branch-management.vue');

const branchesRoutes = [
    {
        path: '',
        name: 'branch-management',
        component: branchManagement,
        meta: {
            title: 'Sucursales',
            titleModule: 'Gestión de Sucursales',
            description: 'Administre las sucursales de su empresa',
            showBackButton: false,
        },
    },
];

export default branchesRoutes;
