# 🚀 Universal Base Project

> **Uma base sólida e escalável para aplicações fullstack modernas**  
> Criado por Arthur Gabriel Oliveira de Macedo (AsaGeki)

---

## 📖 Sobre o Projeto

Fiz esse repositório com o intuito de me ajudar a manter um único ritmo de aprendizado e maestria com aplicações Web. Ele é uma estrutura inicialmente pensada para seguir aspectos de **Clean Architecture**, **DDD** e arquitetura **modular**.

Ele poderá me ajudar a facilitar a forma como trabalho e qualquer outra pessoa que se interessa por trabalhos web fullstack ou monostack.

---

## 🏗️ Arquitetura

### Princípios Fundamentais

#### 🎯 A Regra da Dependência

As dependências sempre devem apontar **para dentro**. O service no backend não precisa e nem deve saber que o Controller (HTTP) existe — ele deve ser desacoplado do resto da aplicação.

**Benefício:** Se hoje você usa MongoDB e amanhã Postgres, não precisa refazer a lógica do service.

#### 📋 Contratos (Interfaces)

Antes de "chapar" queries no banco, **crie interfaces** para isso. Isso permite que o service sempre pense que está enviando e interagindo com o banco real, quando na verdade pode ser um fake, facilitando testes e manutenção.

#### ✅ Validações

Tudo que entra por requests ou inputs **deve ser validado com Zod**, seja um middleware no backend ou `onSubmit` no front. Isso garante type-safety em runtime e contratos claros.

---

## 📂 Estrutura de Pastas

### Backend (Node.js + TypeScript)

```
src/
├── @types/               # Definições de tipos globais
├── config/               # Configurações de bibliotecas externas
├── shared/               # Código compartilhado entre todos os módulos
│   ├── container/        # Injeção de dependência
│   ├── errors/           # Classes de erro customizadas
│   └── infra/            # Implementações globais (HTTP, Database)
└── modules/              # Separado por Domínio (onde a mágica acontece)
    └── [nome_do_modulo]/ # Ex: users, products, orders
        ├── dtos/         # Contratos de entrada/saída de dados
        ├── entities/     # Modelos de negócio (Classes puras)
        ├── repositories/ # Interfaces (Contratos com persistência)
        ├── services/     # Use Cases (Toda a lógica de negócio)
        └── infra/        # Implementações concretas do módulo
            ├── database/ # Repositórios reais (Prisma, TypeORM, etc)
            └── http/     # Controllers e Rotas
```

**Por que essa estrutura?**

- **Testabilidade:** Cada camada pode ser testada isoladamente
- **Manutenibilidade:** Mudanças na infraestrutura não afetam a lógica de negócio
- **Escalabilidade:** Novos módulos são independentes e plugáveis

---

### Frontend (Angular + TypeScript)

```
src/app/
├── core/                 # Singleton (Carregado uma única vez)
│   ├── services/         # Autenticação, Interceptors, Guards
│   └── models/           # Interfaces e tipos globais
├── shared/               # Componentes reutilizáveis ("Lego" do projeto)
│   ├── components/       # Botões, Inputs, Modais, Cards
│   ├── directives/       # Manipulação de DOM customizada
│   └── pipes/            # Transformação de dados (formatação)
├── features/             # Módulos de funcionalidade/página
│   └── [nome_feature]/   # Ex: dashboard, perfil, configuracoes
│       ├── components/   # Componentes específicos desta feature
│       ├── services/     # Lógica e chamadas de API específicas
│       ├── pages/        # Smart Components (gerenciam estado)
│       └── [feature].routes.ts # Rotas standalone (Angular 17+)
└── data/                 # Camada de dados pura
    └── schemas/          # Validações Zod (contratos com a API)
```

**Por que essa estrutura?**

- **Lazy Loading:** Features carregadas sob demanda
- **Reusabilidade:** Shared components usados em todo o app
- **Separação de responsabilidades:** Presentational vs. Container components

---

## 🛠️ Stack Tecnológica

### Backend

- **[Node.js 20+](https://nodejs.org/)** - Runtime moderno e performático
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safety em tempo de desenvolvimento
- **[Express](https://expressjs.com/)** - Framework minimalista e flexível
- **[Helmet](https://helmetjs.github.io/)** - Segurança HTTP (XSS, Clickjacking, etc)
- **[CORS](https://www.npmjs.com/package/cors)** - Controle de acesso entre origens
- **[Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)** - Proteção contra DDoS e abuso
- **[Tsyringe](https://github.com/microsoft/tsyringe)** - Injeção de dependência leve
- **[Zod](https://zod.dev/)** - Validação de schemas com inferência de tipos
- **[Pino](https://getpino.io/)** - Logging estruturado de alta performance
- **[Pino-Pretty](https://github.com/pinojs/pino-pretty)** - Logs coloridos em desenvolvimento
- **[Bcrypt.js](https://www.npmjs.com/package/bcryptjs)** - Hash de senhas
- **[JWT](https://jwt.io/)** - Autenticação stateless
- **[Vitest](https://vitest.dev/)** - Testes rápidos e modernos

### Frontend

- **[Angular 17](https://angular.dev/)** - Framework completo com Standalone Components
- **[TypeScript](https://www.typescriptlang.org/)** - Consistência de tipos com o backend
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilização utilitária e responsiva
- **[Zod](https://zod.dev/)** - Validações consistentes (backend ↔ frontend)
- **[Lucide Angular](https://lucide.dev/guide/packages/lucide-angular)** - Ícones modernos e tree-shakeable
- **[RxJS](https://rxjs.dev/)** - Programação reativa para gerenciamento de estado
- **[Vitest](https://vitest.dev/)** - Testes unitários rápidos

---

## 🚦 Como Usar

### Pré-requisitos

- Node.js >= 20.0.0
- npm ou pnpm

### Instalação e Configuração

#### Setup Automático (Recomendado) ⚡

```powershell
# Windows (PowerShell)
.\setup.ps1

# Linux/Mac
chmod +x setup.sh
./setup.sh
```

O script automático faz:

- ✅ Instala dependências do backend e frontend
- ✅ Cria arquivos `.env` automaticamente
- ✅ Valida instalação

#### Setup Manual

**Backend:**

```bash
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar em modo desenvolvimento
npm run dev
```

**Arquivos base criados:**

- [server.ts](backend/src/infra/http/server.ts) - Servidor Express com Helmet, CORS e Rate Limit
- [logger.ts](backend/src/config/logger.ts) - Configuração do Pino Logger
- [httpLogger.ts](backend/src/infra/http/middlewares/httpLogger.ts) - Middleware de logging HTTP
- [container/index.ts](backend/src/shared/container/index.ts) - Container de injeção de dependência
- [.env.example](backend/.env.example) - Template de variáveis de ambiente
- [.eslintrc.json](backend/.eslintrc.json) - Configuração ESLint + Prettier
- [.prettierrc](backend/.prettierrc) - Regras de formatação
- [tsconfig.json](backend/tsconfig.json) - Configuração TypeScript com path aliases

**Frontend:**

```bash
cd frontend
npm install

# Configurar variáveis de ambiente (opcional)
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm start
```

**Arquivos base criados:**

- [main.ts](frontend/src/main.ts) - Bootstrap da aplicação Angular 17
- [app.component.ts](frontend/src/app/app.component.ts) - Componente raiz standalone
- [app.config.ts](frontend/src/app/app.config.ts) - Configuração de providers
- [app.routes.ts](frontend/src/app/app.routes.ts) - Sistema de rotas
- [environments/](frontend/src/environments/) - Configurações por ambiente
- [.eslintrc.json](frontend/.eslintrc.json) - Configuração Angular ESLint
- [.prettierrc](frontend/.prettierrc) - Regras de formatação com Tailwind
- [tsconfig.json](frontend/tsconfig.json) - Configuração TypeScript com path aliases
- [angular.json](frontend/angular.json) - Configuração do build Angular
- [tailwind.config.js](frontend/tailwind.config.js) - Configuração do Tailwind CSS

**📘 Consulte os guias para mais informações:** (tsx watch)

- `npm run build` - Compila TypeScript para produção
- `npm start` - Inicia aplicação compilada
- `npm run typecheck` - Valida tipos TypeScript sem build
- `npm test` - Executa testes com Vitest
- `npm run test:watch` - Testes em modo watch
- `npm run test:coverage` - Relatório de cobertura de testes
- `npm run test:ui` - Interface visual do Vitest
- `npm run lint` - Verifica e corrige código (ESLint)
- `npm run format` - Formata código (Prettier)
- `npm run format:check` - Verifica formatação sem alterar

**Frontend:**

- `npm start` - Servidor de desenvolvimento (http://localhost:4200)
- `npm run build` - Build de desenvolvimento
- `npm run build:prod` - Build otimizado para produção
- `npm run watch` - Build incremental com watch
- `npm run typecheck` - Valida tipos TypeScript
- `npm test` - Executa testes com Vitest
- `npm run test:coverage` - Relatório de cobertura
- `npm run test:ui` - Interface visual do Vitest
- `npm run lint` - Valida código e templates (Angular ESLint)
- `✨ Recursos Implementados

### 🔒 Segurança

- ✅ **Helmet** - Headers HTTP seguros (XSS, Clickjacking, MIME sniffing)
- ✅ \*_CORS_ (Sugestões)
- [ ] Exemplos de módulos completos (users, auth)
- [ ] Testes E2E (Playwright)
- [ ] Documentação da API (Swagger/OpenAPI)
- [ ] Docker e Docker Compose
- [ ] CI/CD pipelines (GitHub Actions)
- [ ] Integração com banco de dados (Prisma/TypeORM)
- [ ] Upload de arquivos
- [ ] Websockets (Socket.io)
- [ ] Filas e workers (BullMQ)

---

## 📚 Documentação Adicional

- **[backend/src/config/LOGGER_GUIDE.md](backend/src/config/LOGGER_GUIDE.md)** - Guia completo de uso do Pino Logger alta performance
- ✅ **Logs coloridos** em desenvolvimento (pino-pretty)
- ✅ **Logs JSON** em produção (integração com agregadores)
- ✅ **HTTP Logger** - Middleware para logar todas as requisições
- ✅ **Níveis configuráveis** via variável de ambiente

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

## 🎯 Próximos Passos

Ao mesmo tempo que irei utilizar desta base, irei atualizá-la, melhorá-la e sempre com o mesmo intuito de **manter universal para qualquer aplicação** — pronta para copiar e colar num projeto totalmente diferente, com tecnologias confiáveis e robustas.

### Roadmap

- [ ] Adicionar exemplos de uso completos
- [ ] Implementar testes E2E
- [ ] Documentação da API (Swagger/OpenAPI)
- [ ] Docker e Docker Compose
- [ ] CI/CD pipelines
- [ ] Integração com banco de dados (Prisma)

---

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues ou enviar pull requests. Toda contribuição é bem-vinda!

---

## 📝 Licença

Este projeto está sob a licença MIT.

---

**Feito com dedicação por [AsaGeki](https://github.com/AsaGeki)** 🎮✨
