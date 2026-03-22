# 📋 Logger

Logger estruturado com **Winston** + rotação de arquivos com **winston-daily-rotate-file**.

## 📁 Localização

`src/core/utils/logger.ts`

---

## Configuração

### Níveis Customizados

O logger usa níveis próprios em vez dos padrões do Winston:

| Nível    | Valor | Emoji | Quando usar                                                      |
| -------- | ----- | ----- | ---------------------------------------------------------------- |
| `error`  | 0     | ❌    | Erros que quebram o fluxo                                        |
| `notice` | 1     | 📢    | Eventos importantes de sistema (servidor iniciado, DB conectado) |
| `warn`   | 2     | ⚠️    | Situações anormais mas recuperáveis                              |
| `info`   | 3     | ✨    | Eventos de negócio esperados                                     |
| `debug`  | 4     | 🔍    | Informações de desenvolvimento                                   |

### Nível Ativo por Ambiente

Controlado pela variável `NODE_ENV`:

| `NODE_ENV`     | Nível ativo | Visível                   |
| -------------- | ----------- | ------------------------- |
| `dev`          | `info`      | error, notice, warn, info |
| `debug`        | `debug`     | todos                     |
| qualquer outro | `notice`    | error, notice             |

### Transports

- **Console** — formatação colorida estilo pino-pretty (dev/debug)
- **`logs/errors/error-DD_MM_YYYY.log`** — apenas `error`, JSON, max 10MB, 14 dias
- **`logs/combined/combined-DD_MM_YYYY.log`** — `notice` e acima, JSON, max 20MB, 7 dias

---

## Uso

### Importação

```typescript
import { logger } from "@core/utils/logger";
```

### Logger padrão

```typescript
logger.info("Operação concluída.");
logger.warn("Conexão lenta detectada.", { duration: 2500 });
logger.error("Falha ao processar pagamento.", { orderId, error });
logger.notice("Servidor iniciado.", { port: 3333, env: "prod" });
logger.debug("Query executada.", { sql, params });
```

### Child Loggers (recomendado)

Use `logger.child({ prefix })` para identificar a origem do log no console:

```typescript
// Em um service ou módulo
const log = logger.child({ prefix: "users" });

log.info("Usuário criado.", { userId });
// Saída: 22/03/2026 - 14:30:00 | ✨ [USERS]: Usuário criado.
//        { "userId": "abc-123" }

// Em middlewares
const log = logger.child({ prefix: "http" });
const log = logger.child({ prefix: "error" });
const log = logger.child({ prefix: "server" });
const log = logger.child({ prefix: "database" });
```

---

## Formato no Console (dev/debug)

```
22/03/2026 - 14:30:00 | ✨ [INFO]: Mensagem aqui.
22/03/2026 - 14:30:01 | ⚠️ [HTTP]: POST /api/users 409 — 12ms
22/03/2026 - 14:30:02 | ❌ [ERROR]: Erro interno.
{
  "method": "POST",
  "path": "/api/users",
  "error": { ... }
}
```

- Timestamp cinza (`\x1b[90m`)
- Nível colorido por categoria
- Metadados em JSON identado abaixo da mensagem

---

## Formato em Arquivo (produção)

JSON estruturado para ingestão por ferramentas de log (Datadog, ELK, etc.):

```json
{
  "level": "info",
  "message": "POST /api/users 201 — 48ms",
  "timestamp": "22/03/2026 - 14:30:00",
  "prefix": "http"
}
```

---

## Boas Práticas

### ✅ Faça

```typescript
// Inclua contexto relevante
log.error("Falha ao enviar e-mail.", { userId, email, error });

// Use child loggers por módulo
const log = logger.child({ prefix: "payments" });

// Níveis corretos por situação
log.notice("Servidor conectado ao banco."); // evento de sistema
log.info("Pedido criado.", { orderId }); // evento de negócio
log.warn("Token próximo do vencimento."); // alerta
log.error("Pagamento recusado.", { error }); // falha
```

### ❌ Evite

```typescript
// Nunca logar dados sensíveis
log.info("Usuário autenticado.", { password, token }); // PROIBIDO

// Nunca usar console.log
console.log("servidor iniciado"); // use log.notice()

// Não logar objetos gigantes sem filtrar
log.debug("Request completo", { req }); // muito ruído
```

---

## Rotação de Arquivos

Os arquivos de log são criados/rotacionados automaticamente com `winston-daily-rotate-file`:

```
logs/
├── errors/
│   ├── error-22_03_2026.log
│   └── error-21_03_2026.log.gz   # comprimido após rotação
└── combined/
    ├── combined-22_03_2026.log
    └── combined-21_03_2026.log.gz
```

- Arquivo comprimido (`.gz`) após rotação diária
- Limite por tamanho: `10m` (errors) e `20m` (combined)
- Retenção: `14d` (errors) e `7d` (combined)

> Os diretórios `logs/errors/` e `logs/combined/` são criados automaticamente.
