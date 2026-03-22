# 🏗️ Estrutura do Projeto

Visão geral da arquitetura e organização do Universal Base Project.

> **Stack:** Node.js + Express + TypeScript + TypeORM + PostgreSQL + Winston + tsyringe

## 📂 Raiz do Projeto

```
project-schema/
├── docs/                             # 📚 Documentação (você está aqui)
├── backend/                          # 🔙 Código backend
│   ├── src/
│   │   ├── core/                    # Núcleo da aplicação
│   │   ├── infra/                   # Infraestrutura
│   │   ├── modules/                 # Módulos por domínio
│   │   └── server.ts               # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                         # 🎨 Código frontend (Angular)
└── readme.md
```

## 🔙 Backend - Estrutura Detalhada

```
backend/src/
├── server.ts                         # Entry point: bootstrap, graceful shutdown
│
├── core/                             # Núcleo independente (sem deps de infra)
│   ├── errors/
│   │   └── AppError.ts              # Classes de erro (AppError, NotFoundError…)
│   ├── middlewares/
│   │   ├── errorMiddleware.ts       # Handler global de erros
│   │   └── logMiddleware.ts         # Log HTTP de requisições
│   └── utils/
│       └── logger.ts                # Winston com níveis customizados
│
├── infra/                            # Infraestrutura (Express, DB, DI)
│   ├── container/
│   │   └── index.ts                 # Container DI global (tsyringe)
│   ├── database/
│   │   └── DataSource.ts            # TypeORM DataSource (PostgreSQL)
│   └── https/
│       ├── app.ts                   # Classe App (Express + middlewares + rotas)
│       └── routes/
│           └── routes.ts            # Router raiz: monta rotas dos módulos
│
└── modules/                          # Cada domínio é um módulo
    └── users/                        # Exemplo de módulo
        ├── container/
        │   └── index.ts             # Registra bindings do módulo no tsyringe
        ├── dtos/
        │   ├── CreateUserDTO.ts     # Interface TypeScript pura
        │   ├── UpdateUserDTO.ts
        │   └── UserResponseDTO.ts
        ├── interfaces/
        │   └── IUser.ts             # Interface do modelo
        ├── repositories/
        │   └── IUsersRepository.ts  # Contrato do repositório
        ├── services/
        │   └── index.ts             # Todos os services do módulo
        ├── infra/
        │   ├── database/
        │   │   ├── schemas/
        │   │   │   └── User.ts      # Entidade TypeORM
        │   │   └── repositories/
        │   │       └── TypeORMUsersRepository.ts
        │   └── https/
        │       ├── controllers/
        │       │   └── UsersController.ts
        │       └── routes/
        │           └── users.routes.ts
        ├── index.ts                  # Exports do módulo
        └── README.md
```

### `core/`

Núcleo puro da aplicação. Sem dependências de banco ou infraestrutura.

- **errors/** — Classes `AppError` e subclasses. Usadas em qualquer camada.
- **middlewares/** — `errorMiddleware` (intercepta erros Express) e `logMiddleware` (loga cada request).
- **utils/logger.ts** — Winston configurado com níveis customizados e rotação de arquivos.

### `infra/`

Implementações de infraestrutura que dependem de libs externas.

- **container/** — Registra os bindings de DI globais. Importado no `server.ts`.
- **database/DataSource.ts** — Configura e inicializa o TypeORM com PostgreSQL.
- **https/app.ts** — Classe `App` que monta o Express com todos os middlewares e rotas.
- **https/routes/routes.ts** — Router raiz: agrega as rotas de todos os módulos.

### `modules/`

**Cada domínio é completamente independente.** Um módulo novo segue exatamente a mesma estrutura.

| Pasta                          | Responsabilidade                                        |
| ------------------------------ | ------------------------------------------------------- |
| `container/`                   | Bindings de DI específicos do módulo                    |
| `dtos/`                        | Interfaces TypeScript de entrada/saída                  |
| `interfaces/`                  | Interface do modelo de domínio                          |
| `repositories/`                | Contrato (interface) do repositório                     |
| `services/`                    | Lógica de negócio (um service por operação)             |
| `infra/database/schemas/`      | Entidade TypeORM                                        |
| `infra/database/repositories/` | Implementação TypeORM do repositório                    |
| `infra/https/controllers/`     | Controller HTTP (converte request → service → response) |
| `infra/https/routes/`          | Definição de rotas Express                              |

## 🎨 Frontend - Estrutura Detalhada

```
frontend/src/app/
├── core/                           # Singletons (carregado uma vez)
│   ├── interceptors/
│   ├── models/
│   └── services/
│
├── shared/                         # Componentes reutilizáveis
│   ├── components/
│   ├── directives/
│   └── pipes/
│
├── features/                       # Módulos independentes (lazy-loading)
│   └── users/
│       ├── components/
│       └── pages/
│
└── data/
    └── schemas/                    # Contratos TypeScript/interfaces de resposta
```

## 🔗 Fluxo de uma Requisição

### `POST /api/users`

```
1. Frontend → HTTP POST /api/users
         ↓
2. Express Router → UsersController.create
         ↓
3. Controller → container.resolve(CreateService)
         ↓
4. CreateService.execute(req.body)
   ├─ Verifica e-mail duplicado
   ├─ Hash da senha (bcryptjs)
   └─ usersRepository.create()
         ↓
5. TypeORMUsersRepository → INSERT INTO users
         ↓
6. Service mapeia User → UserResponseDTO (sem passwordHash)
         ↓
7. Controller → res.status(201).json(userResponse)
         ↓
8. logMiddleware registra: POST /api/users 201 — 48ms
```

### Se erro: `POST /api/users` com e-mail duplicado

```
4. CreateService.execute
   └─ throw new ConflictError("E-mail já cadastrado.")
         ↓
5. express-async-errors → next(error)
         ↓
6. errorMiddleware
   ├─ instanceof AppError? SIM
   ├─ log.warn(error.message, { statusCode: 409, originFile })
   └─ res.status(409).json({ success: false, title, message })
         ↓
7. logMiddleware: POST /api/users 409 — 12ms
```

## 🔐 Camadas e Responsabilidades

| Camada                   | Arquivo                                                 | Responsabilidade                      |
| ------------------------ | ------------------------------------------------------- | ------------------------------------- |
| **Schema**               | `infra/database/schemas/User.ts`                        | Modelo TypeORM, mapeamento de colunas |
| **Repository Interface** | `repositories/IUsersRepository.ts`                      | Contrato agnóstico a banco            |
| **Repository Impl**      | `infra/database/repositories/TypeORMUsersRepository.ts` | Queries TypeORM reais                 |
| **Service**              | `services/index.ts`                                     | Regras de negócio, orquestração       |
| **Controller**           | `infra/https/controllers/UsersController.ts`            | Parsing HTTP, delegação ao service    |
| **Routes**               | `infra/https/routes/users.routes.ts`                    | Mapeamento de verbos/paths            |

## 📜 Path Aliases

Imports limpos configurados em `tsconfig.json` (com `tsc-alias` para build):

```typescript
// ❌ Relativo
import { AppError } from "../../../core/errors/AppError";

// ✅ Com alias
import { AppError } from "@core/errors/AppError";
import { logger } from "@core/utils/logger";
import { App } from "@infra/https/app";
import { User } from "@modules/users/infra/database/schemas/User";
```

**Aliases disponíveis:**

- `@core/*` → `src/core/*`
- `@infra/*` → `src/infra/*`
- `@modules/*` → `src/modules/*`

## 🎯 Princípios

| Princípio                | Benefício                                      |
| ------------------------ | ---------------------------------------------- |
| **Clean Architecture**   | Fácil trocar banco, testar sem infra           |
| **DDD**                  | Módulos por domínio, escala sem acoplamento    |
| **SOLID**                | Código focado, fácil manutenção                |
| **Dependency Injection** | Services sem new, testáveis                    |
| **Repository Pattern**   | Agnóstico a banco (TypeORM, Prisma, in-memory) |
| **DTO**                  | Type-safe, sem expor campos sensíveis          |
| **Structured Logging**   | Winston com níveis por ambiente                |

## 📚 Referências

- [docs/](.) — Documentação detalhada
- [backend/src/modules/users/](../backend/src/modules/users/) — Módulo de exemplo
- [IMPLEMENTACAO-MODULO-USERS.md](IMPLEMENTACAO-MODULO-USERS.md) — Guia passo-a-passo
