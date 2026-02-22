# 🚀 Universal Base Project

> **Uma base sólida e escalável para aplicações fullstack modernas** > Criado por Arthur Gabriel Oliveira de Macedo (AsaGeki)

---

## 📖 Sobre

Base para **fullstack web apps** seguindo **Clean Architecture**, **DDD** e **arquitetura modular**. Node.js + TypeScript no backend (Express) e Angular 17 no frontend.

Pronta para copiar e colar em novos projetos com padrões confiáveis, segurança nativa e estrutura altamente escalável.

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

## ✨ Recursos Implementados

### 🏗️ Arquitetura e Padrões

* ✅ **Clean Architecture & DDD** - Separação clara de camadas e módulos guiados por domínio.
* ✅ **Dependency Injection** - IoC configurado com `tsyringe`.
* ✅ **Padrão CRUD Completo** - Interfaces agnósticas (Entities, Repositories, Services, Controllers).
* ✅ **Path Aliases** - Imports limpos (`@shared`, `@config`, `@modules`).
* ✅ **Exemplo Funcional** - Módulo `users` pronto para uso com in-memory repository.

### 🔒 Segurança

* ✅ **Helmet** - Headers HTTP seguros (XSS, Clickjacking, MIME sniffing).
* ✅ **CORS** - Configurável por ambiente.
* ✅ **Rate Limit** - Proteção contra DDoS (ex: 100 req/15min).
* ✅ **Bcryptjs** - Hash de senhas seguro.

### ⚠️ Tratamento de Erros e Logging

* ✅ **Global Error Handler** - Middleware para tratamento automático de exceções.
* ✅ **AppError Base** - Classe extensível cobrindo status HTTP (400, 401, 403, 404, 409, 422, 429, 500).
* ✅ **Pino Logger** - Logging estruturado de alta performance (colorido em dev, JSON em prod).
* ✅ **HTTP Logger Middleware** - Registro detalhado de requisições (método, URL, status, duração, IP).

### 🧪 Qualidade de Código e Testes

* ✅ **Strict TypeScript** - Type-safety máximo no backend e frontend.
* ✅ **Zod** - Validação rigorosa de schemas (requests/responses e DTOs).
* ✅ **Vitest** - Testes rápidos com relatórios de coverage e UI mode.
* ✅ **ESLint & Prettier** - Linting e formatação automática com convenção kebab-case.

### 📦 DevOps Ready

* ✅ **Environment Variables** - Configuração robusta via `.env`.
* ✅ **Build Scripts** - Compilação otimizada para produção.
* ✅ **Health Check** - Endpoint `/health` nativo para monitoramento.

---

## 💻 Scripts Disponíveis

### Backend

* `npm run dev` - Inicia o servidor de desenvolvimento.
* `npm run build` - Gera o build de produção.
* `npm test` - Executa os testes (Vitest).
* `npm run lint` - Verifica e corrige o código.
* `npm run format` - Formata o código (Prettier).
* `npm run format:check` - Verifica formatação sem alterar.

### Frontend

* `npm start` - Servidor de desenvolvimento Angular.
* `npm run build` - Build otimizado para produção.
* `npm test` - Executa testes.
* `npm run lint` - Verifica e corrige o código.

---

## 📚 Documentação

Toda a documentação técnica, de arquitetura e exemplos de uso estão mapeados na pasta **[docs/](https://www.google.com/search?q=docs/)**:

| Documento | Foco |
| --- | --- |
| **[📖 Índice Principal](https://www.google.com/search?q=docs/INDEX.md)** | **Ponto de partida!** Visão geral de tudo. |
| **[🏗️ Estrutura do Projeto](https://www.google.com/search?q=docs/estrutura-projeto.md)** | Entender a arquitetura de pastas e camadas. |
| **[🔄 Padrão CRUD](https://www.google.com/search?q=docs/crud.md)** | Guia para criar novos módulos. |
| **[⚠️ Error Handling](https://www.google.com/search?q=docs/error-handling.md)** | Como lançar e tratar erros corretamente. |
| **[📊 Logger](https://www.google.com/search?q=docs/logger.md)** | Como utilizar o Pino Logger. |
| **[🔗 Middlewares](https://www.google.com/search?q=docs/middlewares.md)** | Criação e uso de HTTP middlewares. |
| **[💉 Injeção de Dependência](https://www.google.com/search?q=docs/dependency-injection.md)** | Como usar o Tsyringe Container. |

---

## 🎯 Roadmap

* [ ] Autenticação JWT completa
* [ ] Integração com banco de dados (Prisma/TypeORM)
* [ ] Testes E2E (Playwright)
* [ ] Documentação da API (Swagger/OpenAPI)
* [ ] Docker e Docker Compose
* [ ] CI/CD pipelines (GitHub Actions)
* [ ] Upload de arquivos com S3
* [ ] Websockets (Socket.io)
* [ ] Filas e workers (BullMQ)

---

## 📝 Licença

Este projeto está sob a licença MIT.

---

**Feito com dedicação por [AsaGeki**](https://github.com/AsaGeki) 🎮✨
