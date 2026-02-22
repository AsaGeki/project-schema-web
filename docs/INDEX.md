# 📚 Documentação - Índice

Bem-vindo à documentação do Universal Base Project! Aqui você encontra guias detalhados sobre cada aspecto do projeto.

## 🚀 Comece Aqui

1. **[Estrutura do Projeto](estrutura-projeto.md)** - Visão geral da organização
2. **[Padrão CRUD](crud.md)** - Como criar novos módulos
3. **[Tratamento de Erros](error-handling.md)** - Classes AppError e handler global

## 📖 Guias Específicos

### 🔙 Backend

- **[CRUD](crud.md)** - Padrão de Create, Read, Update, Delete
  - Estrutura de módulos
  - Entities, Repositories, DTOs, Services
  - Controllers e Rotas
  - Exemplo prático com Users

- **[Logger](logger.md)** - Pino Logger estruturado
  - Configuração por ambiente
  - Níveis de log
  - HTTP request logging
  - Boas práticas

- **[Middlewares](middlewares.md)** - HTTP middlewares Express
  - httpLogger (logging de requisições)
  - errorHandler (tratamento global de erros)
  - Middlewares de segurança (Helmet, CORS, Rate Limit)

- **[Injeção de Dependência](dependency-injection.md)** - tsyringe Container
  - Registrar dependências
  - @injectable decorator
  - @inject decorator
  - Tipos de registro (singleton, transient, factory)

- **[Tratamento de Erros](error-handling.md)** - Erros estruturados
  - Classe base AppError
  - Erros específicos por status HTTP
  - Global error handler
  - Padrões de uso nos services

### 🎨 Frontend

⚠️ Documentação do Angular (frontend) será adicionada em breve.

## 🔗 Padrões Reutilizáveis

A pasta [universal/](../universal/) contém padrões que podem ser usados em qualquer projeto:

- **[PADRAO-CRUD.md](../universal/PADRAO-CRUD.md)** - Padrão CRUD detalhado
- **[PADRAO-ERROS.md](../universal/PADRAO-ERROS.md)** - Padrão de erros
- **[PADRAO-MIDDLEWARES.md](../universal/PADRAO-MIDDLEWARES.md)** - Padrão de middlewares

## 💡 Exemplos

### Módulo Users

Exemplo completo de um módulo CRUD implementado:

- **Localização:** [backend/src/modules/users/](../backend/src/modules/users/)
- **Documentação:** [backend/src/modules/users/README.md](../backend/src/modules/users/README.md)
- **Guia:** [IMPLEMENTACAO-MODULO-USERS.md](../IMPLEMENTACAO-MODULO-USERS.md)

**Contém:**

- Entity (User)
- Repository interface (IUserRepository)
- DTOs (Create, Update, Response)
- 5 Services (FindAll, FindOne, Create, Update, Delete)
- In-memory repository (implementação fake)
- Controller (como classe)
- Routes (Express)

## 📋 Quick Links

| Documento                                                            | Propósito                  |
| -------------------------------------------------------------------- | -------------------------- |
| [estrutura-projeto.md](estrutura-projeto.md)                         | Visão geral da arquitetura |
| [crud.md](crud.md)                                                   | Como criar módulos CRUD    |
| [error-handling.md](error-handling.md)                               | Tratamento de erros        |
| [logger.md](logger.md)                                               | Como usar logging          |
| [middlewares.md](middlewares.md)                                     | HTTP middlewares           |
| [dependency-injection.md](dependency-injection.md)                   | Injeção de dependência     |
| [../universal/](../universal/)                                       | Padrões reutilizáveis      |
| [../IMPLEMENTACAO-MODULO-USERS.md](../IMPLEMENTACAO-MODULO-USERS.md) | Exemplo do módulo users    |

## 🎯 Por Tarefa

### Quero criar um novo módulo

→ [Padrão CRUD](crud.md) + [Exemplo Users](../IMPLEMENTACAO-MODULO-USERS.md)

### Quero adicionar logging

→ [Logger](logger.md)

### Quero entender o tratamento de erros

→ [Tratamento de Erros](error-handling.md)

### Quero usar dependência injection

→ [Injeção de Dependência](dependency-injection.md)

### Quero criar um middleware customizado

→ [Middlewares](middlewares.md)

### Quero entender a arquitetura geral

→ [Estrutura do Projeto](estrutura-projeto.md)

## 🔍 Conceitos

### Clean Architecture

Separação em camadas independentes:

- **Entities:** Modelos puros
- **Use Cases/Services:** Lógica de negócio
- **Interfaces/Repositories:** Contratos com dados
- **HTTP/Controllers:** HTTP layer

### Domain-Driven Design

Organização por domínios/módulos:

- `modules/users` - Domínio de usuários
- `modules/products` - Domínio de produtos
- `modules/orders` - Domínio de pedidos

### Dependency Injection

Inversão de controle com tsyringe:

- Services não instanciam dependências
- Container resolve automaticamente
- Fácil trocar implementações (DB, cache, etc)

### Padrão Repository

Interface agnóstica a banco de dados:

- Service trabalha com interface (IUserRepository)
- Implementação pode ser TypeORM, Prisma, in-memory, etc
- Fácil testar com fake repository

## 🚀 Começar

1. Leia [Estrutura do Projeto](estrutura-projeto.md)
2. Estude o exemplo em [backend/src/modules/users/](../backend/src/modules/users/)
3. Use [Padrão CRUD](crud.md) como referência para criar novos módulos
4. Consulte documentos específicos conforme necessário

## 📞 Suporte

Se tiver dúvidas sobre:

- **CRUD:** Ver [crud.md](crud.md)
- **Erros:** Ver [error-handling.md](error-handling.md)
- **Logger:** Ver [logger.md](logger.md)
- **Middlewares:** Ver [middlewares.md](middlewares.md)
- **DI:** Ver [dependency-injection.md](dependency-injection.md)
- **Estrutura:** Ver [estrutura-projeto.md](estrutura-projeto.md)

---

**Última atualização:** Fevereiro 2026
