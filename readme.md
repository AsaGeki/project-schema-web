# 🚀 Universal Base Project

> **Uma base sólida e escalável para aplicações fullstack modernas**  
> Criado por Arthur Gabriel Oliveira de Macedo (AsaGeki)

---

## 📖 Sobre

Base para **fullstack web apps** seguindo **Clean Architecture**, **DDD** e **arquitetura modular**. Node.js + TypeScript no backend (Express), Angular 17 no frontend.

Pronta para copiar e colar em novos projetos com padrões confiáveis e estrutura escalável.

---

## 🛠️ Tech Stack

**Backend:** Node.js 20+ • TypeScript • Express • Helmet • CORS • Rate Limit • Zod • Pino Logger • Tsyringe • Bcryptjs • JWT • Vitest

**Frontend:** Angular 17 • TypeScript • Tailwind CSS • Zod • RxJS • Vitest

---

## 🚀 Quick Start

```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend
cd frontend && npm install && npm start

# Health check
curl http://localhost:3333/health
```

---

## 📚 Documentação

**Toda a documentação está em [docs/](docs/)**:

| Documento                                                        | Para                          |
| ---------------------------------------------------------------- | ----------------------------- |
| **[docs/INDEX.md](docs/INDEX.md)**                               | Começar aqui! Índice completo |
| **[docs/estrutura-projeto.md](docs/estrutura-projeto.md)**       | Entender a arquitetura        |
| **[docs/crud.md](docs/crud.md)**                                 | Criar novos módulos           |
| **[docs/error-handling.md](docs/error-handling.md)**             | Tratar erros                  |
| **[docs/logger.md](docs/logger.md)**                             | Usar logging                  |
| **[docs/middlewares.md](docs/middlewares.md)**                   | Criar middlewares             |
| **[docs/dependency-injection.md](docs/dependency-injection.md)** | Usar DI                       |

**Padrões reutilizáveis** em [universal/](universal/) para copiar para outros projetos.

---

## ✨ O Que Está Implementado

✅ **Clean Architecture** • **DDD** • **Dependency Injection** (tsyringe)  
✅ **Padrão CRUD completo** (entities, repos, services, controllers)  
✅ **Error Handling** (AppError com 8 tipos + global handler)  
✅ **Logger estruturado** (Pino com dev colorido + JSON em prod)  
✅ **HTTP Middlewares** (logging, error handling, segurança)  
✅ **Validação** (Zod para requests e responses)  
✅ **Exemplo funcional** (módulo users pronto para usar)  
✅ **Type-safe** (TypeScript strict mode)

- `✨ Recursos Implementados

## ✨ Recursos Implementados

### 🔒 Segurança

- ✅ **Helmet** - Headers HTTP seguros (XSS, Clickjacking, MIME sniffing)
- ✅ **CORS** - Configurável por ambiente
- ✅ **Rate Limit** - Proteção contra DDoS (100 req/15min)
- ✅ **Bcryptjs** - Hash de senhas seguro

### 🏗️ Arquitetura

- ✅ **Clean Architecture** - Separação clara de camadas
- ✅ **DDD** - Domain-Driven Design (módulos por domínio)
- ✅ **Dependency Injection** - tsyringe para IoC
- ✅ **Path Aliases** - Imports limpos (`@shared`, `@config`, `@modules`)
- ✅ **Repository Pattern** - Interfaces agnósticas a banco de dados

### 🧪 Validação e Testes

- ✅ **Zod** - Validação de schemas com type-safety
- ✅ **Vitest** - Testes rápidos (backend e frontend)
- ✅ **TypeScript Strict** - Type-safety completo

### 📊 Logging e Monitoramento

- ✅ **Pino Logger** - Logging estruturado de alta performance
- ✅ **HTTP Logger Middleware** - Loga todas as requisições (método, URL, status, duração, IP)
- ✅ **Logs coloridos** em desenvolvimento (pino-pretty)
- ✅ **Logs JSON** em produção (pronto para agregadores como Datadog)

### ⚠️ Tratamento de Erros

- ✅ **AppError Base** - Classe base extensível
- ✅ **Erros por HTTP Status Code**:
  - 400 BadRequestError
  - 401 UnauthorizedError
  - 403 ForbiddenError
  - 404 NotFoundError
  - 409 ConflictError
  - 422 UnprocessableEntityError
  - 429 TooManyRequestsError
  - 500 InternalServerError
- ✅ **Global Error Handler** - Middleware que trata erros automaticamente

### 🔄 Padrão CRUD Completo

- ✅ **Módulo Users exemplo** - Implementação funcional do padrão
- ✅ **Repository Interface** - Contrato com dados
- ✅ **Um Service por Operação** - FindAll, FindOne, Create, Update, Delete
- ✅ **DTOs com Zod** - Validação de entrada/saída
- ✅ **Controller como Classe** - Com `.bind()` nas rotas
- ✅ **In-Memory Repository** - Para testes e desenvolvimento rápido

### 🎨 Code Quality

- ✅ **ESLint** - Linting para TypeScript
- ✅ **Prettier** - Formatação automática
- ✅ **Strict TypeScript** - Type-safety máximo
- ✅ **Kebab-case** - Convenção de nomes de arquivos

### 📦 DevOps Ready

- ✅ **Environment Variables** - `.env` por ambiente
- ✅ **Build Scripts** - Compilação otimizada
- ✅ **Health Check** - Endpoint `/health` para monitoramento
- ✅ **package.json Scripts** - dev, build, test, lint, format

## 🎯 Próximos Passos

- [ ] Integração com banco de dados (Prisma/TypeORM)
- [ ] Autenticação JWT
- [ ] Testes E2E (Playwright)
- [ ] Documentação da API (Swagger/OpenAPI)
- [ ] Docker e Docker Compose
- [ ] CI/CD pipelines (GitHub Actions)
- [ ] Upload de arquivos
- [ ] Websockets (Socket.io)
- [ ] Filas e workers (BullMQ)

---

## 📚 Documentação

A documentação completa está na pasta **[docs/](docs/)**:

- **[📖 Índice de Documentação](docs/INDEX.md)** - Comece aqui!
- **[🏗️ Estrutura do Projeto](docs/estrutura-projeto.md)** - Visão geral da arquitetura
- **[🔄 Padrão CRUD](docs/crud.md)** - Como criar novos módulos
- **[⚠️ Tratamento de Erros](docs/error-handling.md)** - AppError e handler global
- **[📊 Logger](docs/logger.md)** - Pino Logger estruturado
- **[🔗 Middlewares](docs/middlewares.md)** - HTTP middlewares Express
- **[💉 Injeção de Dependência](docs/dependency-injection.md)** - tsyringe Container

### 📖 Padrões Reutilizáveis

A pasta **[universal/](universal/)** contém padrões que podem ser copiados para outros projetos:

- **[PADRAO-CRUD.md](universal/PADRAO-CRUD.md)** - Especificação do padrão CRUD
- **[PADRAO-ERROS.md](universal/PADRAO-ERROS.md)** - Especificação do padrão de erros
- **[PADRAO-MIDDLEWARES.md](universal/PADRAO-MIDDLEWARES.md)** - Especificação de middlewares

### ✨ Implementação Exemplo

- **[Módulo Users](backend/src/modules/users/)** - Exemplo completo de CRUD
- **[IMPLEMENTACAO-MODULO-USERS.md](IMPLEMENTACAO-MODULO-USERS.md)** - Guia do módulo users
- **[backend/src/config/LOGGER_GUIDE.md](backend/src/config/LOGGER_GUIDE.md)** - Guia técnico do logger

### 🏗️ Arquitetura

- ✅ **Clean Architecture** - Separação de camadas e responsabilidades
- ✅ **DDD** - Domain-Driven Design
- ✅ **Dependency Injection** - Tsyringe configurado
- ✅ **Path Aliases** - Imports limpos (`@shared`, `@config`, `@modules`)
- ✅ **Error Handling** - Tratamento global de erros

### 🧪 Testes

- ✅ **Vitest** - Testes rápidos (backend e frontend)
- ✅ **Coverage** - Relatórios de cobertura
- ✅ **UI Mode** - Interface visual para debugging

### 🎨 Code Quality

- ✅ **TypeScript** - Type-safety completo com strict mode
- ✅ **ESLint** - Linting para TypeScript e Angular
- ✅ **Prettier** - Formatação automática de código
- ✅ **Git Hooks** - Validação antes de commits (opcional)

### 📦 DevOps Ready

- ✅ **Environment Variables** - Configuração via `.env`
- ✅ **Build Scripts** - Compilação otimizada para produção
- ✅ **Health Check** - Endpoint `/health` para monitoramento

---

## npm run format` - Formata código (Prettier)

- `npm run format:check` - Verifica formatação sem alterar
- `npm test` - Executa testes
- `npm run lint` - Verifica e corrige código

**Frontend:**

- `npm start` - Servidor de desenvolvimento
- `npm run build` - Build otimizado
- `npm test` - Executa testes
- `npm run lint` - Verifica e corrige código

---

## 🎯 Próximos no Roadmap

- [ ] Autenticação JWT completa
- [ ] Integração com banco de dados (Prisma/TypeORM)
- [ ] Testes E2E (Playwright)
- [ ] Documentação da API (Swagger/OpenAPI)
- [ ] Docker e Docker Compose
- [ ] CI/CD pipelines (GitHub Actions)
- [ ] Upload de arquivos com S3
- [ ] Websockets (Socket.io)
- [ ] Filas e workers (BullMQ)

---

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues ou enviar pull requests. Toda contribuição é bem-vinda!

---

## 📝 Licença

Este projeto está sob a licença MIT.

---

**Feito com dedicação por [AsaGeki](https://github.com/AsaGeki)** 🎮✨
