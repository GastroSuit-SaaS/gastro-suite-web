/**
 * Ensambla recursos REST de rol → nombres de rol del dominio backend.
 */
export class RoleAssembler {
    /**
     * @param {Array<{ roleId?: string, name?: string }>|null|undefined} data
     * @returns {string[]}
     */
    static toRoleNames(data) {
        if (!Array.isArray(data)) return [];
        return data
            .map((item) => item?.name)
            .filter(Boolean);
    }
}
