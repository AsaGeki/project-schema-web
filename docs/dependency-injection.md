# 💉 Injeção de Dependência (Container)

Documentação sobre como usar tsyringe para IoC (Inversão de Controle).

## 🎯 O Que É?

**Injeção de Dependência (DI)** permite que uma classe não precise **instanciar** suas dependências. O **container** faz isso automaticamente.

### Antes (sem DI)

```typescript
class CreateService {
  private userRepository: IUserRepository;

  constructor() {
    // ❌ Acoplado! CreateService conhece InMemoryUserRepository
    this.userRepository = new InMemoryUserRepository();
  }

  async execute(data: CreateUserDTO) {
    // ...
  }
}
```

**Problema:** Se quiser trocar o repositório (ex.: TypeORM), precisa alterar CreateService.

### Depois (com DI)

```typescript
@injectable()
class CreateService {
  constructor(
    @inject("UserRepository")
    private userRepository: IUserRepository,
  ) {}

  async execute(data: CreateUserDTO) {
    // ...
  }
}
```

**Vantagem:** Container resolve automaticamente. CreateService não conhece a implementação real.

## 🔧 Setup

### Instalar

```bash
npm install tsyringe reflect-metadata
```

### Registrar em um arquivo que é carregado cedo

```typescript
// backend/src/shared/container/index.ts
import "reflect-metadata";
import { container } from "tsyringe";

export { container };
```

### Importar no servidor

```typescript
// backend/src/infra/http/server.ts
import "@shared/container";

// Agora container está pronto para usar
```

## 📝 Usando o Container

### Passo 1: Registrar Implementações

Em [backend/src/shared/container/index.ts](../backend/src/shared/container/index.ts):

```typescript
import "reflect-metadata";
import { container } from "tsyringe";

// Módulo Users
import { InMemoryUserRepository, IUserRepository } from "@modules/users";

// Registrar o repositório
container.registerSingleton<IUserRepository>(
  "UserRepository", // token/chave
  InMemoryUserRepository, // implementação
);

export { container };
```

### Passo 2: Marcar Classe como Injectable

```typescript
import { injectable, inject } from "tsyringe";

@injectable()
export class CreateService {
  constructor(
    @inject("UserRepository")
    private userRepository: IUserRepository,
  ) {}

  async execute(data: CreateUserDTO) {
    // userRepository foi injetado automaticamente!
    return this.userRepository.create(data);
  }
}
```

### Passo 3: No Controller, Resolver do Container

```typescript
import { container } from "tsyringe";

export default class UsersController {
  public async create(req: Request, res: Response): Promise<Response> {
    // Container resolve e injeta automaticamente
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body);
    return res.status(201).json(result);
  }
}
```

## 🎓 Tipos de Registro

### Singleton (uma instância para toda a app)

```typescript
container.registerSingleton<IUserRepository>("UserRepository", InMemoryUserRepository);

// Toda resolução retorna a MESMA instância
const repo1 = container.resolve<IUserRepository>("UserRepository");
const repo2 = container.resolve<IUserRepository>("UserRepository");
console.log(repo1 === repo2); // true
```

**Use para:** Repositórios, logger, configurações.

### Transient (nova instância cada vez)

```typescript
container.registerTransient<CreateService>(CreateService);

// Cada resolução cria NOVA instância
const service1 = container.resolve(CreateService);
const service2 = container.resolve(CreateService);
console.log(service1 === service2); // false
```

**Use para:** Services (um por requisição).

### Factory (você controla a criação)

```typescript
container.registerSingleton("UserRepository", {
  useFactory: (resolver) => {
    const config = resolver.resolve(ConfigService);
    if (config.database === "postgres") {
      return new TypeOrmUserRepository();
    }
    return new InMemoryUserRepository();
  },
});
```

**Use para:** Lógica customizada na instanciação.

## 🌳 Hierarquia de Dependências

```
UsersController
  └─ CreateService
       └─ IUserRepository (InMemoryUserRepository)

FindAllService
  └─ IUserRepository (InMemoryUserRepository) ← mesma instância!

UpdateService
  └─ IUserRepository (InMemoryUserRepository) ← mesma instância!
```

**Vantagem:** Dados compartilhados entre services (cache, estado).

## 💻 Exemplo Completo

### 1. Interface

```typescript
// users/repositories/i-user-repository.ts
export interface IUserRepository {
  create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  findById(id: string): Promise<User | null>;
  // ...
}
```

### 2. Implementação

```typescript
// users/infra/database/in-memory-user.repository.ts
import { injectable } from "tsyringe";

@injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const user = { ...data, id: randomUUID(), createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
}
```

### 3. Service

```typescript
// users/services/create.service.ts
import { injectable, inject } from "tsyringe";

@injectable()
export class CreateService {
  constructor(
    @inject("UserRepository")
    private userRepository: IUserRepository,
  ) {}

  async execute(data: CreateUserDTO): Promise<UserResponseDTO> {
    // userRepository foi injetado automaticamente
    const created = await this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash: await hash(data.password, 10),
    });
    return this.mapToResponse(created);
  }
}
```

### 4. Registrar no Container

```typescript
// shared/container/index.ts
import "reflect-metadata";
import { container } from "tsyringe";

import { InMemoryUserRepository, IUserRepository } from "@modules/users";

// Singleton: mesma instância para toda app
container.registerSingleton<IUserRepository>("UserRepository", InMemoryUserRepository);

export { container };
```

### 5. Usar no Controller

```typescript
// users/infra/http/users.controller.ts
import { container } from "tsyringe";
import { CreateService } from "../../services/create.service";

export default class UsersController {
  public async create(req: Request, res: Response): Promise<Response> {
    // Container resolve e injeta todas as dependências
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body);
    return res.status(201).json(result);
  }
}
```

## 🧪 Testando com DI

### Sem DI (manual)

```typescript
describe("CreateService", () => {
  it("deve criar usuário", async () => {
    // Precisa instanciar manualmente
    const fakeRepository = new InMemoryUserRepository();
    const service = new CreateService(fakeRepository);

    const result = await service.execute({
      name: "João",
      email: "joao@example.com",
      password: "senha123",
    });

    expect(result.id).toBeDefined();
  });
});
```

### Com DI (mais limpo)

```typescript
describe("CreateService", () => {
  it("deve criar usuário", async () => {
    // Container injeta automaticamente
    const service = container.resolve(CreateService);

    const result = await service.execute({
      name: "João",
      email: "joao@example.com",
      password: "senha123",
    });

    expect(result.id).toBeDefined();
  });
});
```

### Com Mock/Spy

```typescript
describe("CreateService", () => {
  it("deve chamar repository.create", async () => {
    // Criar mock do repositório
    const mockRepository: IUserRepository = {
      create: vi.fn().mockResolvedValue(mockUser),
      findByEmail: vi.fn(),
      // ... outros métodos
    };

    // Registrar no container
    container.registerInstance("UserRepository", mockRepository);

    const service = container.resolve(CreateService);
    await service.execute(data);

    // Verificar se foi chamado
    expect(mockRepository.create).toHaveBeenCalled();
  });
});
```

## 🔄 Trocar Implementação (ex: Banco de Dados)

### Antes (in-memory)

```typescript
container.registerSingleton<IUserRepository>("UserRepository", InMemoryUserRepository);
```

### Depois (TypeORM)

```typescript
import { TypeOrmUserRepository } from "@modules/users/infra/database/typeorm-user.repository";

container.registerSingleton<IUserRepository>("UserRepository", TypeOrmUserRepository);
```

**Nenhuma outra mudança necessária!** Services, controllers, tudo continua igual.

## 📦 Organização

Registre tudo no container de uma vez:

```typescript
// shared/container/index.ts
import "reflect-metadata";
import { container } from "tsyringe";

// Users Module
import { InMemoryUserRepository, IUserRepository } from "@modules/users";

// Products Module
import { InMemoryProductRepository, IProductRepository } from "@modules/products";

// Auth Module
import { JwtAuthService, IAuthService } from "@modules/auth";

// Registrar tudo
container.registerSingleton<IUserRepository>("UserRepository", InMemoryUserRepository);
container.registerSingleton<IProductRepository>("ProductRepository", InMemoryProductRepository);
container.registerSingleton<IAuthService>("AuthService", JwtAuthService);

export { container };
```

## ⚠️ Armadilhas

### 1. Esquecer de importar container

```typescript
// ❌ ERRADO - 'reflect-metadata' não foi executado
export class CreateService {
  constructor(@inject("UserRepository") private repo: IUserRepository) {}
}

// ✅ CORRETO - importar antes
import "@shared/container"; // executa reflect-metadata
```

### 2. Usar classe em vez de interface no registro

```typescript
// ❌ Registra a classe concrete
container.registerSingleton(InMemoryUserRepository, InMemoryUserRepository);

// ✅ Registra com string (mais flexível)
container.registerSingleton<IUserRepository>("UserRepository", InMemoryUserRepository);
```

### 3. Circular dependencies

```typescript
// ❌ A depende de B, B depende de A
class ServiceA {
  constructor(@inject(ServiceB) private b: ServiceB) {}
}

class ServiceB {
  constructor(@inject(ServiceA) private a: ServiceA) {}
}

// ✅ Use lazy injection
class ServiceA {
  constructor(@inject(() => ServiceB) private b: () => ServiceB) {}
}
```

## 📚 Referências

- [Implementação](../backend/src/shared/container/index.ts)
- [Tsyringe Docs](https://github.com/microsoft/tsyringe)
- [Dependency Injection Pattern](https://martinfowler.com/articles/injection.html)
- [Exemplo Completo](../backend/src/modules/users/)
