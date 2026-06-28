import { getApiErrorCode, getApiErrorMessage } from '../../shared/infrustructure/api-error.js';

const CODE_FALLBACKS = {
    PWD_RESET_NOT_FOUND: 'No existe una cuenta asociada a este correo o usuario.',
    PWD_RESET_VERIFY: 'El código es incorrecto, expiró o no existe. Solicita uno nuevo.',
    REG_EMAIL_VERIFY_RESEND: 'Debes esperar antes de solicitar otro código.',
};

/**
 * Mensaje legible para errores de recuperación de contraseña.
 * @param {import('axios').AxiosError|Error} err
 * @param {string} fallback
 * @returns {string}
 */
export function resolvePasswordResetErrorMessage(err, fallback) {
    const code = getApiErrorCode(err);
    const detail = getApiErrorMessage(err, '');

    if (detail && detail.length > 0 && detail !== 'Los datos de la peticion contienen errores de validacion.') {
        return detail;
    }

    if (code && CODE_FALLBACKS[code]) {
        return CODE_FALLBACKS[code];
    }

    const status = err?.response?.status;
    if (status === 429) {
        return CODE_FALLBACKS.REG_EMAIL_VERIFY_RESEND;
    }
    if (status === 404) {
        return CODE_FALLBACKS.PWD_RESET_NOT_FOUND;
    }
    if (status === 400) {
        return fallback;
    }

    return fallback;
}
