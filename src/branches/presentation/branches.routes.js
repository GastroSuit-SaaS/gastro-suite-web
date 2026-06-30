const branchManagement = () => import('./views/branch-management.vue');
const selectBranch = () => import('./views/select-branch.vue');

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

export const selectBranchRoute = {
    path: '/select-branch',
    name: 'select-branch',
    component: selectBranch,
    meta: { title: 'Seleccionar Sucursal' },
};

export default branchesRoutes;
