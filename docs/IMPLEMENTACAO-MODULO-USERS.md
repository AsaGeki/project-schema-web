# 🎯 Implementação do Padrão CRUD - Módulo Users

Implementação completa do módulo `users` seguindo o padrão documentado em `universal/PADRAO-CRUD.md`, com todos os arquivos em **kebab-case**.

## 📁 Estrutura Completa

```
backend/src/
├── modules/
│   └── users/                                    # Módulo domínio de usuários
│       ├── entities/
│       │   └── user.entity.ts                   # Classe User (modelo puro)
│       ├── repositories/
│       │   └── i-user-repository.ts             # Interface com contratos
│       ├── dtos/
│       │   ├── create-user.dto.ts               # Schema + tipo para criação
│       │   ├── update-user.dto.ts               # Schema + tipo para atualização
│       │   └── user-response.dto.ts             # DTO de resposta (sem dados sensíveis)
│       ├── services/
│       │   ├── find-all.service.ts              # Service para listar com paginação
│       │   ├── find-one.service.ts              # Service para buscar por ID
│       │   ├── create.service.ts                # Service para criar
│       │   ├── update.service.ts                # Service para atualizar
│       │   └── delete.service.ts                # Service para deletar
│       ├── infra/
│       │   ├── database/
│       │   │   └── in-memory-user.repository.ts # Implementação fake (use TypeORM em produção)
│       │   └── http/
│       │       ├── users.controller.ts          # Controller como classe
│       │       └── users.routes.ts              # Rotas com .bind()
│       ├── index.ts                             # Exports do módulo
│       └── README.md                            # Documentação interna
├── shared/
│   ├── errors/
│   │   └── index.ts                             # Classes AppError + subclasses (400, 401, etc)
│   ├── container/
│   │   └── index.ts                             # Injeção de dependência (tsyringe)
│   └── infra/
├── infra/
│   └── http/
│       ├── middlewares/
│       │   ├── httpLogger.ts                    # Log de requisições (Pino)
│       │   └── errorHandler.ts                  # Handler global de erros
│       └── server.ts                            # Configuração Express com rotas
└── config/
    └── logger.ts                                # Configuração Pino Logger
```

## 🚀 Endpoints da API

Base URL: `http://localhost:3333/api/users`

### 📋 Listar usuários (com paginação e busca)

```bash
GET /api/users?skip=0&take=10&search=joão&sortBy=name&sortDesc=false

Resposta (200):
{
  "data": [
    {
      "id": "uuid-string",
      "name": "João Silva",
      "email": "joao@example.com",
      "createdAt": "2026-02-21T10:00:00.000Z",
      "updatedAt": "2026-02-21T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 🔍 Buscar um usuário

```bash
GET /api/users/uuid-string

Resposta (200):
{
  "id": "uuid-string",
  "name": "João Silva",
  "email": "joao@example.com",
  "createdAt": "2026-02-21T10:00:00.000Z",
  "updatedAt": "2026-02-21T10:00:00.000Z"
}

Erro (404):
{
  "error": "Usuário não encontrado"
}
```

### ➕ Criar usuário

```bash
POST /api/users
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}

Resposta (201):
{
  "id": "uuid-string",
  "name": "João Silva",
  "email": "joao@example.com",
  "createdAt": "2026-02-21T10:00:00.000Z",
  "updatedAt": "2026-02-21T10:00:00.000Z"
}

Erros:
- (400) BadRequestError - Dados inválidos ou senha fraca
- (409) ConflictError - E-mail já cadastrado
```

### ✏️ Atualizar usuário

```bash
PATCH /api/users/uuid-string
Content-Type: application/json

{
  "name": "João Silva Atualizado",
  "email": "joao.novo@example.com"
}

Resposta (200):
{
  "id": "uuid-string",
  "name": "João Silva Atualizado",
  "email": "joao.novo@example.com",
  "createdAt": "2026-02-21T10:00:00.000Z",
  "updatedAt": "2026-02-21T11:00:00.000Z"
}

Erros:
- (400) BadRequestError - Dados inválidos
- (404) NotFoundError - Usuário não encontrado
- (409) ConflictError - E-mail já em uso
```

### 🗑️ Deletar usuário

```bash
DELETE /api/users/uuid-string

Resposta (204): [vazio]

Erro (404):
{
  "error": "Usuário não encontrado"
}
```

## 🧪 Testando a API

### Com cURL

```bash
# Criar usuário
curl -X POST http://localhost:3333/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'

# Listar usuários
curl http://localhost:3333/api/users

# Buscar um usuário
curl http://localhost:3333/api/users/{id}

# Atualizar
curl -X PATCH http://localhost:3333/api/users/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Novo Nome"}'

# Deletar
curl -X DELETE http://localhost:3333/api/users/{id}
```

### Com Postman/Insomnia

1. Import a coleção ou crie requisições manualmente
2. Use `{{BASE_URL}}` = `http://localhost:3333`
3. Endpoints:
   - `GET {{BASE_URL}}/api/users`
   - `POST {{BASE_URL}}/api/users`
   - `GET {{BASE_URL}}/api/users/:id`
   - `PATCH {{BASE_URL}}/api/users/:id`
   - `DELETE {{BASE_URL}}/api/users/:id`

## 🔄 Fluxo de Dados

```
Client Request
     ↓
Express Router (/api/users/:id)
     ↓
Controller Method (ex: create)
     ↓
Container.resolve(Service)
     ↓
Service.execute(data)
     │
     ├─→ Validação com Zod
     ├─→ Verificações de negócio
     ├─→ Repository.create()/findAll()/etc
     └─→ Mapeamento DTO (sem dados sensíveis)
     ↓
Controller retorna Response
     ↓
httpLogger middleware (loga requisição)
     ↓
Client Response (200/201/400/404/409/etc)

[Se erro → errorHandler captura AppError → JSON com statusCode correto]
```

## 🔑 Principios Implementados

✅ **Clean Architecture** - Separação clara de camadas
✅ **DDD** - Módulo organizado por domínio
✅ **Dependency Injection** - tsyringe resolve automaticamente
✅ **Validação Zod** - Type-safe em runtime
✅ **Error Handling** - AppError com status codes HTTP
✅ **Logging** - Todas as requisições são logadas
✅ **Kebab-case** - Nomes de arquivos em kebab-case
✅ **Repository Pattern** - Interface agnóstica a DB
✅ **One Service per Operation** - Cada service é responsável por uma ação

## 📚 Como Estender

Para criar um novo módulo (ex: `products`):

1. Copie a estrutura de `users/`
2. Renomeie para `products/`
3. Atualize nomes de classes/interfaces
4. Registre no container de injeção de dependência
5. Adicione as rotas no `server.ts`

Veja [modules/users/README.md](src/modules/users/README.md) para mais detalhes.

## 🔗 Referências

- [PADRAO-CRUD.md](../../universal/PADRAO-CRUD.md)
- [PADRAO-ERROS.md](../../universal/PADRAO-ERROS.md)
- [PADRAO-MIDDLEWARES.md](../../universal/PADRAO-MIDDLEWARES.md)
- [modules/users/README.md](src/modules/users/README.md)
