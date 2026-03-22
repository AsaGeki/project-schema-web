# ❌ Tratamento de Erros

Sistema de erros estruturado baseado em classes, integrado ao Express via `errorMiddleware`.

## 🏗️ Arquitetura

```
Service lança AppError (ou subclasse)
         ↓
express-async-errors captura e passa para next(error)
         ↓
errorMiddleware (último middleware do Express)
   ├─ instanceof AppError? → res.status(err.statusCode).json(...)
   └─ Erro desconhecido? → log.error + res.status(500)
```

## 📁 Localização

- **Classes de erro:** `src/core/errors/AppError.ts`
- **Middleware:** `src/core/middlewares/errorMiddleware.ts`

---

## Classes de Erro

### `AppError` — Classe Base

```typescript
export interface IAppErrorOptions {
  message?: string;
  title?: string;
  details?: unknown;
  isOperational?: boolean;
}

type ErrorInput = string | IAppErrorOptions;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly title?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;
  public readonly originFile?: string; // arquivo que lançou o erro (extraído da stack)

  constructor(input: ErrorInput, defaultStatusCode: number = 500) { ... }
}
```

**Dois modos de uso:**

```typescript
// Simples (string)
throw new NotFoundError("Usuário não encontrado.");

// Detalhado (objeto)
throw new BadRequestError({
  message: "Dados inválidos.",
  title: "Erro de validação",
  details: { field: "email", reason: "formato inválido" },
});
```

---

## Tabela de Erros

| Classe                     | Status | Quando usar                            |
| -------------------------- | ------ | -------------------------------------- |
| `BadRequestError`          | 400    | Dados inválidos, formato incorreto     |
| `UnauthorizedError`        | 401    | Token ausente ou inválido              |
| `ForbiddenError`           | 403    | Autenticado mas sem permissão          |
| `NotFoundError`            | 404    | Recurso não encontrado                 |
| `ConflictError`            | 409    | E-mail/recurso duplicado               |
| `UnprocessableEntityError` | 422    | Regra de negócio não atendida          |
| `TooManyRequestsError`     | 429    | Rate limit excedido                    |
| `InternalServerError`      | 500    | Erro inesperado (isOperational: false) |

---

## Uso nos Services

```typescript
@injectable()
export class UpdateService {
  constructor(@inject("UsersRepository") private usersRepository: IUsersRepository) {}

  async execute(id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    // 1. Recurso existe?
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundError("Usuário não encontrado.");

    // 2. Conflito de unicidade?
    if (data.email && data.email !== user.email) {
      const conflict = await this.usersRepository.findByEmail(data.email);
      if (conflict) throw new ConflictError("E-mail já em uso.");
      user.email = data.email;
    }

    if (data.name) user.name = data.name;

    const updated = await this.usersRepository.update(user);
    const { passwordHash: _, ...response } = updated;
    return response as UserResponseDTO;
  }
}
```

---

## `errorMiddleware`

**Deve ser o último `app.use()` registrado no Express.**

```typescript
import { AppError } from "@core/errors/AppError";
import { logger } from "@core/utils/logger";
import { ErrorRequestHandler } from "express";

const log = logger.child({ prefix: "error" });

export const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) {
    log.warn(error.message, {
      method: req.method,
      path: req.path,
      statusCode: error.statusCode,
      originFile: error.originFile,
      title: error.title,
      details: error.details,
    });

    return res.status(error.statusCode).json({
      success: false,
      title: error.title ?? "Erro na requisição",
      message: error.message,
      details: error.details ?? null,
    });
  }

  // Erros desconhecidos (bugs)
  log.error("Erro interno do servidor.", { method: req.method, path: req.path, error });

  return res.status(500).json({
    success: false,
    title: "Erro interno do servidor",
    message: "Ocorreu um erro interno.",
  });
};
```

---

## Formato das Respostas HTTP

### Erro operacional (ex: 404)

```json
{
  "success": false,
  "title": "Erro na requisição",
  "message": "Usuário não encontrado.",
  "details": null
}
```

### Erro com detalhes (ex: 400)

```json
{
  "success": false,
  "title": "Erro de validação",
  "message": "Dados inválidos.",
  "details": { "field": "email", "reason": "formato inválido" }
}
```

### Erro interno (500)

```json
{
  "success": false,
  "title": "Erro interno do servidor",
  "message": "Ocorreu um erro interno."
}
```

---

## Como Registrar

Em `src/infra/https/app.ts`, o `errorMiddleware` deve ser adicionado **depois de todas as rotas**:

```typescript
export class App {
  constructor() {
    this.server = express();
    this.middlewares(); // helmet, cors, json, logMiddleware
    this.routes(); // rotas dos módulos
    this.errorMiddleware(); // SEMPRE POR ÚLTIMO
  }

  private errorMiddleware(): void {
    this.server.use(errorMiddleware);
  }
}
```

---

## `express-async-errors`

O pacote `express-async-errors` (importado em `app.ts`) faz o Express capturar automaticamente erros lançados dentro de handlers `async`. Sem ele, seria necessário fazer:

```typescript
// Sem express-async-errors (verboso)
router.post("/", async (req, res, next) => {
  try {
    const result = await service.execute(req.body);
    res.json(result);
  } catch (err) {
    next(err); // necessário manualmente
  }
});

// Com express-async-errors (limpo)
router.post("/", async (req, res) => {
  const result = await service.execute(req.body); // erros capturados automaticamente
  res.json(result);
});
```

---

## `originFile`

O campo `originFile` na resposta interna do log indica o arquivo exato que lançou o erro, extraído automaticamente da stack trace. Muito útil para debug em produção sem stack trace exposta ao cliente.
