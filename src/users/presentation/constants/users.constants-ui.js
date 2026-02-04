/**
 * Users Presentation - UI Constants
 * 
 * Constantes relacionadas con la presentación del módulo Users.
 * NO contienen lógica de negocio.
 * 
 * Ejemplos:
 * - Labels de roles
 * - Estados de usuario
 * - Mensajes de UI
 */

export const USERS_ROUTES = {
  LIST: '/users',
  CREATE: '/users/create',
  EDIT: '/users/edit',
  PROFILE: '/users/profile',
};

export const USER_ROLE_LABELS = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  WAITER: 'Mesero',
  CHEF: 'Chef',
  CASHIER: 'Cajero',
};

export const USER_STATUS_LABELS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
};

export const USERS_MESSAGES = {
  CREATE_SUCCESS: 'Usuario creado correctamente',
  UPDATE_SUCCESS: 'Usuario actualizado correctamente',
  DELETE_SUCCESS: 'Usuario eliminado correctamente',
  DELETE_ERROR: 'Error al eliminar usuario',
};
