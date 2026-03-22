# 🔗 Middlewares

Middlewares HTTP do Express. Cada um tem uma responsabilidade única.

## 📁 Localização

```
src/core/middlewares/
├── errorMiddleware.ts    # Handler global de erros
└── logMiddleware.ts      # Log de requisições HTTP
```

---

## Ordem de Registro

A ordem no `App` é obrigatória:

```typescript
// src/infra/https/app.ts
export class App {
  constructor() {
    this.server = express();
    this.middlewares(); // 1. segurança + parsing + log
    this.routes(); // 2. rotas dos módulos
    this.errorMiddleware(); // 3. SEMPRE por último
  }

  private middlewares(): void {
    this.server.use(helmet());
    this.server.use(express.json());
    this.server.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200" }));
    this.server.use(logMiddleware);
  }

  private routes(): void {
    this.server.use("/api", routes);
  }

  private errorMiddleware(): void {
    this.server.use(errorMiddleware);
  }
}
```

---

## `logMiddleware`

Registra todas as requisições HTTP ao detectar `res.on('finish')`.

```typescript
import { logger } from "@core/utils/logger";
import { NextFunction, Request, Response } from "express";

const log = logger.child({ prefix: "http" });

export function logMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`;

    if (res.statusCode >= 500) log.error(message);
    else if (res.statusCode >= 400) log.warn(message);
    else log.info(message);
  });

  next();
}
```

**Saída no console:**

```
22/03/2026 - 14:30:00 | ✨ [HTTP]: POST /api/users 201 — 48ms
22/03/2026 - 14:30:01 | ⚠️ [HTTP]: GET /api/users/abc 404 — 12ms
22/03/2026 - 14:30:02 | ❌ [HTTP]: POST /api/users 500 — 5ms
```

---

## `errorMiddleware`

Captura todos os erros passados ao `next(error)` pelo Express.

```typescript
import { AppError } from "@core/errors/AppError";
import { logger } from "@core/utils/logger";
import { ErrorRequestHandler } from "express";

const log = logger.child({ prefix: "error" });

export const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) {
    log.warn(error.message, { method: req.method, path: req.path, statusCode: error.statusCode });
    return res.status(error.statusCode).json({
      success: false,
      title: error.title ?? "Erro na requisição",
      message: error.message,
      details: error.details ?? null,
    });
  }

  log.error("Erro interno do servidor.", { method: req.method, path: req.path, error });
  return res.status(500).json({
    success: false,
    title: "Erro interno do servidor",
    message: "Ocorreu um erro interno.",
  });
};
```

> Ver [error-handling.md](error-handling.md) para detalhes completos.

---

## Middlewares de Segurança

### Helmet

Configura headers de segurança HTTP automaticamente:

```typescript
import helmet from "helmet";
app.use(helmet());
// X-Content-Type-Options, X-Frame-Options, HSTS, etc.
```

### CORS

```typescript
import cors from "cors";
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200" }));
```

Configure `CORS_ORIGIN` no `.env` para restringir origens em produção.

### Rate Limit

Pode ser adicionado em `middlewares()` para proteção de abuso:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Muitas requisições. Tente novamente mais tarde." },
});

app.use("/api", limiter);
```

---

## Middleware de Autenticação (exemplo)

Para rotas protegidas, crie um middleware em `src/core/middlewares/authMiddleware.ts`:

```typescript
import { UnauthorizedError } from "@core/errors/AppError";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new UnauthorizedError("Token não fornecido.");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = payload;
    next();
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado.");
  }
}
```

Uso nas rotas:

```typescript
import { authMiddleware } from "@core/middlewares/authMiddleware";

router.get("/profile", authMiddleware, controller.profile.bind(controller));
```

---

## Fluxo Completo

```
Request
   ↓
helmet()              – headers de segurança
   ↓
cors()                – validação de origem
   ↓
express.json()        – parse do body
   ↓
logMiddleware         – inicia cronômetro
   ↓
[authMiddleware]      – (opcional, por rota)
   ↓
Router / Controller   – lógica da rota
   ↓
logMiddleware finish  – registra método, path, status, duração
   ↓
[se erro] errorMiddleware – retorna JSON de erro padronizado
```
