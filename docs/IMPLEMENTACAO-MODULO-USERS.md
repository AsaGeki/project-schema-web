# 👤 Implementação do Módulo Users

Guia passo-a-passo da implementação completa do módulo `users`, servindo como referência para criar novos módulos.

> **Stack:** TypeORM + PostgreSQL · tsyringe · Winston · TypeScript interfaces (sem Zod)

## 📂 Estrutura Completa

```
backend/src/modules/users/
├── container/
│   └── index.ts                              # Bindings DI do módulo
├── dtos/
│   ├── CreateUserDTO.ts                      # { name, email, password }
│   ├── UpdateUserDTO.ts                      # { name?, email? }
│   └── UserResponseDTO.ts                    # { id, name, email, createdAt, updatedAt }
├── interfaces/
│   └── IUser.ts                              # Interface do modelo
├── repositories/
│   └── IUsersRepository.ts                   # Contrato do repositório
├── services/
│   └── index.ts                              # Create, FindAll, FindOne, Update, Delete
├── infra/
│   ├── database/
│   │   ├── schemas/
│   │   │   └── User.ts                       # Entidade TypeORM
│   │   └── repositories/
│   │       └── TypeORMUsersRepository.ts     # Implementação TypeORM
│   └── https/
│       ├── controllers/
│       │   └── UsersController.ts
│       └── routes/
│           └── users.routes.ts
├── index.ts                                  # Barrel exports
└── README.md
```

## 🌐 Endpoints da API

**Base URL:** `http://localhost:3333/api/users`

| Método   | Path   | Descrição                        | Status          |
| -------- | ------ | -------------------------------- | --------------- |
| `GET`    | `/`    | Listar todos (paginação + busca) | 200             |
| `GET`    | `/:id` | Buscar por ID                    | 200 / 404       |
| `POST`   | `/`    | Criar usuário                    | 201 / 409       |
| `PATCH`  | `/:id` | Atualizar                        | 200 / 404 / 409 |
| `DELETE` | `/:id` | Deletar                          | 204 / 404       |

### GET `/api/users`

Query params opcionais: `skip`, `take`, `search`, `sortBy`, `sortDesc`

```
GET /api/users?skip=0&take=10&search=joão&sortBy=name&sortDesc=false
```

**Resposta 200:**

```json
{
  "data": [{ "id": "uuid", "name": "João Silva", "email": "joao@email.com", "createdAt": "...", "updatedAt": "..." }],
  "total": 1
}
```

### POST `/api/users`

```json
{ "name": "João Silva", "email": "joao@email.com", "password": "senha123" }
```

**Resposta 201:**

```json
{ "id": "uuid", "name": "João Silva", "email": "joao@email.com", "createdAt": "...", "updatedAt": "..." }
```

**Resposta 409** (e-mail duplicado):

```json
{ "success": false, "title": "Erro na requisição", "message": "E-mail já cadastrado.", "details": null }
```

---

## 🔄 Fluxo de Dados

### `POST /api/users`

```
Request
   ↓
usersRouter → UsersController.create
   ↓
container.resolve(CreateService)
   ↓
CreateService.execute({ name, email, password })
   ├─ usersRepository.findByEmail(email) → conflict? throw ConflictError
   ├─ bcrypt.hash(password, 10)
   └─ usersRepository.create({ name, email, passwordHash })
         ↓
TypeORMUsersRepository.create
   └─ INSERT INTO users (name, email, password_hash) VALUES (...)
         ↓
Service desestrutura User, omite passwordHash
   └─ retorna UserResponseDTO
         ↓
Controller → res.status(201).json(userResponseDTO)
         ↓
[se AppError] errorMiddleware → res.status(statusCode).json({ success, title, message })
         ↓
logMiddleware → POST /api/users 201 — 48ms
```

### `GET /api/users?skip=0&take=10`

```
UsersController.findAll
   ↓
FindAllService.execute({ skip: 0, take: 10 })
   ├─ usersRepository.findAll({ skip, take }) → User[]
   └─ usersRepository.count({}) → number
         ↓
Para cada User, desestrutura omitindo passwordHash
   └─ retorna { data: UserResponseDTO[], total: number }
```

---

## 📋 Como Criar um Módulo Equivalente

Siga o [crud.md](crud.md) e substitua `User/users` pelo nome do novo domínio.

**Etapas resumidas:**

1. Criar a entidade TypeORM em `infra/database/schemas/`
2. Criar a interface do repositório em `repositories/`
3. Criar as DTOs (Create, Update, Response) em `dtos/`
4. Implementar o repositório TypeORM em `infra/database/repositories/`
5. Criar os services em `services/index.ts`
6. Criar controller e rotas em `infra/https/`
7. Criar `container/index.ts` com o binding
8. Exportar tudo em `index.ts`
9. Registrar a rota em `src/infra/https/routes/routes.ts`
10. Importar o container em `src/server.ts`

---

## 🔐 Segurança

- **Senha**: nunca armazenada em plain text — `bcrypt.hash(password, 10)` antes de persistir
- **Resposta**: `passwordHash` é sempre removido antes de retornar ao cliente
- **Conflito**: e-mail verificado por unicidade tanto no CREATE quanto no UPDATE

```typescript
// ✅ Como o UserResponseDTO é gerado
const { passwordHash: _, ...response } = user;
return response as UserResponseDTO;
```

---

## 📚 Referências

- [crud.md](crud.md) — Padrão CRUD completo
- [error-handling.md](error-handling.md) — Classes de AppError
- [dependency-injection.md](dependency-injection.md) — Container tsyringe
- [logger.md](logger.md) — Winston logger
- [backend/src/modules/users/README.md](../backend/src/modules/users/README.md) — Docs internas do módulo
