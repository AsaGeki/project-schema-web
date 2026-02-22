# 📊 Logger - Pino

Documentação completa sobre como usar o **Pino Logger** para logging estruturado de alta performance.

## 🔧 Configuração

O Pino está configurado em [backend/src/config/logger.ts](../backend/src/config/logger.ts).

### Inicializar em um arquivo

```typescript
import logger from "@config/logger";

logger.info("Mensagem de info");
logger.error("Mensagem de erro");
logger.warn("Aviso");
logger.debug("Debug (apenas em desenvolvimento)");
```

## 📝 Níveis de Log

| Nível | Número | Uso                                 |
| ----- | ------ | ----------------------------------- |
| fatal | 60     | Sistema não pode continuar operando |
| error | 50     | Erro que afeta a operação           |
| warn  | 40     | Situação que pode causar problemas  |
| info  | 30     | Informações gerais (padrão)         |
| debug | 20     | Informações detalhadas (apenas dev) |
| trace | 10     | Informações muito detalhadas        |

## 🌍 Variáveis de Ambiente

```bash
# Define o nível de log
# Padrão: 'info'
LOG_LEVEL=debug

# Define o ambiente
# Afeta formatação: 'development' usa pino-pretty, 'production' usa JSON
NODE_ENV=development
```

## 📋 Exemplos Comuns

### Info (geral)

```typescript
logger.info("Servidor iniciado na porta 3333");
logger.info({ userId: "123", action: "login" }, "Usuário fez login");
```

### Error (com contexto)

```typescript
logger.error(
  {
    err: new Error("Falha na conexão"),
    userId: "123",
    retry: 3,
  },
  "Erro ao conectar ao banco",
);
```

### Debug (desenvolvimento)

```typescript
if (process.env.NODE_ENV === "development") {
  logger.debug({ data: user }, "Usuário criado com sucesso");
}
```

### Warn (aviso)

```typescript
logger.warn(
  {
    field: "email",
    reason: "Formato não padrão",
  },
  "Validação suspeita",
);
```

## 🎯 Formatação por Ambiente

### Desenvolvimento (pino-pretty)

Saída colorida e legível:

```
[10:25:33.456] INFO (1234): 🚀 Servidor rodando em http://localhost:3333
[10:25:33.460] INFO (1234): 📊 Health check disponível em http://localhost:3333/health
```

### Produção (JSON)

Saída estruturada para agregadores (Datadog, Splunk, etc):

```json
{
  "level": 30,
  "time": "2026-02-21T10:25:33.456Z",
  "pid": 1234,
  "hostname": "server",
  "msg": "Servidor rodando",
  "port": 3333
}
```

## 🔐 Segurança

### ⚠️ NUNCA faça log de dados sensíveis

```typescript
// ❌ ERRADO - expõe senha
logger.info({ user, password }, "Login tentado");

// ✅ CORRETO - só log do que interessa
logger.info({ userId: user.id, email: user.email }, "Login tentado");
```

```typescript
// ❌ ERRADO - expõe token
logger.debug({ token }, "Autenticação bem-sucedida");

// ✅ CORRETO - apenas confirma sucesso
logger.info("Autenticação bem-sucedida");
```

## 📡 Middleware HTTP Logger

O [backend/src/infra/http/middlewares/httpLogger.ts](../backend/src/infra/http/middlewares/httpLogger.ts) usa Pino para logar todas as requisições HTTP:

```typescript
// Log automático ao finalizar requisição:
GET /api/users 200 OK - 45ms

// Contexto do log:
- method
- url
- statusCode
- duration
- ip
- userAgent
```

## 🔍 Filtrando Logs

### Por nível (desenvolvimento)

```bash
# Apenas erros e acima (error, fatal)
LOG_LEVEL=error npm run dev

# Debug e acima (debug, info, warn, error, fatal)
LOG_LEVEL=debug npm run dev
```

### Em produção com agregador

Use filtros no Datadog/Splunk:

```
level >= 40  # Apenas warning e error
```

## 📦 Child Loggers

Para adicionar contexto que é repetido:

```typescript
const requestLogger = logger.child({
  userId: "123",
  requestId: "abc-def",
});

requestLogger.info("Ação realizada"); // Inclui userId e requestId automaticamente
```

## 🚀 Performance

Pino é **muito rápido**:

- Sérialização otimizada
- Não afeta performance da aplicação
- Recomendado para produção

Não use `console.log` - use `logger.info` em vez disso.

## 📚 Referências

- [Pino Official Docs](https://getpino.io/)
- [Pino Logger Guide](../backend/src/config/LOGGER_GUIDE.md) - Guia técnico
- [backend/src/config/logger.ts](../backend/src/config/logger.ts) - Implementação

## 💡 Dica

Sempre estruture seus logs com contexto:

```typescript
// Bom
logger.error(
  {
    action: "create_user",
    status: "failed",
    reason: error.message,
  },
  "Falha ao criar usuário",
);

// Melhor ainda
logger.error(
  {
    module: "users",
    service: "CreateService",
    method: "execute",
    error: error.name,
    message: error.message,
    data: { email: user.email }, // não sensível!
  },
  "CreateService falhou",
);
```
