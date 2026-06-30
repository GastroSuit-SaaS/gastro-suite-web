# Gastro Suite Web

SPA operativa de **Gastro Suite** — Vue 3 + Vite + Pinia + PrimeVue.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | **Arquitectura canónica** — capas DDD, facades, shell.facade |
| [docs/KNOWLEDGE-BASE.md](./docs/KNOWLEDGE-BASE.md) | **Base de conocimiento profunda (Web)** |
| [docs/TECHNICAL.md](./docs/TECHNICAL.md) | Documentación técnica del frontend |
| [docs/INTEGRATION.md](./docs/INTEGRATION.md) | Matriz de integración con el API |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | **Arquitectura canónica** — capas DDD, facades, shell.facade |
| [docs/ACTION-PLAN.md](./docs/ACTION-PLAN.md) | Tracking de brechas (incl. PLAN-36 remediación DDD ✅) |
| [docs/IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md) | Plan de implementación detallado |

Índice global + KB API: `gastro-suite-api/docs/KNOWLEDGE-BASE-INDEX.md`

## Requisitos

- Node.js 20+
- API corriendo en `http://localhost:8080`

## Desarrollo local

```bash
npm install
cp .env.example .env   # opcional; dev usa localhost:8080 por defecto
npm run dev            # http://localhost:5173
```

## Variables de entorno

```env
VITE_PLATFORM_API_URL=http://localhost:8080/api/v1
VITE_WS_OPERATIONAL_URL=ws://localhost:8080/ws/operational
```

Ver `.env.example` y `src/shared/infrastructure/env.js` para la lista completa.

## Build y deploy

```bash
npm run build          # dist/ + verificaciones
npm run build:only     # solo vite build
npm run audit:architecture   # reglas de capas y shell
npm run verify:modules       # cumplimiento por módulo feature (15/15)
npm run deploy:pages   # Cloudflare Pages (Wrangler)
```

## Stack

Vue 3 · Vite 7 · Pinia · Vue Router · PrimeVue 4 · Axios · STOMP
