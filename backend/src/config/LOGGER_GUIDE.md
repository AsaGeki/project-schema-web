# 📝 Guia de Uso do Logger (Pino)

## 📦 Configuração

O logger Pino está configurado em `backend/src/config/logger.ts` com:

- **Logs coloridos** em desenvolvimento (pino-pretty)
- **Logs JSON** em produção (melhor para agregadores)
- **Timestamps ISO** automáticos
- **Níveis configuráveis** via variável de ambiente

## 🎯 Níveis de Log

Configure via `LOG_LEVEL` no `.env`:

```bash
LOG_LEVEL=debug  # Mostra tudo (desenvolvimento)
LOG_LEVEL=info   # Informações gerais (padrão)
LOG_LEVEL=warn   # Avisos importantes
LOG_LEVEL=error  # Apenas erros críticos (produção)
```

**Hierarquia:** `trace` < `debug` < `info` < `warn` < `error` < `fatal`

## 💻 Como Usar

### Importar o logger:

```typescript
import logger from '@config/logger';
```

### Exemplos básicos:

```typescript
// Informação simples
logger.info('Usuário criado com sucesso');

// Com dados estruturados
logger.info({ userId: '123', email: 'user@example.com' }, 'Novo usuário');

// Warning
logger.warn({ count: 5 }, 'Muitas tentativas de login');

// Erro
logger.error({ err: error }, 'Falha ao conectar no banco');

// Debug (só aparece se LOG_LEVEL=debug)
logger.debug({ query: sql }, 'Query executada');

// Fatal (erro crítico - encerra processo)
logger.fatal({ err: error }, 'Erro irrecuperável');
```

### Em Services:

```typescript
// modules/users/services/CreateUserService.ts
import logger from '@config/logger';

export class CreateUserService {
  async execute(data: CreateUserDTO) {
    logger.info({ email: data.email }, 'Criando novo usuário');

    try {
      const user = await this.repository.create(data);
      logger.info({ userId: user.id }, 'Usuário criado com sucesso');
      return user;
    } catch (error) {
      logger.error({ err: error, email: data.email }, 'Erro ao criar usuário');
      throw error;
    }
  }
}
```

### Em Controllers:

```typescript
// modules/users/infra/http/controllers/UserController.ts
import logger from '@config/logger';

export class UserController {
  async create(req: Request, res: Response) {
    const { email, name } = req.body;

    logger.debug(
      { body: req.body },
      'Request recebida em UserController.create'
    );

    const user = await this.createUserService.execute({ email, name });

    return res.status(201).json(user);
  }
}
```

## 🌐 HTTP Logger

Para logar todas as requisições HTTP automaticamente, descomente no `server.ts`:

```typescript
// HTTP Logger (opcional - descomente para ativar logging de requisições)
app.use(httpLogger);
```

Isso vai logar:

```
[INFO] GET /api/users 200 42ms
[INFO] POST /api/users 201 123ms
[ERROR] GET /api/users/999 404 12ms
```

## 🎨 Formato dos Logs

### Desenvolvimento (pino-pretty):

```
[14:35:22] INFO: 🚀 Servidor rodando em http://localhost:3333
[14:35:25] INFO: GET /health 200 5ms
[14:35:30] ERROR: Erro ao criar usuário
    email: "user@example.com"
    err: {
      message: "Email já existe",
      stack: "..."
    }
```

### Produção (JSON):

```json
{
  "level": 30,
  "time": "2026-02-11T17:35:22.123Z",
  "msg": "🚀 Servidor rodando em http://localhost:3333",
  "env": "production"
}
```

## 🔍 Boas Práticas

### ✅ FAÇA:

```typescript
// Estruture dados importantes
logger.info({ userId, action: 'login' }, 'Usuário autenticado');

// Use child loggers para contexto
const userLogger = logger.child({ module: 'users' });
userLogger.info('Processando usuários');

// Capture erros com stack trace
logger.error({ err: error }, 'Falha na operação');
```

### ❌ EVITE:

```typescript
// Não logue senhas ou dados sensíveis
logger.info({ password: '123456' }); // ❌ NUNCA!

// Não concatene strings (use campos estruturados)
logger.info('User ' + userId + ' logged in'); // ❌ Ruim

// Não use console.log (use logger)
console.log('Debug info'); // ❌ Use logger.debug()
```

## 📊 Integração com Agregadores

O formato JSON em produção é compatível com:

- **Datadog**
- **Elastic Stack (ELK)**
- **CloudWatch**
- **Splunk**
- **New Relic**

Exemplo de query (Elastic):

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "userId": "123" } },
        { "range": { "level": { "gte": 40 } } }
      ]
    }
  }
}
```

## 🛠️ Performance

Pino é o logger Node.js mais rápido:

- **5x mais rápido** que Winston
- **10x mais rápido** que Bunyan
- Escreve de forma assíncrona (não bloqueia o event loop)

---

**✨ Logger configurado e pronto para usar!**
