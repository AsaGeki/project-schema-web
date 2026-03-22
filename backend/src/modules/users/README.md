# 👤 Módulo Users

Implementação completa de CRUD de usuários. Serve como **módulo de referência** para criar novos módulos.

> Ver [docs/IMPLEMENTACAO-MODULO-USERS.md](../../../../docs/IMPLEMENTACAO-MODULO-USERS.md) para o guia completo.

## 📂 Estrutura

```
users/
├── container/
│   └── index.ts                          # Registra UsersRepository no tsyringe
├── dtos/
│   ├── CreateUserDTO.ts                  # { name, email, password }
│   ├── UpdateUserDTO.ts                  # { name?, email? }
│   └── UserResponseDTO.ts                # { id, name, email, createdAt, updatedAt }
├── interfaces/
│   └── IUser.ts                          # Interface do modelo
├── repositories/
│   └── IUsersRepository.ts               # Contrato do repositório
├── services/
│   └── index.ts                          # CreateService, FindAllService, FindOneService,
│                                         #  UpdateService, DeleteService
├── infra/
│   ├── database/
│   │   ├── schemas/
│   │   │   └── User.ts                   # Entidade TypeORM (@Entity, @Column…)
│   │   └── repositories/
│   │       └── TypeORMUsersRepository.ts # Implementação TypeORM
│   └── https/
│       ├── controllers/
│       │   └── UsersController.ts        # findAll, findOne, create, update, delete
│       └── routes/
│           └── users.routes.ts           # GET /, GET /:id, POST /, PATCH /:id, DELETE /:id
└── index.ts                              # Barrel exports do módulo
```

## 🌐 Endpoints

| Método   | Path             | Ação                      | Status          |
| -------- | ---------------- | ------------------------- | --------------- |
| `GET`    | `/api/users`     | Lista com paginação/busca | 200             |
| `GET`    | `/api/users/:id` | Busca por ID              | 200 / 404       |
| `POST`   | `/api/users`     | Cria usuário              | 201 / 409       |
| `PATCH`  | `/api/users/:id` | Atualiza                  | 200 / 404 / 409 |
| `DELETE` | `/api/users/:id` | Remove                    | 204 / 404       |

## 🔄 Camadas

```
UsersController
  └─ container.resolve(XxxService)
       └─ @inject('UsersRepository') → IUsersRepository
            └─ TypeORMUsersRepository (implementação)
```

## 🔐 Segurança

- Senha armazenada com `bcrypt.hash(password, 10)` — nunca plain text
- `passwordHash` **nunca** retornado nas respostas (`UserResponseDTO`)
- E-mail único verificado em create e update (`ConflictError` se duplicado)

## ✅ Como Replicar

Para criar um módulo equivalente, siga [docs/crud.md](../../../../docs/crud.md).
