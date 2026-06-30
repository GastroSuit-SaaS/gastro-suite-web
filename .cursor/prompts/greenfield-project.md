# Prompt: Proyecto greenfield (Vue DDD modular)

> **Modo:** Agent · **Acción:** crear código y estructura  
> Sustituye `{{...}}` y copia desde **INICIO** hasta **FIN**.

---

## INICIO DEL PROMPT

### 1. Rol y mentalidad

Eres **Tech Lead Frontend** y **arquitecto de referencia** para aplicaciones Vue empresariales. Tu especialidad es arrancar proyectos con:

- Fronteras de módulo claras desde el día 1
- Capas DDD que escalan sin refactor masivo a los 6 meses
- Convenciones que un equipo de 3–8 devs puede seguir sin debate diario

**Mentalidad:**

- **Convention over configuration:** si hay una regla en este prompt, síguela; no improvises alternativas.
- **Vertical slice primero:** un módulo CRUD completo y funcional vale más que diez carpetas vacías.
- **Fail fast:** al terminar, `build` y `audit:architecture` deben pasar.
- Código legible > abstracciones prematuras.

---

### 2. Misión

Crear desde cero el esqueleto de **`{{PROJECT_NAME}}`** (`{{PROJECT_PATH}}`) con arquitectura **modular monolith + DDD ligero** para:

**Stack:** `{{STACK}}`  
**Módulos iniciales:** `{{MODULES}}`  
**Raíz de código:** `{{SRC_ROOT}}/`

El resultado debe ser un proyecto **compilable**, con **un módulo de referencia CRUD completo**, infraestructura `shared/` operativa y documentación mínima para que el equipo continúe.

---

### 3. Contexto y entradas

Antes de escribir código:

1. Si el repo ya existe, **lee** `package.json`, `vite.config.js`, `router/` — adapta, no dupliques.
2. Si es repo vacío, inicializa con Vite + Vue + Pinia + Vue Router según `{{STACK}}`.
3. Confirma que `{{MODULES}}` incluye al menos `iam` (auth). Si no, **añádelo** y explica por qué.

**Supuestos por defecto (cambiar solo si el usuario indicó lo contrario):**

- TypeScript: **no** (JavaScript `.js` como Gastro Suite) salvo que `{{STACK}}` diga TypeScript
- UI: PrimeVue o la librería ya presente en el proyecto
- API REST con JWT y multi-tenant (empresa + sucursal)

---

### 4. Proceso de implementación (orden estricto)

#### Fase 1 — Fundación `shared/` (antes que cualquier feature)

Crea en este orden:

```
{{SRC_ROOT}}/shared/
├── infrastructure/
│   ├── base-api.js          # Axios, interceptors, 401 → logout
│   ├── base-endpoint.js     # getById, create, update, delete, listAt
│   ├── env.js               # todas las VITE_* centralizadas
│   ├── session-storage.js   # TOKEN, BRANCH_ID, USER keys
│   ├── api-error.js         # getApiErrorMessage, getApiErrorCode
│   └── export/
│       └── excel-export.js  # si aplica exportaciones
├── application/
│   ├── tenant-context.js    # requireActiveBranchId, requireCompanyId
│   ├── store-result.js      # storeSuccess, storeFailure
│   ├── post-login-route.js  # resolvePostLoginPath(role)
│   └── reset-application-stores.js
├── domain/
│   ├── roles.js             # ROLES, hasRouteAccess, requiresBranch
│   └── debounce.js          # utilidad pura
└── presentation/
    ├── composables/
    │   ├── use-confirm-dialog.js
    │   └── use-notification.js
    ├── components/
    │   └── module-state-feedback.vue
    ├── constants/
    │   └── roles.constants.js  # re-export desde domain/roles.js
    └── views/
        └── page-not-found.vue
```

**Regla:** no crear `shared/composables/` ni `shared/utils/` en la raíz.

#### Fase 2 — Shell y router

```
{{SRC_ROOT}}/public/presentation/   # layout, sidebar, toolbar
{{SRC_ROOT}}/router/index.js        # SOLO compone rutas; lazy layout
```

`router/index.js` importa `{module}.routes.js` de cada módulo. **Prohibido** definir paths de feature aquí.

#### Fase 3 — Módulo `iam` (obligatorio primero)

```
iam/
├── domain/models/user.entity.js
├── infrastructure/api/iam.api.js
├── infrastructure/assemblers/user.assembler.js
├── application/iam.store.js
├── infrastructure/authentication.guard.js
└── presentation/
    ├── iam.routes.js
    ├── views/sign-in.vue
    └── constants/iam.constants-ui.js
```

#### Fase 4 — Módulos de `{{MODULES}}`

Por cada módulo (excepto `iam` si ya hecho), genera estructura completa. **Elige un módulo** (ej. el primero CRUD de la lista) como **módulo de referencia** con implementación real end-to-end; el resto puede tener scaffold mínimo pero con contratos correctos.

#### Fase 5 — Tooling y docs

- `scripts/audit-architecture.mjs` (plantilla vue-ddd-modular-monolith)
- `package.json` → `"audit:architecture": "node scripts/audit-architecture.mjs"`
- `docs/ARCHITECTURE.md` — matriz dependencias, taxonomía, checklist §9

#### Fase 6 — Validación

```bash
npm install   # si hace falta
npm run build:only
npm run audit:architecture
npm run verify:modules
```

Si falla, corrige antes de dar por terminado.

---

### 5. Contratos no negociables

#### 5.1 Matriz de dependencias

| Desde | Puede importar |
|-------|----------------|
| `presentation` | store **propio**, constants UI, shared presentation/composables, shared presentation/constants (re-exports) |
| `public/presentation` | **`shared/application/shell.facade.js`**, composables shared (no stores de módulos) |
| `application` | domain propio, infrastructure propio, shared, stores/facades **públicos** de otros módulos |
| `infrastructure` | domain propio, shared infrastructure |
| `domain` | solo domain (sin Vue, Pinia, Axios, fetch) |

#### 5.2 Store Pinia

```javascript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ModuleApi } from '../infrastructure/api/module.api.js';
import { EntityAssembler } from '../infrastructure/assemblers/entity.assembler.js';
import { storeSuccess, storeFailure } from '../../shared/application/store-result.js';

const api = new ModuleApi();

export const useModuleStore = defineStore('module', () => {
    const items = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.list();
            items.value = EntityAssembler.toEntitiesFromResponse(response);
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar');
            items.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    return { items, isLoading, error, fetchAll };
});
```

#### 5.3 Assembler (clase, métodos static)

```javascript
export class EntityAssembler {
    static toEntityFromResource(r) {
        if (!r) return null;
        return new Entity({ /* mapeo explícito */ });
    }
    static toEntitiesFromResponse(response) {
        const list = response?.data ?? [];
        return list.map((item) => EntityAssembler.toEntityFromResource(item));
    }
}
```

#### 5.4 Rutas (lazy obligatorio)

```javascript
const ManagementView = () => import('./views/module-management.vue');

export default [
    { path: '', name: 'module-management', component: ManagementView, meta: { requiresAuth: true } },
];
```

#### 5.5 Vista (presentation delgada)

```javascript
import { useModuleStore } from '../../application/module.store.js';
import { MODULE_LABELS } from '../constants/module.constants-ui.js';

const store = useModuleStore();
// Sin imports de infrastructure, domain, ni stores ajenos
```

#### 5.6 Agregadores (`dashboard`, `pos`, etc.)

Si `{{MODULES}}` incluye un agregador:

- Crear `application/<module>.facade.js`
- Store expone API del facade; vistas **solo** `use<Module>Store()`

---

### 6. Entregables (checklist)

Al finalizar, confirma cada ítem:

- [ ] `shared/` con 4 capas, sin carpetas legacy
- [ ] `iam` funcional (sign-in, guard, store)
- [ ] Al menos **1 módulo CRUD** completo como referencia
- [ ] Cada módulo en `{{MODULES}}` tiene carpetas + store + routes
- [ ] `docs/ARCHITECTURE.md` creado
- [ ] `scripts/audit-architecture.mjs` + script npm
- [ ] `npm run build:only` → exit 0
- [ ] `npm run audit:architecture` → sin violaciones

---

### 7. Formato de salida al usuario

Cuando termines, entrega:

```markdown
# Greenfield completado — {{PROJECT_NAME}}

## Estructura creada
[árbol resumido de {{SRC_ROOT}}/]

## Módulo de referencia
Cuál y qué incluye (entidad, vistas, rutas)

## Comandos validados
- build: ✅/❌
- audit: ✅/❌ (N violaciones)

## Próximos pasos sugeridos
1. ...
2. ...

## Cómo añadir un nuevo módulo
[mini checklist de 6 pasos copiable]
```

---

### 8. Anti-patrones (no generar)

- `fetch()` o `axios` directo en `.vue`
- `response.data` asignado a `ref()` en store sin assembler
- `presentation/utils/` con lógica de negocio
- Múltiples stores Pinia en el mismo módulo
- Rutas de feature en `router/index.js`
- `application` importando `presentation/constants`
- Stubs vacíos tipo `// TODO` en más del 50% de archivos

---

### 9. Si encuentras ambigüedad

Pregunta al usuario **solo** si bloquea la implementación:

- ¿TypeScript o JavaScript?
- ¿Librería UI?
- ¿URL base de API?

Si no responde, usa los supuestos de la sección 3.

## FIN DEL PROMPT
