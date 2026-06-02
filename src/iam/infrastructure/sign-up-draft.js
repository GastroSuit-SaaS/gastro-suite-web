/** Borrador del wizard de registro (solo sessionStorage — se limpia al cerrar pestaña). */
const STORAGE_KEY = 'gs_sign_up_draft';

/**
 * @returns {{ currentStep: number, empresa: object|null, usuario: object|null }|null}
 */
export function loadSignUpDraft() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
            currentStep: Number(parsed.currentStep) || 1,
            empresa: parsed.empresa ?? null,
            usuario: parsed.usuario ?? null,
        };
    } catch {
        return null;
    }
}

/**
 * @param {{ currentStep: number, empresa: object|null, usuario: object|null }} draft
 */
export function saveSignUpDraft(draft) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            currentStep: draft.currentStep,
            empresa: draft.empresa,
            usuario: draft.usuario,
            updatedAt: Date.now(),
        }));
    } catch {
        /* quota / private mode — ignorar */
    }
}

export function clearSignUpDraft() {
    sessionStorage.removeItem(STORAGE_KEY);
}
