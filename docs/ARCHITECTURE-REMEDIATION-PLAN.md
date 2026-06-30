# Plan de Remediación Arquitectónica — Archivado

> **Estado:** ✅ Ejecutado · **Cierre:** 2026-06-29  
> **Ítem de seguimiento:** [ACTION-PLAN.md § PLAN-36](./ACTION-PLAN.md#plan-36--remediación-ddd-frontend-web)

## Reglas vigentes

Usar **[ARCHITECTURE.md](./ARCHITECTURE.md)** (§3–§3.3 shell facade, §8 excepciones) como única fuente activa de arquitectura.

Validación continua:

```bash
npm run audit:architecture
npm run verify:modules
npm run build:only
```

## Resultado del cierre

| Validación | Estado |
|------------|--------|
| `npm run audit:architecture` | ✅ sin violaciones |
| `npm run verify:modules` | ✅ 15/15 módulos feature |
| `npm run build:only` | ✅ OK |
| Shell facade | ✅ `shared/application/shell.facade.js` (EX-02 cerrada) |
| Facades cross-module | ✅ pos, dashboard, users, tables, menu, stations, branches, company, inventory, reports, platform |

## Plan histórico completo

El documento de trabajo original (fases ARC-00–ARC-6, backlog de auditoría, estimaciones) se conserva sin edición activa en:

**[archive/ARCHITECTURE-REMEDIATION-PLAN.md](./archive/ARCHITECTURE-REMEDIATION-PLAN.md)**

No ampliar este stub ni el archivo archivado para nuevas reglas; actualizar `ARCHITECTURE.md` y los prompts en `.cursor/`.
