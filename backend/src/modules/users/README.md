# Módulo Users - Exemplo de Padrão CRUD

Este módulo é um exemplo prático de como implementar um módulo seguindo o padrão descrito em `universal/PADRAO-CRUD.md`.

## 📂 Estrutura

```
modules/users/
├── entities/
│   └── user.entity.ts          # Modelo puro de negócio
├── repositories/
│   └── i-user-repository.ts    # Contrato do repositório
├── dtos/
│   ├── create-user.dto.ts      # Validação Zod + tipo TS
│   ├── update-user.dto.ts      # Validação Zod + tipo TS
│   └── user-response.dto.ts    # Resposta sem dados sensíveis
├── services/
│   ├── find-all.service.ts     # Listar com paginação
│   ├── find-one.service.ts     # Buscar por ID
│   ├── create.service.ts       # Criar novo
│   ├── update.service.ts       # Atualizar
│   └── delete.service.ts       # Deletar
├── infra/
│   ├── database/
│   │   └── in-memory-user.repository.ts  # Implementação fake (substitua por TypeORM/Prisma)
│   └── http/
│       ├── users.controller.ts # Controller com classe
│       └── users.routes.ts     # Rotas com .bind()
└── index.ts                    # Exports do módulo
```

## 🔄 Fluxo de uma Requisição

### Criar um usuário (POST /api/users)

1. **Client** envia `{ name, email, password }`
2. **Router** recebe na rota `/api/users`
3. **Controller.create()** é chamado, obtém `CreateService` do container
4. **CreateService**:
   - Valida com Zod (CreateUserSchema)
   - Se inválido → lança `BadRequestError` (400)
   - Verifica se e-mail já existe → lança `ConflictError` (409)
   - Hash a senha com bcrypt
   - Chama `repository.create()`
5. **Repository** (in-memory) salva o usuário
6. **Service** mapeia User → UserResponseDTO (sem `passwordHash`)
7. **Controller** retorna status 201 com o DTO
8. **ErrorHandler** (se erro) pega `AppError` e retorna `{ error: message }` com statusCode correto

### Listar usuários (GET /api/users?skip=0&take=10&search=joão)

1. **Client** envia query params `skip`, `take`, `search`
2. **Router** recebe
3. **Controller.findAll()** passa query para `FindAllService`
4. **Service**:
   - Chama `repository.findAll(query)` para pegar dados
   - Chama `repository.count(search)` para pegar total
   - Mapeia cada User → UserResponseDTO
   - Retorna `{ data, total }`
5. **Controller** retorna 200 com objeto

## ✅ Checklist para Criar um Novo Módulo

```bash
modules/seu-modulo/
├── entities/
│   └── seu-modelo.entity.ts
├── repositories/
│   └── i-seu-repository.ts
├── dtos/
│   ├── create-seu.dto.ts
│   ├── update-seu.dto.ts
│   └── seu-response.dto.ts
├── services/
│   ├── find-all.service.ts
│   ├── find-one.service.ts
│   ├── create.service.ts
│   ├── update.service.ts
│   └── delete.service.ts
├── infra/
│   ├── database/
│   │   └── typeorm-seu.repository.ts  # ou prisma, ou in-memory
│   └── http/
│       ├── seu.controller.ts
│       └── seu.routes.ts
└── index.ts
```

## 🔧 Estendendo o Padrão

### Adicionar mais campos a User

1. **Atualizar entidade:**

   ```typescript
   export class User {
     public id!: string;
     public name!: string;
     public email!: string;
     public passwordHash!: string;
     public phone?: string; // novo campo
     // ...
   }
   ```

2. **Atualizar CreateUserSchema (dto):**

   ```typescript
   export const CreateUserSchema = z.object({
     name: z.string().min(3),
     email: z.string().email(),
     password: z.string().min(6),
     phone: z.string().optional(), // novo
   });
   ```

3. **Atualizar CreateService:**

   ```typescript
   user.phone = data.phone;
   ```

4. **Atualizar UserResponseDTO:**
   ```typescript
   export interface UserResponseDTO {
     id: string;
     name: string;
     email: string;
     phone?: string; // novo
     createdAt: Date;
     updatedAt: Date;
   }
   ```

### Adicionar validações customizadas

Use métodos na entidade:

```typescript
export class User {
  // ...
  public isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  public isPasswordStrong(password: string): boolean {
    // Validar força da senha
    return password.length >= 8;
  }
}
```

Chame de dentro do Service:

```typescript
if (!user.isEmailValid()) {
  throw new BadRequestError('E-mail inválido');
}
```

### Substituir in-memory por banco real

1. Instale TypeORM ou Prisma:

   ```bash
   npm install @typeorm/core
   ```

2. Crie a implementação em `infra/database/type-orm-user.repository.ts`

3. Registre no container:
   ```typescript
   // container/index.ts
   container.registerSingleton<IUserRepository>(
     'UserRepository',
     TypeOrmUserRepository
   );
   ```

## 🧪 Testes

Teste cada service isoladamente:

```typescript
// users.service.spec.ts
import { CreateService } from './create.service';
import { InMemoryUserRepository } from '../infra/database/in-memory-user.repository';

describe('CreateService', () => {
  it('deve criar um usuário', async () => {
    const repo = new InMemoryUserRepository();
    const service = new CreateService(repo);

    const result = await service.execute({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
    });

    expect(result.id).toBeDefined();
    expect(result.email).toBe('joao@example.com');
  });

  it('deve lançar erro se e-mail já existe', async () => {
    // ...
  });
});
```

## 📖 Referências

- [PADRAO-CRUD.md](../../universal/PADRAO-CRUD.md) - Padrão completo
- [PADRAO-ERROS.md](../../universal/PADRAO-ERROS.md) - Classes de erro
- [PADRAO-MIDDLEWARES.md](../../universal/PADRAO-MIDDLEWARES.md) - Middlewares
