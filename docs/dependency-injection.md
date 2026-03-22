# 💉 Injeção de Dependência

Sistema de DI baseado em **tsyringe** com decoradores TypeScript.

## Conceito

Em vez de instanciar dependências manualmente (`new Repository()`), o container resolve automaticamente. Isso desacopla as camadas e facilita os testes.

```typescript
// ❌ Acoplado — TestService instancia diretamente
class CreateService {
  private repo = new TypeORMUsersRepository(); // concreto, difícil testar
}

// ✅ Com DI — depende de abstração
@injectable()
class CreateService {
  constructor(@inject("UsersRepository") private repo: IUsersRepository) {}
}
```

---

## Setup

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### `server.ts`

```typescript
import "reflect-metadata"; // Obrigatório — deve ser o primeiro import
import "@infra/container"; // Container global
import "@modules/users/container"; // Container do módulo users
```

---

## Estrutura de Containers

O projeto separa os bindings em dois níveis:

### Container Global (`src/infra/container/index.ts`)

Para dependências compartilhadas entre módulos (ex: mailer global, cache).

```typescript
import "reflect-metadata";
import { container } from "tsyringe";

// Registre aqui dependências compartilhadas entre múltiplos módulos
// container.registerSingleton<IMailer>('Mailer', NodemailerMailer);

export { container };
```

### Container do Módulo (`src/modules/<nome>/container/index.ts`)

Cada módulo registra suas próprias dependências. Importado no `server.ts`.

```typescript
import "reflect-metadata";
import { container } from "tsyringe";
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { TypeORMUsersRepository } from "@modules/users/infra/database/repositories/TypeORMUsersRepository";

container.registerSingleton<IUsersRepository>("UsersRepository", TypeORMUsersRepository);
```

---

## Os 3 Passos de Uso

### 1. Registrar no container

```typescript
// container/index.ts
container.registerSingleton<IUsersRepository>("UsersRepository", TypeORMUsersRepository);
```

### 2. `@injectable()` na implementação

```typescript
@injectable()
export class TypeORMUsersRepository implements IUsersRepository {
  // ...
}
```

### 3. `@inject()` no service

```typescript
@injectable()
export class CreateService {
  constructor(
    @inject("UsersRepository")
    private usersRepository: IUsersRepository,
  ) {}
}
```

### 4. `container.resolve()` no controller

```typescript
export class UsersController {
  async create(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body);
    return res.status(201).json(result);
  }
}
```

---

## Tipos de Registro

### `registerSingleton` — mesma instância (use para repositórios)

```typescript
container.registerSingleton<IUsersRepository>("UsersRepository", TypeORMUsersRepository);
// → mesma instância reutilizada em toda a app
```

### `registerTransient` — nova instância por resolução

```typescript
container.register<CreateService>(CreateService, { useClass: CreateService });
// → nova instância a cada container.resolve()
```

### `registerInstance` — instância já criada (use em testes)

```typescript
const fakeRepo: IUsersRepository = { create: jest.fn(), ... };
container.registerInstance<IUsersRepository>('UsersRepository', fakeRepo);
```

---

## Trocar Implementação

A grande vantagem do padrão: para mudar de TypeORM para Prisma, basta alterar o container. Os services não mudam.

```typescript
// Antes
container.registerSingleton<IUsersRepository>("UsersRepository", TypeORMUsersRepository);

// Depois (sem tocar em nenhum service)
container.registerSingleton<IUsersRepository>("UsersRepository", PrismaUsersRepository);
```

---

## Organização por Módulo

```
server.ts
  ↓ import '@infra/container'         → bindings globais
  ↓ import '@modules/users/container' → bindings de users
  ↓ import '@modules/orders/container'→ bindings de orders
```

Cada módulo é responsável por registrar seus próprios bindings. Isso mantém o código organizado e isola responsabilidades.

---

## Armadilhas Comuns

### ❌ Esquecer `reflect-metadata`

```typescript
// server.ts — DEVE ser o primeiro import
import "reflect-metadata"; // ← sem isso, os decoradores não funcionam
```

### ❌ Registrar classe concreta sem token

```typescript
// ❌ Errado
container.registerSingleton(TypeORMUsersRepository);

// ✅ Correto — token como string para referenciar a interface
container.registerSingleton<IUsersRepository>("UsersRepository", TypeORMUsersRepository);
```

### ❌ Token errado no `@inject`

```typescript
// Container: container.registerSingleton<IUsersRepository>('UsersRepository', ...)
//                                                           ^^^^^^^^^^^^^^^^

@inject('UsersRepository') // deve coincidir exatamente
private usersRepository: IUsersRepository
```
