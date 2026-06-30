# Prompts — Arquitectura Vue DDD modular

Prompts diseñados con **role prompting**, **chain-of-thought**, **criterios de salida explícitos** y **plantillas estructuradas**. Optimizados para Cursor Agent.

## Cómo usarlos

1. Abre el archivo del prompt que necesites.
2. Sustituye los placeholders `{{...}}` (tabla abajo).
3. Copia **todo el bloque** entre `## INICIO DEL PROMPT` y `## FIN DEL PROMPT`.
4. Pégalo en Cursor en **Agent mode**.
5. Adjunta el workspace del proyecto objetivo (o indica la ruta absoluta).

## Índice

| Archivo | Cuándo usarlo | Modo recomendado |
|---------|---------------|------------------|
| [audit-architecture.md](./audit-architecture.md) | Evaluar cumplimiento en repo existente | Agent (solo lectura) |
| [greenfield-project.md](./greenfield-project.md) | Crear proyecto o módulos desde cero | Agent |
| [remediate-architecture.md](./remediate-architecture.md) | Corregir deuda arquitectónica por fases | Agent |
| [audit-shared-layer.md](./audit-shared-layer.md) | Auditar/migrar solo `shared/` | Agent |

## Placeholders

| Placeholder | Descripción | Ejemplo |
|-------------|-------------|---------|
| `{{PROJECT_NAME}}` | Nombre del proyecto o repo | `gastro-suite-web` |
| `{{PROJECT_PATH}}` | Ruta absoluta al repo (opcional) | `C:/dev/mi-app` |
| `{{SRC_ROOT}}` | Carpeta raíz del código fuente | `src` |
| `{{STACK}}` | Stack tecnológico | `Vue 3 + Vite + Pinia + Vue Router` |
| `{{MODULES}}` | Lista de módulos a crear o auditar | `iam, menu, inventory, pos` |
| `{{DOCS_PATH}}` | Doc canónica de arquitectura | `docs/ARCHITECTURE.md` |
| `{{AUDIT_SCOPE}}` | Alcance: `full` \| `modules: a,b` \| `exclude: platform` | `full` |
| `{{REMEDIATION_MODE}}` | `execute` \| `plan-only` | `execute` |

## Técnicas aplicadas en cada prompt

- **Rol + mentalidad** — persona experta con límites claros
- **Misión única** — un objetivo medible por ejecución
- **Contexto explícito** — variables y supuestos declarados
- **Proceso en fases** — pensar antes de concluir (no saltar al informe)
- **Criterios de evidencia** — cada hallazgo con ruta de archivo
- **Plantilla de salida** — formato fijo para comparar auditorías
- **Anti-alucinación** — "si no verificaste en código, no lo reportes"
- **Definition of Done** — cuándo dar por terminada la tarea

## Skills complementarios

Los prompts funcionan mejor si el agente tiene acceso a `.cursor/skills/vue-ddd-modular-monolith/`.
