/** Claves de sesión en localStorage (IAM + BaseApi + stores). */
export const SESSION_KEYS = Object.freeze({
    TOKEN: 'gs_token',
    BRANCH_ID: 'gs_branch_id',
    BRANCH_NAME: 'gs_branch_name',
    USER: 'gs_user',
});

export function clearSessionStorage() {
    Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key));
}


