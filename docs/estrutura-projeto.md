# 🏗️ Estrutura do Projeto

Visão geral da arquitetura e organização do Universal Base Project.

## 📂 Raiz do Projeto

```
project-schema/
├── docs/                              # 📚 Documentação (você está aqui)
│   ├── logger.md                      # Logger com Pino
│   ├── crud.md                        # Padrão CRUD
│   ├── error-handling.md              # Tratamento de erros
│   ├── middlewares.md                 # Middlewares HTTP
│   ├── dependency-injection.md        # Injeção de dependência (tsyringe)
│   └── estrutura-projeto.md           # Este arquivo
├── universal/                         # 📖 Padrões reutilizáveis
│   ├── PADRAO-CRUD.md                # Padrão CRUD detalhado
│   ├── PADRAO-ERROS.md               # Padrão de erro
│   ├── PADRAO-MIDDLEWARES.md         # Padrão de middlewares
│   └── README.md                     # Índice dos padrões
├── backend/                           # 🔙 Código backend
│   ├── src/
│   │   ├── @types/                   # Tipos globais
│   │   ├── config/                   # Configurações (logger)
│   │   ├── modules/                  # Módulos por domínio
│   │   │   └── users/               # Exemplo de módulo
│   │   ├── shared/                   # Código compartilhado
│   │   │   ├── container/           # Injeção de dependência
│   │   │   ├── errors/              # Classes de erro
│   │   │   └── infra/               # Infra global
│   │   └── infra/
│   │       └── http/
│   │           ├── middlewares/
│   │           └── server.ts        # App Express
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/                          # 🎨 Código frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                # Singletons
│   │   │   ├── shared/              # Componentes reutilizáveis
│   │   │   ├── features/            # Features/módulos
│   │   │   └── data/                # Dados (schemas Zod)
│   │   └── assets/
│   ├── angular.json
│   └── package.json
├── IMPLEMENTACAO-MODULO-USERS.md      # Guia do módulo users
├── readme.md                          # README principal
└── .gitignore
```

## 🔙 Backend - Estrutura Detalhada

### `/src/@types/`

Definições de tipos globais usadas em toda a aplicação.

```typescript
// Exemplo: tipos globais do projeto
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
```

### `/src/config/`

Configurações de bibliotecas externas.

```
config/
├── logger.ts                # Pino Logger (estruturado por ambiente)
└── LOGGER_GUIDE.md         # Guia técnico do logger
```

**O que há aqui:** Setup de bibliotecas que variam por ambiente (dev/prod).

### `/src/shared/`

Código **compartilhado entre todos os módulos.**

```
shared/
├── container/              # Injeção de dependência (tsyringe)
│   └── index.ts           # Registra todas as dependências
├── errors/                # Classes de erro (AppError, NotFoundError, etc)
│   └── index.ts
└── infra/                 # Implementações globais
    └── (vazio por enquanto - para coisas como email sender global)
```

**Quando adicionar aqui:** Código usado por 2+ módulos.

### `/src/modules/`

**Cada domínio tem seu módulo.** Totalmente independente.

```
modules/
├── users/                 # Módulo de usuários
│   ├── entities/
│   │   └── user.entity.ts
│   ├── repositories/
│   │   └── i-user-repository.ts    # Interface
│   ├── dtos/
│   │   ├── create-user.dto.ts      # Zod + tipo
│   │   ├── update-user.dto.ts
│   │   └── user-response.dto.ts
│   ├── services/
│   │   ├── find-all.service.ts
│   │   ├── find-one.service.ts
│   │   ├── create.service.ts
│   │   ├── update.service.ts
│   │   └── delete.service.ts
│   ├── infra/
│   │   ├── database/
│   │   │   └── in-memory-user.repository.ts  # Implementação
│   │   └── http/
│   │       ├── users.controller.ts           # HTTP handler
│   │       └── users.routes.ts               # Rotas Express
│   ├── index.ts                              # Exports do módulo
│   └── README.md                             # Documentação interna
│
└── products/              # Novo módulo (copiar estrutura de users/)
    ├── entities/
    ├── repositories/
    ├── dtos/
    ├── services/
    ├── infra/
    ├── index.ts
    └── README.md
```

**Convenção:** kebab-case para arquivos, PascalCase para classes.

### `/src/infra/http/`

**HTTP layer global** (não específico de módulo).

```
infra/http/
├── middlewares/
│   ├── httpLogger.ts                # Loga todas as requisições
│   └── errorHandler.ts              # Trata erros globalmente
└── server.ts                        # App Express + setup
```

**O que faz:**

- `server.ts`: Registra middlewares, rotas de módulos, health check
- `httpLogger.ts`: Loga requisição, status, duração (Pino)
- `errorHandler.ts`: Captura erros, retorna `{ error }` com statusCode correto

## 🎨 Frontend - Estrutura Detalhada

```
frontend/src/app/
├── core/                           # Singleton (carregado uma vez)
│   ├── services/
│   │   ├── auth.service.ts        # Autenticação
│   │   ├── http.service.ts        # HTTP com interceptor
│   │   └── guard.service.ts       # Route guards
│   └── models/
│       ├── user.model.ts          # Tipos globais
│       └── api.model.ts
│
├── shared/                         # Componentes reutilizáveis ("Lego")
│   ├── components/
│   │   ├── button.component.ts
│   │   ├── input.component.ts
│   │   ├── modal.component.ts
│   │   └── ...
│   ├── directives/
│   │   ├── highlight.directive.ts
│   │   └── ...
│   └── pipes/
│       ├── truncate.pipe.ts
│       └── ...
│
├── features/                       # Features/módulos específicos
│   ├── users/
│   │   ├── components/
│   │   │   ├── user-list.component.ts
│   │   │   └── user-form.component.ts
│   │   ├── pages/                 # Smart components (container)
│   │   │   ├── users.page.ts
│   │   │   └── user-detail.page.ts
│   │   ├── services/
│   │   │   └── users.service.ts   # Chamadas HTTP
│   │   ├── users.routes.ts        # Rotas standalone
│   │   └── users.module.ts        # (ou standalone)
│   │
│   └── dashboard/
│       ├── ...
│
└── data/                           # Camada de dados pura
    └── schemas/
        ├── user.schema.ts         # Zod (validar resposta API)
        ├── product.schema.ts
        └── ...
```

**Separação:**

- **Core**: Singletons (auth, guards, HTTP)
- **Shared**: Componentes reutilizáveis
- **Features**: Módulos independentes com lazy-loading
- **Data**: Contratos Zod (validar resposta do backend)

## 🔗 Fluxo de Uma Requisição

### Criar usuário: `POST /api/users`

```
1. Frontend (Angular)
   └─ users.service.ts chama HTTP POST
           ↓
2. Backend (Express)
   └─ Router: POST /api/users
           ↓
3. Controller (UsersController.create)
   └─ container.resolve(CreateService)
           ↓
4. Service (CreateService.execute)
   ├─ Validação Zod
   ├─ Check: e-mail duplicado?
   ├─ Hash senha
   └─ repository.create()
           ↓
5. Repository (InMemoryUserRepository.create)
   └─ Persiste no banco/memory
           ↓
6. Service mapeia User → UserResponseDTO
           ↓
7. Controller retorna status 201 + JSON
           ↓
8. httpLogger registra: POST /api/users 201 45ms
           ↓
9. Frontend recebe resposta e atualiza UI
```

### Se erro: `POST /api/users` com e-mail inválido

```
1-3. Até Service

4. Service (CreateService.execute)
   └─ Validação Zod falha
   └─ throw new BadRequestError("E-mail inválido")
           ↓
5. Express middleware: next(error)
           ↓
6. errorHandler middleware
   ├─ instanceof AppError? SIM
   ├─ res.status(400)
   └─ res.json({ error: "E-mail inválido" })
           ↓
7. httpLogger registra: POST /api/users 400 12ms
           ↓
8. Frontend recebe 400 + mensagem de erro
```

## 🔐 Camadas e Responsabilidades

### Entity (Domínio)

```typescript
export class User {
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  // Métodos de negócio puro
}
```

**Responsabilidade:** Representar o modelo. Sem dependências.

### Repository (Contrato)

```typescript
export interface IUserRepository {
  create(...): Promise<User>;
  findById(...): Promise<User | null>;
  // ...
}
```

**Responsabilidade:** Contrato com dados. Service não conhece implementação.

### Service (Lógica)

```typescript
@injectable()
export class CreateService {
  constructor(@inject("UserRepository") private repo: IUserRepository) {}

  async execute(data: CreateUserDTO): Promise<UserResponseDTO> {
    // Validação, regras de negócio, persistência
  }
}
```

**Responsabilidade:** Toda lógica de negócio. Independente de HTTP/DB.

### Controller (HTTP)

```typescript
export default class UsersController {
  public async create(req: Request, res: Response) {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body);
    return res.status(201).json(result);
  }
}
```

**Responsabilidade:** Converter HTTP ↔ Service. Apenas isso.

## 🎯 Princípios

| Princípio                | O quê                             | Benefício               |
| ------------------------ | --------------------------------- | ----------------------- |
| **Clean Architecture**   | Dependências para dentro          | Fácil testar, mudar DB  |
| **DDD**                  | Módulos por domínio               | Escalável, independente |
| **SOLID**                | Single responsibility             | Código focado           |
| **Dependency Injection** | Container resolve                 | Sem acoplamento         |
| **Repository Pattern**   | Interface, implementação          | Agnóstico a DB          |
| **DTO**                  | Validação, resposta sem sensíveis | Type-safe, seguro       |
| **Error Handling**       | AppError classes                  | Statuscode automático   |
| **Logging**              | Pino estruturado                  | Debug, performance      |

## 📜 Path Aliases

Imports limpos configurados em `tsconfig.json`:

```typescript
// ❌ Sem alias
import { User } from "../../../entities/user.entity";

// ✅ Com alias
import { User } from "@modules/users";
```

**Aliases disponíveis:**

- `@/*` → `src/*`
- `@shared/*` → `src/shared/*`
- `@modules/*` → `src/modules/*`
- `@config/*` → `src/config/*`

## 🧪 Testabilidade

Cada camada pode ser testada isoladamente:

```typescript
// Test Unit: Service sem BD
const fakeRepo: IUserRepository = { create: vi.fn(), ... };
const service = new CreateService(fakeRepo);
const result = await service.execute(data);

// Test Integration: Service + repositório real
const repo = new InMemoryUserRepository();
const service = new CreateService(repo);
// ...

// Test E2E: API completa (frontend + backend)
const response = await fetch('POST /api/users', { body });
```

## 📚 Referências

- [docs/](.) - Documentação
- [universal/](../universal/) - Padrões
- [backend/src/modules/users/](../backend/src/modules/users/) - Exemplo
- [IMPLEMENTACAO-MODULO-USERS.md](../IMPLEMENTACAO-MODULO-USERS.md) - Guia do módulo
