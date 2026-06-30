# Skills — Arquitectura Vue DDD

Skills para que Cursor aplique automáticamente las reglas aprendidas en Gastro Suite Web.

| Skill | Cuándo se activa |
|-------|------------------|
| [vue-ddd-modular-monolith](./vue-ddd-modular-monolith/SKILL.md) | Referencia principal — auditoría, remediación, scaffolding |
| [vue-ddd-architecture-audit](./vue-ddd-architecture-audit/SKILL.md) | Solo auditoría (lectura + informe) |
| [vue-ddd-greenfield-scaffold](./vue-ddd-greenfield-scaffold/SKILL.md) | Proyecto o módulo nuevo desde cero |
| [vue-ddd-architecture-remediation](./vue-ddd-architecture-remediation/SKILL.md) | Ejecutar remediación por fases |

## Uso global (todos tus proyectos)

Copia la carpeta `skills/` a `~/.cursor/skills/`:

```powershell
Copy-Item -Recurse ".cursor\skills\*" "$env:USERPROFILE\.cursor\skills\"
```

## Uso en este repo

Los skills en `.cursor/skills/` del proyecto se comparten con el equipo vía git.

## Contenido del skill principal

- `SKILL.md` — reglas, patrones, checklist
- `reference.md` — matriz imports, fases, shared migration
- `examples.md` — casos reales Gastro Suite
- `scripts/audit-architecture.mjs` — plantilla portable (sincronizar con `scripts/` del repo al portar)
- `scripts/verify-modules-compliance.mjs` — en repo: `npm run verify:modules`
