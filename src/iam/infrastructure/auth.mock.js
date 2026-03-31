/**
 * IAM Infrastructure — Mock Authentication Service
 *
 * Simula el endpoint POST /auth/login contra una lista de usuarios mock.
 * Busca por username O email. Acepta cualquier contraseña no vacía.
 *
 * Devuelve la misma estructura que el backend real:
 *   { token: string, user: { id, username, email, nombres, apellidos, roles[], empresaId, sucursalId, sucursalNombre } }
 */

const MOCK_PASSWORD = '12345678';

/**
 * Usuarios mock para login.
 * OWNER (dueño de empresa) + usuarios operativos de cada sucursal.
 */
const AUTH_USERS = [
    {
        id:             'owner-001',
        username:       'admin',
        email:          'admin@gastrosuite.pe',
        nombres:        'Alejandro',
        apellidos:      'Navarro Ruiz',
        roles:          ['OWNER'],
        empresaId:      'empresa-001',
        sucursalId:     null,
        sucursalNombre: '',
    },
    {
        id:             'user-001',
        username:       'carlos.mendoza',
        email:          'carlos.mendoza@gastrosuite.pe',
        nombres:        'Carlos',
        apellidos:      'Mendoza Rivera',
        roles:          ['BRANCH_ADMIN'],
        empresaId:      'empresa-001',
        sucursalId:     'branch-001',
        sucursalNombre: 'Sede Central',
    },
    {
        id:             'user-002',
        username:       'maria.garcia',
        email:          'maria.garcia@gastrosuite.pe',
        nombres:        'María',
        apellidos:      'García López',
        roles:          ['WAITER'],
        empresaId:      'empresa-001',
        sucursalId:     'branch-001',
        sucursalNombre: 'Sede Central',
    },
    {
        id:             'user-003',
        username:       'jose.torres',
        email:          'jose.torres@gastrosuite.pe',
        nombres:        'José',
        apellidos:      'Torres Huamán',
        roles:          ['COOK'],
        empresaId:      'empresa-001',
        sucursalId:     'branch-001',
        sucursalNombre: 'Sede Central',
    },
    {
        id:             'user-004',
        username:       'ana.quispe',
        email:          'ana.quispe@gastrosuite.pe',
        nombres:        'Ana',
        apellidos:      'Quispe Vargas',
        roles:          ['CASHIER'],
        empresaId:      'empresa-001',
        sucursalId:     'branch-001',
        sucursalNombre: 'Sede Central',
    },
    {
        id:             'user-005',
        username:       'luis.paredes',
        email:          'luis.paredes@gastrosuite.pe',
        nombres:        'Luis',
        apellidos:      'Paredes Soto',
        roles:          ['BRANCH_ADMIN'],
        empresaId:      'empresa-001',
        sucursalId:     'branch-002',
        sucursalNombre: 'Sucursal Miraflores',
    },
    {
        id:             'user-006',
        username:       'rosa.flores',
        email:          'rosa.flores@gastrosuite.pe',
        nombres:        'Rosa',
        apellidos:      'Flores Díaz',
        roles:          ['WAITER'],
        empresaId:      'empresa-001',
        sucursalId:     'branch-002',
        sucursalNombre: 'Sucursal Miraflores',
        isActive:       false,
    },
];

/**
 * Simula un login contra usuarios mock.
 * @param {{ username: string, password: string }} credentials
 * @returns {{ token: string, user: Object }} Respuesta simulada del backend
 * @throws {Error} Si las credenciales son inválidas
 */
export function mockLogin({ username, password }) {
    if (!username || !password) {
        throw new Error('Ingresa tu usuario y contraseña para continuar.');
    }

    const input = username.trim().toLowerCase();
    const user  = AUTH_USERS.find(
        u => u.username.toLowerCase() === input || u.email.toLowerCase() === input,
    );

    if (!user) {
        throw new Error('Las credenciales ingresadas no son válidas. Revisa tu usuario o correo e intenta de nuevo.');
    }

    if (user.isActive === false) {
        throw new Error('Esta cuenta se encuentra deshabilitada. Comunícate con el administrador de tu empresa para más información.');
    }

    return {
        token: `mock-jwt-${user.id}`,
        user: { ...user },
    };
}
