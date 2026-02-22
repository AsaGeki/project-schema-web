# 🔗 Middlewares

Documentação sobre middlewares HTTP usados no projeto.

**Referência:** [universal/PADRAO-MIDDLEWARES.md](../universal/PADRAO-MIDDLEWARES.md)

## 📍 Ordem de Registro no Express

A **ordem importa** em middlewares Express. O padrão correto é:

```typescript
// 1. Segurança
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// 2. Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 3. Parsing
app.use(express.json());

// 4. Log de requisição
app.use(httpLogger);

// 5. Health check
app.get('/health', ...);

// 6. Rotas da aplicação
app.use('/api/users', usersRouter);

// 7. Rota 404
app.use((req, res) => res.status(404).json({ error: 'Não encontrado' }));

// 8. Error handler (OBRIGATORIAMENTE por último)
app.use(errorHandler);
```

## 🚨 HTTP Logger Middleware

Implementação em [backend/src/infra/http/middlewares/httpLogger.ts](../backend/src/infra/http/middlewares/httpLogger.ts)

### O que registra

```typescript
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "error" : "info";

    logger[logLevel]({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });
  });

  next();
};
```

### Saída em Desenvolvimento

Colorido e legível (pino-pretty):

```
[10:25:33.456] INFO: GET /api/users 200 - 45ms
[10:25:34.123] INFO: POST /api/users 201 - 156ms
[10:25:35.789] ERROR: GET /api/users/999 404 - 12ms
[10:25:36.234] ERROR: POST /api/users 409 - 89ms
```

### Saída em Produção

JSON estruturado para agregadores:

```json
{
  "level": 30,
  "time": "2026-02-21T10:25:33.456Z",
  "method": "GET",
  "url": "/api/users",
  "statusCode": 200,
  "duration": "45ms",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Quando Registra

- **Início:** Antes de qualquer rota ser processada
- **Fim:** Quando `res.finish()` é emitido (resposta completada)

**Vantagem:** Detecta requisições lentas, bloqueadas ou não respondidas.

## ⚠️ Error Handler Middleware

Implementação em [backend/src/infra/http/middlewares/errorHandler.ts](../backend/src/infra/http/middlewares/errorHandler.ts)

### Assinatura

```typescript
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => { ... }
);
```

**Importante:** 4 argumentos! Express reconhece como error handler.

### Funcionamento

```typescript
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Se é AppError → retornar com statusCode correto
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Erro desconhecido → logar
  logger.error({
    err,
    message: err.message,
    stack: err.stack,
  });

  // Retornar 500
  return res.status(500).json({
    error: "Erro interno do servidor",
    // Expor mensagem apenas em dev (segurança)
    ...(process.env.NODE_ENV === "development" && { message: err.message }),
  });
};
```

### Casos que Captura

1. **Erro lançado em middleware/rota:**

```typescript
app.get("/api/users/:id", (req, res) => {
  throw new NotFoundError("Usuário não encontrado");
  // → errorHandler captura
});
```

2. **Promise rejeitada em rota async:**

```typescript
app.get("/api/users/:id", async (req, res) => {
  // Sem try-catch, 'express-async-errors' passa para errorHandler
  const user = await service.execute(id);
  return res.json(user);
});
```

3. **next(error) em middleware:**

```typescript
app.use((req, res, next) => {
  try {
    // algo
  } catch (err) {
    next(err); // → errorHandler captura
  }
});
```

## 🎯 Como Criar um Middleware Customizado

### Middleware simples

```typescript
const exemplo = (req: Request, res: Response, next: NextFunction) => {
  console.log(`Requisição para ${req.url}`);
  next(); // Importante! Passa para próximo middleware
};

app.use(exemplo);
```

### Middleware com lógica

```typescript
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Token ausente");
    // errorHandler captura e retorna 401
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded; // Express tipagem customizada
    next();
  } catch (err) {
    throw new UnauthorizedError("Token inválido");
  }
};

app.use(authMiddleware); // Aplica a todas as rotas
// OU
app.post("/api/protected", authMiddleware, controller.handle); // Apenas aquela rota
```

### Com tipagem correct

```typescript
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new UnauthorizedError();

  // Decodificar e adicionar ao req
  req.user = jwt.verify(token, process.env.JWT_SECRET!);
  next();
};
```

## 📦 Middlewares de Segurança

### Helmet (XSS, Clickjacking, etc)

```typescript
import helmet from "helmet";
app.use(helmet());

// Ou customizado:
app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000 },
  }),
);
```

### CORS (Cross-Origin)

```typescript
import cors from "cors";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

### Rate Limiting (DDoS)

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máx 100 requisições por IP
  message: { error: "Muitas requisições, tente mais tarde" },
  standardHeaders: true, // Retorna info no header `RateLimit-*`
  legacyHeaders: false,
});

app.use(limiter);

// Ou diferente por rota:
const strictLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
app.post("/api/auth/login", strictLimiter, loginController.handle);
```

## 🔄 Fluxo Completo com Middlewares

```
Client Request
  ↓
helmet (Headers seguros)
  ↓
cors (CORS headers)
  ↓
rateLimit (DDoS check)
  ↓
express.json() (Parse JSON)
  ↓
httpLogger (Log antes)
  ↓
authMiddleware (Validar token)
  ↓
Router → Controller
  ↓
Service (lógica)
  ↓
httpLogger (Log depois - duração)
  ↓
Response enviada
  ↓
[Se erro] → errorHandler (Tratamento)
  ↓
Client Response
```

## 🚨 Debug de Middlewares

Adicione logs para entender a ordem:

```typescript
const debugMiddleware = (name: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`[MIDDLEWARE] ${name} - ${req.method} ${req.url}`);
    next();
  };
};

app.use(debugMiddleware("helmet"));
app.use(helmet());

app.use(debugMiddleware("cors"));
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// ... resto dos middlewares
```

## 📝 Comparação: Middleware vs Rota vs Service

| Local      | Usa para                        | Exemplo                    |
| ---------- | ------------------------------- | -------------------------- |
| Middleware | Lógica compartilhada global     | Autenticação (todas rotas) |
| Rota       | Lógica específica da requisição | GET /api/users/:id         |
| Service    | Lógica pura de negócio          | Validar e-mail             |

```typescript
// Middleware globalizando autenticação
app.use(authenticateToken);

// Rota específica convertendo para controller
router.get("/users", controller.findAll.bind(controller));

// Service com lógica pura
const users = await this.userRepository.findAll(query);
```

## 🧪 Testando Middlewares

```typescript
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./server";

describe("Middlewares", () => {
  it("httpLogger deve registrar requisição", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    // Log será emitido automaticamente
  });

  it("errorHandler deve capturar erros lançados", async () => {
    const response = await request(app).get("/api/users/999");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Registro não encontrado");
  });

  it("rate limiter deve bloquear após limite", async () => {
    const strictApp = rateLimit({ max: 2 })(app);
    await request(strictApp).get("/health");
    await request(strictApp).get("/health");
    const third = await request(strictApp).get("/health");
    expect(third.status).toBe(429); // Too Many Requests
  });
});
```

## 📚 Referências

- [Implementações](../backend/src/infra/http/middlewares/)
- [Express Middleware Docs](https://expressjs.com/en/guide/using-middleware.html)
- [Helmet Docs](https://helmetjs.github.io/)
- [CORS Docs](https://github.com/expressjs/cors)
- [Rate Limit Docs](https://github.com/nfriedly/express-rate-limit)
