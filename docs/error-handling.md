# ⚠️ Error Handling

Guia completo sobre tratamento de erros estruturado.

**Referência:** [universal/PADRAO-ERROS.md](../universal/PADRAO-ERROS.md)

## 🏗️ Arquitetura

```
┌─────────────────────────┐
│ Service/Route lança erro│
└────────┬────────────────┘
         │
    ┌────▼─────────────────────────┐
    │ Express passa para middleware │
    │ next(error)                   │
    └────┬─────────────────────────┘
         │
         │ instanceof AppError?
    ┌────▼──────────────┐
    │ SIM: Retorna com  │
    │ statusCode correto│
    │ { error: msg }    │
    └───────────────────┘
         │
    ┌────▼──────────────┐
    │ NÃO: Log + 500    │
    │ { error: texto }  │
    └───────────────────┘
```

## 📦 Classe Base: AppError

Todas as exceções customizadas estendem `AppError`.

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

**Por que `Object.setPrototypeOf`?**

Garante que `instanceof AppError` funciona mesmo após serialização (em Node.js).

## 🔴 Erros HTTP

Cada classe corresponde a um status code HTTP:

| Classe                     | Status | Quando Usar                               |
| -------------------------- | ------ | ----------------------------------------- |
| `BadRequestError`          | 400    | Dados inválidos, validação Zod            |
| `UnauthorizedError`        | 401    | Sem autenticação (token ausente/inválido) |
| `ForbiddenError`           | 403    | Autenticado mas sem permissão             |
| `NotFoundError`            | 404    | Recurso não encontrado                    |
| `ConflictError`            | 409    | Conflito (ex.: e-mail duplicado)          |
| `UnprocessableEntityError` | 422    | Entidade não processável                  |
| `TooManyRequestsError`     | 429    | Rate limit excedido                       |
| `InternalServerError`      | 500    | Erro inesperado (fallback)                |

## 💻 Implementação

Disponível em [backend/src/shared/errors/index.ts](../backend/src/shared/errors/index.ts):

```typescript
export class BadRequestError extends AppError {
  constructor(message: string = "Requisição inválida.") {
    super(message, 400);
    this.name = "BadRequestError";
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Não autorizado.") {
    super(message, 401);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Registro não encontrado.") {
    super(message, 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflito com o estado atual.") {
    super(message, 409);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string = "Entidade não processável.") {
    super(message, 422);
    this.name = "UnprocessableEntityError";
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = "Muitas requisições. Tente novamente mais tarde.") {
    super(message, 429);
    this.name = "TooManyRequestsError";
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Erro interno do servidor.") {
    super(message, 500);
    this.name = "InternalServerError";
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
```

## 🎯 Como Usar nos Services

### Validação com Zod

```typescript
const validation = CreateUserSchema.safeParse(data);
if (!validation.success) {
  const firstError = validation.error.errors[0];
  throw new BadRequestError(firstError.message);
}
```

### Verificar se recurso existe

```typescript
const user = await this.userRepository.findById(id);
if (!user) {
  throw new NotFoundError("Usuário não encontrado");
}
```

### Conflito (duplicata)

```typescript
const existing = await this.userRepository.findByEmail(data.email);
if (existing) {
  throw new ConflictError("E-mail já cadastrado");
}
```

### Regra de negócio

```typescript
if (user.role !== "admin") {
  throw new ForbiddenError("Apenas admins podem fazer isso");
}
```

### Autenticação

```typescript
if (!token) {
  throw new UnauthorizedError("Token ausente");
}

if (!isTokenValid(token)) {
  throw new UnauthorizedError("Token inválido ou expirado");
}
```

## 🚨 Global Error Handler

Middleware registrado **por último** no Express:

```typescript
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // AppError → responder com statusCode correto
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Erro desconhecido → logar e retornar 500
  logger.error({
    err,
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    error: "Erro interno do servidor",
    // Expor mensagem apenas em desenvolvimento
    ...(process.env.NODE_ENV === "development" && { message: err.message }),
  });
};
```

**Registro no servidor:**

```typescript
// Deve ser o ÚLTIMO middleware
app.use(errorHandler);
```

## 📋 Exemplo Completo

### Service com múltiplas validações

```typescript
@injectable()
export class UpdateService {
  constructor(
    @inject("UserRepository")
    private userRepository: IUserRepository,
  ) {}

  async execute(id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    // Validação 1: Dados inválidos
    const validation = UpdateUserSchema.safeParse(data);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors[0].message);
    }

    // Validação 2: Recurso não encontrado
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    // Validação 3: Conflito (e-mail duplicado)
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError("E-mail já cadastrado");
      }
    }

    // Lógica de negócio...
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    user.updatedAt = new Date();

    const updated = await this.userRepository.update(user);
    return this.mapToResponse(updated);
  }
}
```

### Respostas HTTP

**Requisição bem-sucedida:**

```bash
GET /api/users/123
→ 200 OK
{
  "id": "123",
  "name": "João",
  "email": "joao@example.com",
  "createdAt": "2026-02-21T10:00:00Z",
  "updatedAt": "2026-02-21T10:00:00Z"
}
```

**Erro 400 - Dados inválidos:**

```bash
POST /api/users
{ "name": "João", "email": "invalido", "password": "123" }
→ 400 Bad Request
{
  "error": "E-mail inválido"
}
```

**Erro 404 - Não encontrado:**

```bash
GET /api/users/999
→ 404 Not Found
{
  "error": "Registro não encontrado"
}
```

**Erro 409 - Conflito:**

```bash
POST /api/users
{ "name": "João", "email": "joao@example.com", "password": "senha123" }
(e-mail já existe)
→ 409 Conflict
{
  "error": "E-mail já cadastrado"
}
```

**Erro 500 - Servidor:**

```bash
GET /api/users
(database crash)
→ 500 Internal Server Error
{
  "error": "Erro interno do servidor"
}
```

## 🔐 Boas Práticas

### ✅ DO's (Faça)

```typescript
// Mensagens descritivas
throw new NotFoundError('Usuário com ID 123 não encontrado');

// Contexto específico
throw new BadRequestError('E-mail deve ter domínio válido');

// Erro correto por operação
if (!user) throw new NotFoundError(...);
if (duplicate) throw new ConflictError(...);
if (invalid) throw new BadRequestError(...);
```

### ❌ DON'Ts (Não faça)

```typescript
// Mensagens genéricas
throw new BadRequestError("Erro");

// Expor stack trace ao cliente
throw new Error(error.stack);

// Status code genérico
return res.status(400).json({ error });

// Sem log em erros inesperados
throw new Error("Falhou");
```

## 🧪 Testando Erros

```typescript
import { describe, it, expect } from "vitest";
import { CreateService } from "./create.service";
import { BadRequestError, ConflictError } from "@shared/errors";

describe("CreateService", () => {
  it("deve lançar BadRequestError se e-mail inválido", async () => {
    const service = new CreateService(repository);

    expect(() => service.execute({ name: "João", email: "invalido", password: "123" })).rejects.toThrow(
      BadRequestError,
    );
  });

  it("deve lançar ConflictError se e-mail já existe", async () => {
    const service = new CreateService(repository);

    expect(() => service.execute({ name: "João", email: "existente@example.com", password: "123" })).rejects.toThrow(
      ConflictError,
    );
  });
});
```

## 📚 Referências

- [Implementação](../backend/src/shared/errors/index.ts)
- [Handler Global](../backend/src/infra/http/middlewares/errorHandler.ts)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [REST API Error Handling Best Practices](https://www.rfc-editor.org/rfc/rfc9110.html)
