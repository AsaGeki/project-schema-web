# Universal Backend Base

Schema base para APIs Node.js + TypeScript. É o ponto de partida de projetos novos — arquitetura modular, injeção de dependência, validação, contrato de resposta e tratamento de erro já montados e verificados.

Suporta **duas persistências ao mesmo tempo**: PostgreSQL via Prisma e MongoDB via Mongoose, atrás de um contrato de repositório comum.

## Stack

Express 5 · TypeScript · tsyringe · Zod · Prisma · Mongoose · Winston · Helmet · JWT

## Começando

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

Detalhes de ambiente, variáveis e bancos em [`docs/DEV_SETUP.md`](docs/DEV_SETUP.md).

## Estrutura

```
src/
  configs/                 envConfig (Zod), corsConfig, clientes de banco
  shared/
    errors/                UniversalError + tradutores de Prisma e Mongo
    infra/
      database/            contrato comum + base Prisma + base Mongoose
      https/               AppServer, sendResponse, rateLimiter, middlewares, Router
    services/              LoggerService, HashService
    types/                 response, pagination, filter, audit
    utils/query/           tradução declarativa de filtro para cada banco
  modules/
    users/                 módulo de referência sobre Prisma
    logs/                  módulo de referência sobre Mongoose
  server.ts
```

## Anatomia de um módulo

```
modules/<nome>/
  dtos/<Nome>DTO.ts                          schema Zod + contratos derivados
  repositories/I<Nome>Repository.ts           interface
  infra/prisma|mongo/                         implementação
  infra/https/controllers/<Nome>Controller.ts
  infra/https/routes/<Nome>Route.ts
  services/                                   um arquivo por ação
  container/index.ts                          registro no container
```

## O que já vem pronto

| Recurso                     | Onde                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| Envelope de resposta único  | `IResponseEx` + `sendResponse`                                      |
| Erro tipado por status HTTP | `UniversalError` e 11 subclasses, um middleware central             |
| Validação de entrada        | Zod no `dtos/`, aplicado por middleware; o schema é a fonte do tipo |
| Filtro e paginação          | `filterConfig` declarativa, traduzida para Prisma ou Mongo          |
| Log estruturado             | Winston com rotação diária e child logger por contexto              |
| Segurança                   | Helmet, CORS por ambiente, rate limit, `Content-Type` obrigatório   |
| Autenticação                | JWT com access e refresh, `req.user` populado por middleware        |
| Auditoria                   | `createdBy`/`updatedBy` no contrato de escrita dos repositórios     |

## Comandos

```bash
pnpm dev           # servidor de desenvolvimento
pnpm build         # build de produção
pnpm start         # roda o build
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint .
pnpm format        # prettier --write .
pnpm db:migrate    # prisma migrate dev
pnpm db:studio     # prisma studio
```

## Documentação

| Documento                                                      | Cobre                                                             |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`docs/PADROES.md`](docs/PADROES.md)                           | O padrão de código: estrutura, nomenclatura, controller, service. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                 | Camadas, SOLID, persistência dupla, checklist de módulo novo.     |
| [`docs/RESPONSE_CONVENTIONS.md`](docs/RESPONSE_CONVENTIONS.md) | Contrato de sucesso e de erro na fronteira HTTP.                  |
| [`docs/DECISOES.md`](docs/DECISOES.md)                         | Por que cada decisão foi tomada, e o que ela custa.               |
| [`docs/DEV_SETUP.md`](docs/DEV_SETUP.md)                       | Ambiente, variáveis, bancos, logs, armadilhas de Windows.         |
| [`CLAUDE.md`](CLAUDE.md)                                       | Contexto para agentes de código trabalhando neste repositório.    |

## Licença

MIT.
