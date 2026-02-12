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
- **Node.js 20+** - Runtime moderno e performático
- **TypeScript** - Type-safety em tempo de desenvolvimento
- **Express** - Framework minimalista e flexível
- **Tsyringe** - Injeção de dependência leve
- **Zod** - Validação de schemas com inferência de tipos
- **Pino** - Logging estruturado de alta performance
- **Vitest** - Testes rápidos e modernos

### Frontend
- **Angular 17** - Framework completo com Standalone Components
- **TypeScript** - Consistência de tipos com o backend
- **Tailwind CSS** - Estilização utilitária e responsiva
- **Zod** - Validações consistentes (backend ↔ frontend)
- **Lucide Angular** - Ícones modernos e tree-shakeable
- **RxJS** - Programação reativa para gerenciamento de estado

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

**Arquivos de exemplo incluídos:**
- [server.example.ts](backend/src/infra/http/server.example.ts) - Servidor configurado com Helmet e Rate Limit
- [.env.example](backend/.env.example) - Template de variáveis de ambiente
- [.eslintrc.json](backend/.eslintrc.json) - Configuração ESLint + Prettier
- [.prettierrc](backend/.prettierrc) - Regras de formatação

**Frontend:**

```bash
cd frontend
npm install

# Configurar variáveis de ambiente (opcional)
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm start
```

**Arquivos de exemplo incluídos:**
- [app.config.example.ts](frontend/src/app/app.config.example.ts) - Configuração HttpClient e providers
- [auth.interceptor.example.ts](frontend/src/app/core/interceptors/auth.interceptor.example.ts) - Interceptor JWT
- [user.service.example.ts](frontend/src/app/core/services/user.service.example.ts) - Service com validação Zod
- [.eslintrc.json](frontend/.eslintrc.json) - Configuração Angular ESLint
- [.prettierrc](frontend/.prettierrc) - Regras de formatação com Tailwind

**📘 Consulte o [GUIA_COMPLETO.md](GUIA_COMPLETO.md) para explicações detalhadas de cada configuração!**

### Scripts Disponíveis

**Backend:**
- `npm run dev` - Modo desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm start` - Inicia aplicação compilada
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