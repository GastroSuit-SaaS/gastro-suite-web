import { useToast } from 'primevue/usetoast'

/**
 * Composable para gestionar notificaciones con PrimeVue Toast.
 * Proporciona funciones para mostrar distintos tipos de mensajes.
 */
export function useNotification() {
    const toast = useToast()

    /**
     * Notificación de éxito - Fabricio
     */
    const baseToast = (severity, message, title, life) => {
        toast.add({
            severity,
            summary:  title,
            detail:   message,
            life,
        });
    };

    const showSuccess = (message, title = 'Éxito', life = 3000) => {
        baseToast('success', message, title, life);
    };

    const showError = (message, title = 'Error', life = 6000) => {
        baseToast('error', message, title, life);
    };

    const showWarning = (message, title = 'Advertencia', life = 5000) => {
        baseToast('warn', message, title, life);
    };

    const showInfo = (message, title = 'Información', life = 4000) => {
        baseToast('info', message, title, life);
    };

    /**
     * Notificación personalizada.
     */
    const showCustom = (options = {}) => {
        toast.add({
            severity: options.severity ?? 'info',
            summary: options.summary ?? '',
            detail: options.detail ?? '',
            life: options.life ?? 3000,
            closable: options.closable ?? true,
            sticky: options.sticky ?? false
        })
    }

    /**
     * Elimina todas las notificaciones activas.
     */
    const clear = () => {
        toast.removeAllGroups()
    }

    return {
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showCustom,
        clear
    }
}
