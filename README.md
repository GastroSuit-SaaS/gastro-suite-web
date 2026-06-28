# Gastro Suite Web

SPA operativa de **Gastro Suite** — Vue 3 + Vite + Pinia + PrimeVue.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/KNOWLEDGE-BASE.md](./docs/KNOWLEDGE-BASE.md) | **Base de conocimiento profunda (Web)** |
| [docs/TECHNICAL.md](./docs/TECHNICAL.md) | Documentación técnica del frontend |
| [docs/INTEGRATION.md](./docs/INTEGRATION.md) | Matriz de integración con el API |
| [docs/ACTION-PLAN.md](./docs/ACTION-PLAN.md) | Tracking de brechas |
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

Ver `.env.example` y `src/shared/infrustructure/env.js` para la lista completa.

## Build y deploy

```bash
npm run build          # dist/ + verificaciones
npm run deploy:pages   # Cloudflare Pages (Wrangler)
```

## Stack

Vue 3 · Vite 7 · Pinia · Vue Router · PrimeVue 4 · Axios · STOMP
