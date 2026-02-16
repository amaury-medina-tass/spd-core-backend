# SPD Core Backend

Sistema de Planificación del Desarrollo - Backend API y Worker

## Descripción

Monorepo NestJS con dos aplicaciones:

- **spd-core-api**: API REST principal (puerto 3003)
- **spd-core-worker**: Worker para procesamiento en segundo plano y sincronización SAP

## Arquitectura

```text
[Cliente] ──▶ [spd-core-api] ──┬─▶ [(PostgreSQL)]
                               │
                               ├─▶ [(Cosmos DB - Auditoría)]
                               │
                               ▼
                     [Azure Service Bus]
                               ▲
                               │
[spd-core-worker] ─────────────┴─▶ [Sistema SAP]
        │
        └───────▶ [(PostgreSQL)]
```

## Estructura del Proyecto

```
spd-core-backend/
├── apps/
│   ├── spd-core-api/             # API Principal (REST)
│   │   └── src/
│   │       ├── auth/             # Autenticación JWT y guards
│   │       ├── common/           # Decorators, Filters, Guards compartidos
│   │       ├── config/           # Configuración (Env, Validation)
│   │       ├── database/         # Configuración DB
│   │       ├── financial/        # Módulos Financieros
│   │       │   ├── budget-records/         # Pedidos
│   │       │   ├── cdps/                   # CDPs y posiciones
│   │       │   ├── contract-cdp-relations/ # Relación Contrato-CDP
│   │       │   ├── contract-positions/     # Posiciones de contrato
│   │       │   ├── contractors/            # Contratistas
│   │       │   ├── dependencies/           # Dependencias
│   │       │   ├── funding-sources/        # Fuentes de financiación
│   │       │   ├── master-contracts/       # Contratos marco
│   │       │   ├── needs/                  # Necesidades
│   │       │   ├── previous-studies/       # Estudios previos
│   │       │   └── projects/               # Proyectos
│   │       ├── masters/          # Maestros y Configuración
│   │       │   ├── budget-modifications/   # Modificaciones pptales
│   │       │   ├── detailed-activities/    # Actividades detalladas
│   │       │   ├── indicators/             # Indicadores
│   │       │   ├── mga-activities/         # Actividades MGA
│   │       │   ├── products/               # Productos
│   │       │   ├── rubrics/                # Posiciones Presupuestales
│   │       │   └── variables/              # Variables
│   │       ├── sub/              # Submódulos auxiliares
│   │       ├── sap-sync/         # Endpoints Integración SAP
│   │       └── outbox/           # Patrón Outbox
│   │
│   └── spd-core-worker/          # Worker (Segundo plano)
│       └── src/
│           ├── outbox/           # Procesador Outbox
│           ├── messaging/        # Subscriber Service Bus
│           └── sap-sync/         # Procesamiento Sincronización SAP
│
├── libs/
│   └── common/                   # Librerías compartidas
│       └── src/
│           ├── entities/         # Entidades base y compartidas
│           ├── messaging/        # Service Bus Publisher
│           ├── redis/            # Cliente Redis
│           └── types/            # Interfaces y tipos compartidos
```

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- Azure Cosmos DB (para logs de auditoría)
- Docker Desktop

## Instalación

1. Instalar dependencias:

   ```bash
   npm install
   # o
   bun install
   ```

2. Configurar variables de entorno:
   Copiar `.env.example` a `.env` y configurar las variables.

   **Autenticación:**
   La variable `JWT_ACCESS_PUBLIC_KEY` se debe extraer utilizando la herramienta o script disponible en el microservicio de Autenticación (Auth).

   **Auditoría:**
   Es necesario configurar la conexión a Azure Cosmos DB para el registro de logs de auditoría.

## Ejecución del Proyecto

Para iniciar la infraestructura completa, ejecute el siguiente comando desde la carpeta de infraestructura:

```powershell
# Desde la carpeta /infra del proyecto
docker compose up --build
```

### Ejecución Local (Solo Desarrollo)

Si desea ejecutar servicios individuales:

```bash
# API (puerto 3003)
npm run start:api:dev
# o
bun run start:api:dev

# Worker (background)
npm run start:worker:dev
# o
bun run start:worker:dev
```

## Scripts Disponibles

| Script             | Descripción                 | Comando (npm / bun)                    |
| ------------------ | --------------------------- | -------------------------------------- |
| `start:api`        | Iniciar API                 | `npm run start:api` / `bun ...`        |
| `start:api:dev`    | Iniciar API (watch mode)    | `npm run start:api:dev` / `bun ...`    |
| `start:worker`     | Iniciar Worker              | `npm run start:worker` / `bun ...`     |
| `start:worker:dev` | Iniciar Worker (watch mode) | `npm run start:worker:dev` / `bun ...` |
| `build`            | Compilar proyecto           | `npm run build` / `bun run build`      |
| `lint`             | Ejecutar ESLint             | `npm run lint` / `bun run lint`        |
| `test`             | Ejecutar tests              | `npm run test` / `bun run test`        |

## Endpoints Principales

### Financial

- `GET/POST /financial/cdps` - CDPs
- `GET/POST /financial/contractors` - Contratistas
- `GET/POST /financial/dependencies` - Dependencias
- `GET/POST /financial/funding-sources` - Fuentes de financiación
- `GET/POST /financial/master-contracts` - Contratos marco
- `GET/POST /financial/projects` - Proyectos

### Masters

- `GET/POST /masters/indicators` - Indicadores
- `GET/POST /masters/variables` - Variables
- `GET/POST /masters/rubrics` - Posiciones Presupuestales
- `GET/POST /masters/products` - Productos
