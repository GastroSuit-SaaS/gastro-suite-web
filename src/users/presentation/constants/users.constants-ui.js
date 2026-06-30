/**
 * Users Presentation - UI Constants
 */

import { USER_ROLE_OPTIONS, USER_ROLE_CONFIG } from '../../domain/user-role.ui.js';

export { USER_ROLE_OPTIONS, USER_ROLE_CONFIG };

export const USERS_ROUTES = {
    LIST: '/users',
};

/** Fallback estático si GET /roles no está disponible (PLAN-04). */
export const USER_ROLE_OPTIONS_FALLBACK = USER_ROLE_OPTIONS;

export const TIPOS_DOCUMENTO = ['DNI', 'CE', 'Pasaporte'];

export const USERS_MESSAGES = {
    CREATE_SUCCESS: 'Usuario creado correctamente',
    UPDATE_SUCCESS: 'Usuario actualizado correctamente',
    DELETE_SUCCESS: 'Usuario eliminado correctamente',
    DELETE_ERROR:   'Error al eliminar usuario',
};
