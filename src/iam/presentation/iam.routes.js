const signInForm = () => import('./views/sign-in.vue');
const signUpForm = () => import('./views/sign-up.vue');
const forgotPasswordForm = () => import('./views/forgot-password.vue');


const iamRoutes = [
    {
        path: '',
        name: 'sign-in',
        component: signInForm,
        meta: {
            title: 'Iniciar Sesión',
        }
    },
    {
        path: 'sign-up',
        name: 'sign-up',
        component: signUpForm,
        meta: {
            title: 'Registrarse',
        }
    },
    {
        path: 'forgot-password',
        name: 'forgot-password',
        component: forgotPasswordForm,
        meta: {
            title: 'Recuperar Contraseña',
        }
    },
]

export default iamRoutes;
