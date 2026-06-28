const companySettings = () => import('./views/company-settings.vue');
const companySubscription = () => import('./views/company-subscription.vue');

export default [
    {
        path: '',
        redirect: { name: 'company-settings' },
    },
    {
        path: 'settings',
        name: 'company-settings',
        component: companySettings,
        meta: {
            title: 'Empresa',
            titleModule: 'Empresa',
            description: 'Datos de contacto y perfil',
            requiresOwner: true,
        },
    },
    {
        path: 'subscription',
        name: 'company-subscription',
        component: companySubscription,
        meta: {
            title: 'Mi plan',
            titleModule: 'Mi plan',
            description: 'Elige tu plan y consulta consumo vs límites',
            requiresOwner: true,
        },
    },
];
