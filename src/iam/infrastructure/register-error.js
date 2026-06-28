import { getApiErrorCode, getApiErrorMessage, getApiErrorStep } from '../../shared/infrustructure/api-error.js';
import { appLogger } from '../../shared/infrustructure/app-logger.js';

const LOG_SCOPE = 'IAM:Register';

/** Prefijos por paso del API (ProblemDetail property `step`). */
const STEP_HINTS = {
    COMPANY: 'Empresa',
    USER: 'Usuario administrador',
    EMPLOYEE: 'Vínculo con la empresa',
    SIGN_IN: 'Inicio de sesión',
};

/** Mensajes por código cuando el API no envía detail claro. */
const CODE_FALLBACKS = {
    CMP_ERROR: 'El RUC o la razón social ya están registrados, o los datos de empresa no son válidos.',
    USR_ERROR: 'El nombre de usuario ya existe o los datos del usuario no son válidos.',
    EMP_ERROR: 'No se pudo crear el perfil de empleado del administrador.',
    REG_COMPANY_ERROR: 'No se pudo registrar la empresa.',
    REG_USER_ERROR: 'No se pudo crear el usuario administrador.',
    REG_EMPLOYEE_ERROR: 'No se pudo vincular el administrador con la empresa.',
    REG_SIGN_IN_ERROR: 'No se pudo iniciar sesión tras crear la cuenta.',
    REG_EMAIL_VERIFY: 'El código de verificación es incorrecto o expiró. Solicita uno nuevo.',
    REG_EMAIL_VERIFY_RESEND: 'Debes esperar antes de solicitar otro código.',
    GEN_VALIDATION_ERROR: 'Revisa los datos del formulario.',
    AUTH_INVALID_CREDENTIALS: 'Credenciales incorrectas al iniciar sesión automática.',
};

/**
 * Mensaje legible para errores de POST /auth/register-owner.
 * @param {import('axios').AxiosError|Error} err
 * @param {string} fallback
 * @returns {string}
 */
export function resolveRegisterErrorMessage(err, fallback = 'No se pudo completar el registro. Intenta nuevamente.') {
    const data = err?.response?.data;
    const step = getApiErrorStep(err);
    const code = getApiErrorCode(err);
    const detail = getApiErrorMessage(err, '');

    if (detail && detail.length > 0 && detail !== 'Los datos de la peticion contienen errores de validacion.') {
        if (step && STEP_HINTS[step] && !detail.startsWith(STEP_HINTS[step])) {
            return `${STEP_HINTS[step]}: ${detail}`;
        }
        return detail;
    }

    if (code && CODE_FALLBACKS[code]) {
        const hint = step ? STEP_HINTS[step] : null;
        return hint ? `${hint}: ${CODE_FALLBACKS[code]}` : CODE_FALLBACKS[code];
    }

    if (step && STEP_HINTS[step]) {
        return `${STEP_HINTS[step]}: ${fallback}`;
    }

    const status = err?.response?.status;
    if (status === 409) {
        return 'Ya existe un registro con esos datos (RUC, razón social o nombre de usuario).';
    }
    if (status === 401) {
        return 'No se pudo iniciar sesión tras el registro. Prueba iniciar sesión manualmente.';
    }
    if (status === 400) {
        return 'Datos inválidos. Revisa el formulario e intenta de nuevo.';
    }
    if (status >= 500) {
        return 'Error del servidor durante el registro. Intenta más tarde.';
    }
    if (err?.message && !err?.response) {
        return err.message;
    }

    return fallback;
}

/**
 * Registra el error de registro (sin datos sensibles).
 * @param {import('axios').AxiosError|Error} err
 * @param {{ username?: string, ruc?: string }} context
 */
export function logRegisterFailure(err, context = {}) {
    const data = err?.response?.data;
    appLogger.error(LOG_SCOPE, 'Registro fallido', {
        status: err?.response?.status ?? null,
        step: data?.step ?? getApiErrorStep(err),
        code: data?.code ?? getApiErrorCode(err),
        detail: data?.detail ?? err?.message,
        username: context.username ?? undefined,
        ruc: context.ruc ? `${String(context.ruc).slice(0, 4)}***` : undefined,
    });
}
