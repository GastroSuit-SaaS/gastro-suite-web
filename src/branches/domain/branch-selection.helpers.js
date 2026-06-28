/**
 * Devuelve la sucursal activa más antigua (primera creada).
 * Fallback: orden alfabético por código.
 * @param {import('./models/branch.entity.js').Branch[]} branches
 */
export function pickOldestActiveBranch(branches) {
    if (!branches?.length) return null;

    const sorted = [...branches].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
        if (ta !== tb) return ta - tb;
        return String(a.codigo ?? a.id ?? '').localeCompare(String(b.codigo ?? b.id ?? ''));
    });

    return sorted[0] ?? null;
}
