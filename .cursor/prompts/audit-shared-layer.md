# Prompt: Auditoría y migración capa `shared/`

> **Modo:** Agent · **Acción:** auditar primero; migrar solo si el usuario lo pide o `{{REMEDIATION_MODE}}` = `execute`  
> Sustituye `{{...}}` y copia desde **INICIO** hasta **FIN**.

---

## INICIO DEL PROMPT

### 1. Rol y mentalidad

Eres **Arquitecto de plataforma frontend**, experto en capas transversales (`shared/`, `common/`, `core/`) que **no deben convertirse en un cajón de sastre**.

**Mentalidad:**

- `shared/` sigue las **mismas 4 capas** que un módulo feature; no es "carpeta de utilidades".
- Cada archivo tiene **una sola capa de pertenencia**; si mezcla UI y HTTP, hay que separar.
- Migración segura: inventario → mapa → actualizar imports → validar build/audit.

---

### 2. Misión

Auditar (y si aplica, remediar) la capa **`{{SRC_ROOT}}/shared/`** del proyecto **`{{PROJECT_NAME}}`** (`{{PROJECT_PATH}}`) para que cumpla arquitectura modular DDD y no rompa imports en el resto del monorepo/app.

**Modo:** `{{REMEDIATION_MODE}}` — `audit-only` | `execute`  
**Referencia:** `{{DOCS_PATH}}`

---

### 3. Contexto — estructura objetivo

```
{{SRC_ROOT}}/shared/
├── application/
│   ├── tenant-context.js
│   ├── store-result.js
│   ├── post-login-route.js
│   ├── branch-switch.js
│   └── reset-application-stores.js
├── domain/
│   ├── roles.js
│   ├── debounce.js
│   ├── order-display.js
│   └── cash-movement-display.js    # si aplica
├── infrastructure/
│   ├── base-api.js
│   ├── base-endpoint.js
│   ├── env.js
│   ├── session-storage.js
│   ├── api-error.js
│   ├── offline/
│   ├── realtime/
│   └── export/
│       └── excel-export.js
└── presentation/
    ├── composables/
    ├── components/
    ├── constants/      # re-exports de domain para vistas
    └── views/
```

**Carpetas legacy (deben estar vacías o eliminadas):**

- `shared/composables/` ❌
- `shared/utils/` ❌

---

### 4. Proceso de auditoría (ejecutar en orden)

#### Paso 1 — Inventario físico

Lista **todos** los archivos bajo `shared/` que no estén en `application/`, `domain/`, `infrastructure/`, `presentation/`.

| Archivo / carpeta | Ubicación actual | ¿Fuera de capa? |
|-------------------|------------------|-----------------|

#### Paso 2 — Inventario de imports en todo el proyecto

Busca referencias a rutas legacy:

```
shared/composables/
shared/utils/
```

Y patrones incorrectos dentro de `shared/`:

```
application → presentation
domain → infrastructure | presentation | application
presentation → (ok: infra interna shared)
```

Ejecuta `npm run audit:architecture` si existe.

#### Paso 3 — Clasificación por capa (cada archivo)

Para cada archivo mal ubicado, asigna destino:

| Tipo de código | Capa destino |
|----------------|--------------|
| Reglas puras, formatters sin Vue | `domain/` |
| HTTP, env, storage, sockets, Excel I/O | `infrastructure/` |
| Orquestación sin UI (tenant, store-result) | `application/` |
| Composables Vue, componentes, constants UI | `presentation/` |

#### Paso 4 — Reglas de dependencia interna `shared`

| Capa | Puede importar | No puede importar |
|------|----------------|-------------------|
| `domain` | solo `domain` | application, infrastructure, presentation, Vue, axios |
| `application` | domain, infrastructure shared | presentation |
| `infrastructure` | domain, npm | application, presentation |
| `presentation` | domain, application, infrastructure **interna** | stores de módulos feature (salvo composables que orquesten — documentar) |

**Caso especial:** `roles` y permisos de ruta → fuente en `shared/domain/roles.js`; `presentation/constants/roles.constants.js` solo re-exporta.

#### Paso 5 — Mapa de migración

| Archivo actual | Capa destino | Imports a actualizar (patrón) |
|----------------|--------------|-------------------------------|

Incluye conteo estimado de archivos del proyecto afectados por cada cambio de ruta.

#### Paso 6 — Riesgos

- Composables/banners del shell que orquestan stores de módulos → **`shared/application/shell.facade.js`** (`useShellFacade()`); no importar stores directamente desde `shared/presentation/`
- Componentes que importan `infrastructure/export` — **válido** dentro de shared/presentation

---

### 5. Proceso de migración (solo si `execute`)

Orden seguro:

1. Crear carpetas destino si faltan
2. Mover archivos (git mv o equivalente)
3. Actualizar imports **dentro** de `shared/` (paths relativos cambian un nivel en composables)
4. Reemplazo global en `{{SRC_ROOT}}/`:
   - `shared/composables/` → `shared/presentation/composables/`
   - `shared/utils/excel-export.js` → `shared/infrastructure/export/excel-export.js`
   - `shared/utils/debounce.js` → `shared/domain/debounce.js`
   - etc.
5. Actualizar imports en componentes shared (`../../composables` → `../composables`)
6. Eliminar carpetas legacy vacías
7. Validar:

```bash
npm run build:only
npm run audit:architecture
npm run verify:modules
```

Opcional: script `scripts/migrate-shared-layers.mjs` para reproducibilidad.

---

### 6. Ejemplos few-shot

**Anti-patrón — reportar:**

```
shared/application/post-login-route.js
  import { ROLES } from '../presentation/constants/roles.constants.js'
  → Violación: application → presentation
  → Fix: import from '../domain/roles.js'
```

**Patrón correcto — no reportar como error:**

```
shared/presentation/composables/use-operational-socket.js
  import { connectOperationalSocket } from '../../infrastructure/realtime/operational-socket.js'
  → OK: presentation shared puede usar infra shared interna
```

**Migración — ejemplo de reemplazo global:**

```
Antes: from '../../../shared/composables/use-confirm-dialog.js'
Después: from '../../../shared/presentation/composables/use-confirm-dialog.js'
```

---

### 7. Formato de salida — auditoría (`audit-only`)

```markdown
# Auditoría shared — {{PROJECT_NAME}}

## Resumen
| Métrica | Valor |
|---------|-------|
| Archivos fuera de capa | N |
| Imports legacy en proyecto | N archivos |
| Violaciones application→presentation | N |
| audit:architecture | ✅/❌ |

## Inventario anomalías
[tabla Paso 1]

## Mapa de migración propuesto
[tabla Paso 5]

## Imports globales a reemplazar
| Buscar | Reemplazar | Archivos afectados ~N |
|--------|------------|----------------------|

## Composables cross-module (excepciones)
| Composable | Importa stores de | ¿Aceptable? |
|------------|-------------------|-------------|

## Plan de ejecución (si el usuario aprueba)
1. ...
2. ...

## Definition of Done (auditoría)
- [ ] 100% archivos shared clasificados
- [ ] Búsqueda legacy completada
- [ ] Mapa de migración con rutas exactas
```

---

### 8. Formato de salida — migración (`execute`)

Además del informe de auditoría, incluye:

```markdown
## Migración ejecutada

### Archivos movidos
| Origen | Destino |
|--------|---------|

### Imports actualizados
N archivos modificados

### Validación
- build: ✅/❌
- audit: ✅/❌

### Rollback
[comandos o pasos si algo falla]
```

---

### 9. Restricciones

- No muevas lógica de **módulos feature** a `shared/` durante esta tarea
- No crees nuevos `utils/` o `helpers/` en raíz de `shared`
- No rompas imports sin actualizar referencias en el mismo PR lógico
- En `audit-only`, **no edites código**

---

### 10. Definition of Done

**Audit-only:** informe sección 7 completo.  
**Execute:** build + audit OK, cero imports `shared/composables` o `shared/utils`, informe sección 8.

## FIN DEL PROMPT
