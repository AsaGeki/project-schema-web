# 🔄 Padrão CRUD

Guia completo sobre o padrão CRUD implementado no projeto.

**Referência:** [universal/PADRAO-CRUD.md](../universal/PADRAO-CRUD.md)

## 📊 Visão Geral

O padrão CRUD separa responsabilidades em camadas:

```
┌─────────┐
│ Client  │
└────┬────┘
     │
┌────▼──────────────────────────────┐
│ Router/Controller                  │ Recebe requisição
├────────────────────────────────────┤
│ Service (FindAll, Create, etc)     │ Lógica de negócio
├────────────────────────────────────┤
│ Repository (Interface)             │ Contrato com dados
├────────────────────────────────────┤
│ Repository (Implementação)         │ TypeORM, Prisma, etc
└────┬──────────────────────────────┘
     │
  Database
```

## 📁 Estrutura de um Módulo

```
modules/[nome_do_modulo]/
├── entities/
│   └── modelo.entity.ts              # Classe pura (sem dependências)
├── repositories/
│   └── i-modelo-repository.ts        # Interface/Contrato
├── dtos/
│   ├── create-modelo.dto.ts          # Zod + tipo TS
│   ├── update-modelo.dto.ts          # Zod + tipo TS
│   └── modelo-response.dto.ts        # Resposta sem dados sensíveis
├── services/
│   ├── find-all.service.ts           # Listar (paginação, busca)
│   ├── find-one.service.ts           # Buscar por ID
│   ├── create.service.ts             # Criar novo
│   ├── update.service.ts             # Atualizar existente
│   └── delete.service.ts             # Deletar
├── infra/
│   ├── database/
│   │   └── typeorm-modelo.repository.ts   # Implementação real
│   └── http/
│       ├── modelo.controller.ts      # Handler HTTP (classe)
│       └── modelo.routes.ts          # Rotas Express
└── index.ts                          # Exports
```

### Convenções

- **Nomes de arquivos:** kebab-case (`create-user.dto.ts`)
- **Nomes de classes:** PascalCase (`CreateService`, `User`)
- **Nomes de interfaces:** `IPrefixInterface` (`IUserRepository`)

## 🔑 Componentes

### 1️⃣ Entity (Entidade)

Modelo puro de negócio **sem dependências de framework**.

```typescript
export class User {
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Métodos de negócio opcionais
  public isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }
}
```

**Características:**

- Propriedades públicas
- Sem decoradores (exceto se usar TypeORM)
- Métodos que validam regras de negócio

### 2️⃣ Repository Interface

Define o **contrato** para persistência de dados.

```typescript
export interface IUserRepository {
  create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  findAll(query?: FindAllQuery): Promise<User[]>;
  count(query?: Pick<FindAllQuery, "search">): Promise<number>;
  findById(id: string, options?: FindOneOptions): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface FindAllQuery {
  skip?: number;
  take?: number;
  sortBy?: string;
  sortDesc?: boolean;
  search?: string;
}
```

**Benefícios:**

- Service não conhece banco de dados
- Fácil testar com fake repository
- Trocar DB sem mexer em service

### 3️⃣ DTOs (Data Transfer Objects)

Validação com Zod + tipo TypeScript.

**Create DTO:**

```typescript
export const CreateUserSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
```

**Update DTO:**

```typescript
export const UpdateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
```

**Response DTO:**

```typescript
// Nunca expõe passwordHash, tokens, etc
export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4️⃣ Services

**Um service por operação.** Contém toda a lógica de negócio.

```typescript
@injectable()
export class CreateService {
  constructor(
    @inject("UserRepository")
    private userRepository: IUserRepository,
  ) {}

  async execute(data: CreateUserDTO): Promise<UserResponseDTO> {
    // Validação
    const validation = CreateUserSchema.safeParse(data);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors[0].message);
    }

    // Regra de negócio: e-mail duplicado?
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError("E-mail já cadastrado");
    }

    // Criar
    const user = new User();
    user.id = randomUUID();
    user.name = data.name;
    user.email = data.email;
    user.passwordHash = await hash(data.password, 10);
    user.createdAt = new Date();
    user.updatedAt = new Date();

    // Persistir
    const created = await this.userRepository.create(user);

    // Retornar sem dados sensíveis
    return this.mapToResponse(created);
  }

  private mapToResponse(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

**Padrão de error handling:**

| Service | Erros Típicos                                                   |
| ------- | --------------------------------------------------------------- |
| FindAll | —                                                               |
| FindOne | NotFoundError (404)                                             |
| Create  | BadRequestError (400), ConflictError (409)                      |
| Update  | BadRequestError (400), NotFoundError (404), ConflictError (409) |
| Delete  | NotFoundError (404)                                             |

### 5️⃣ Repository Implementation

Implementação concreta (TypeORM, Prisma, ou in-memory).

```typescript
@injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const user = { ...data, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  async findAll(query?: FindAllQuery): Promise<User[]> {
    let users = Array.from(this.users.values());

    if (query?.search) {
      const search = query.search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(search));
    }

    if (query?.sortBy) {
      users.sort((a, b) => {
        const aVal = a[query.sortBy as keyof User];
        const bVal = b[query.sortBy as keyof User];
        return aVal < bVal ? (query.sortDesc ? 1 : -1) : aVal > bVal ? (query.sortDesc ? -1 : 1) : 0;
      });
    }

    const skip = query?.skip || 0;
    const take = query?.take || 10;
    return users.slice(skip, skip + take);
  }

  async count(query?: Pick<FindAllQuery, "search">): Promise<number> {
    // Count com filtro
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}
```

### 6️⃣ Controller

**Classe** com um método por ação. Apenas converte HTTP ↔ Service.

```typescript
export default class UsersController {
  public async findAll(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(FindAllService);
    const query = { skip: req.query.skip, take: req.query.take, search: req.query.search };
    const result = await service.execute(query);
    return res.json(result);
  }

  public async create(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body);
    return res.status(201).json(result);
  }

  public async update(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(UpdateService);
    const result = await service.execute(req.params.id, req.body);
    return res.json(result);
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(DeleteService);
    await service.execute(req.params.id);
    return res.status(204).send();
  }
}
```

### 7️⃣ Routes

Rotas Express com `.bind()` para manter o contexto.

```typescript
const router = Router();
const controller = new UsersController();

router.get("/", controller.findAll.bind(controller));
router.get("/:id", controller.findOne.bind(controller));
router.post("/", controller.create.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export { router as usersRouter };
```

## 🔗 Registrar no Servidor

Em [backend/src/infra/http/server.ts](../backend/src/infra/http/server.ts):

```typescript
import { usersRouter } from "@modules/users";

app.use("/api/users", usersRouter);
```

## 🚀 Fluxo de uma Requisição

### POST /api/users (Criar)

1. **Client** envia `{ name, email, password }`
2. **Router** chama `UsersController.create()`
3. **Controller** extrai `req.body` e chama `CreateService.execute()`
4. **Service**:
   - Valida com Zod → lança `BadRequestError` se inválido (400)
   - Verifica duplicata → lança `ConflictError` (409)
   - Hash da senha
   - Chama `repository.create()`
5. **Repository** persiste no banco
6. **Service** mapeia `User` → `UserResponseDTO`
7. **Controller** retorna `201` com JSON
8. **errorHandler** (se erro) captura e retorna `{ error: message }` com statusCode

## 📋 Checklist para Novo Módulo

- [ ] Criar entidade em `entities/`
- [ ] Criar interface em `repositories/`
- [ ] Criar DTOs em `dtos/`
- [ ] Criar services em `services/` (um por operação)
- [ ] Criar repositório em `infra/database/`
- [ ] Criar controller em `infra/http/`
- [ ] Criar rotas em `infra/http/`
- [ ] Criar `index.ts` com exports
- [ ] Registrar no container de DI
- [ ] Registrar rotas no `server.ts`
- [ ] Testar com cURL ou Postman

## 💡 Dicas

1. **Sempre use interfaces** - fácil mockar para testes
2. **Um service por operação** - cada service é pequeno e focado
3. **Mapear DTO na response** - nunca expor campos sensíveis
4. **Validar com Zod** - type-safe em runtime
5. **Usar AppError** - statusCode automático

## 📚 Exemplo Completo

Veja [backend/src/modules/users/](../backend/src/modules/users/) para um exemplo funcional do padrão CRUD.
