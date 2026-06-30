# Kit de agente — Arquitectura Vue DDD

Recursos para **auditar**, **remediar** y **crear desde cero** proyectos con arquitectura modular. Los prompts aplican **role prompting**, procesos en fases, criterios de evidencia y plantillas de salida fijas.

## Carpetas

| Carpeta | Uso |
|---------|-----|
| [`prompts/`](./prompts/) | Prompts listos para copiar (bloque INICIO → FIN) |
| [`skills/`](./skills/) | Skills del agente (activación por descripción o mención) |

## Uso rápido

1. Abre el prompt en `prompts/`.
2. Sustituye `{{PROJECT_NAME}}`, `{{SRC_ROOT}}`, etc. (ver `prompts/README.md`).
3. Copia **solo** el bloque entre `## INICIO DEL PROMPT` y `## FIN DEL PROMPT`.
4. Pega en **Cursor Agent** con el workspace del proyecto abierto.

| Objetivo | Prompt |
|----------|--------|
| Auditar repo existente | `prompts/audit-architecture.md` |
| Proyecto nuevo | `prompts/greenfield-project.md` |
| Corregir deuda | `prompts/remediate-architecture.md` (`{{REMEDIATION_MODE}}`: `execute` o `plan-only`) |
| Solo capa shared | `prompts/audit-shared-layer.md` |

## Documentación canónica (este repo)

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — incluye §3.3 `shell.facade.js`
- [`scripts/audit-architecture.mjs`](../scripts/audit-architecture.mjs)
- [`scripts/verify-modules-compliance.mjs`](../scripts/verify-modules-compliance.mjs)

## Portar a otro repositorio

```text
.cursor/prompts/
.cursor/skills/
scripts/audit-architecture.mjs
docs/ARCHITECTURE.md   (plantilla)
```

```json
"audit:architecture": "node scripts/audit-architecture.mjs",
"verify:modules": "node scripts/verify-modules-compliance.mjs"
```

## Técnicas de prompt incluidas

- Rol + mentalidad con límites explícitos
- Misión única medible
- Proceso secuencial (chain-of-thought) antes del entregable
- Checklists con criterios de verificación en código
- Few-shot de violaciones vs excepciones
- Anti-alucinación: sin evidencia de archivo, sin hallazgo
- Definition of Done por prompt
