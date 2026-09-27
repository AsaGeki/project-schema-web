# Arquitetura

| Metadado            | Valor                                                              |
| ------------------- | ------------------------------------------------------------------ |
| Prompt summary      | Documentar a arquitetura do schema base após a reescrita do `src/` |
| Creation date       | 2026-09-01                                                         |
| Change count        | 7                                                                  |
| Last update date    | 2026-09-27                                                         |
| Last prompt summary | Documentar a autorização por perfil                                |

Contrato e nomenclatura estão em [`PADROES.md`](PADROES.md); o porquê de cada escolha, e o que ela custa, está em [`DECISOES.md`](DECISOES.md). Este documento cobre camadas, direção de dependência e o que precisa existir para um módulo novo funcionar.

## Visão geral

```
src/
  configs/     configuração e clientes de banco
  shared/      infraestrutura transversal
  modules/     domínio, um diretório por recurso
  server.ts    bootstrap
```

`configs/` fica **fora** de `shared/`. Middlewares ficam em `shared/infra/https/middlewares/` — middleware é infraestrutura HTTP, não utilitário.

## Aliases

| Alias        | Aponta para     |
| ------------ | --------------- |
| `@configs/*` | `src/configs/*` |
| `@shared/*`  | `src/shared/*`  |
| `@modules/*` | `src/modules/*` |

Import relativo entre camadas não é usado. `import-x/order` agrupa e ordena, e é corrigível com `pnpm lint:fix`.

## Camadas e direção de dependência

```mermaid
flowchart LR
  R[Route] --> C[Controller]
  C --> S[Service]
  S --> I["IRepository (interface)"]
  I -.implementado por.-> P[Repositório concreto]
  P --> DB[(Prisma / Mongoose)]
```

A dependência aponta sempre para dentro, e para de fora para dentro nunca se pula camada:

- **Route** conhece o controller e os middlewares de validação. Não conhece service.
- **Controller** resolve o service no container e devolve por `sendResponse`. Não conhece repositório.
- **Service** depende da **interface** do repositório, injetada por token. Nunca da classe concreta.
- **Repositório concreto** conhece o banco. É a única camada que conhece.

Cruzar módulo é permitido **pela interface**, via token do container. Importar a classe concreta de repositório de outro módulo não é.

## SOLID no código

**SRP.** Um service por ação, não por entidade. `CreateService`, `FindAllService`, `UpdateService`, `DeleteService` são arquivos distintos.

**OCP.** O CRUD genérico vive em `BasePrismaRepository` e `BaseMongoRepository`. Caso específico entra como método no repositório concreto — a base não é alterada.

**LSP.** Qualquer repositório concreto substitui o contrato que declara. É por isso que `transaction` **não** está em `BasePrismaRepository`: mantê-lo ali exigiria um método que só lança, quebrando a substituição. Quem precisa de transação implementa `IPrismaRepository` no concreto.

**ISP.** O contrato comum (`IBaseRepository`) tem só o que os dois bancos honram. `insertMany`, `bulkUpsert`, `updateMany` e `deleteMany` ficam em `IMongoRepository`; `transaction` fica em `IPrismaRepository`.

**DIP.** O service recebe `IUsersRepository`, não `UsersRepository`. A ligação entre token e implementação é feita uma vez, no `container/index.ts` do módulo.

## Persistência dupla

O contrato comum é agnóstico:

```ts
export interface IBaseRepository<TModel, TCreate, TUpdate = Partial<TCreate>> {
  create(data: TCreate): Promise<TModel>;
  findById(id: string): Promise<TModel | null>;
  update(id: string, data: TUpdate): Promise<TModel | null>;
  delete(id: string): Promise<TModel | null>;
  count(where?: unknown): Promise<number>;
  list(query: IListQuery, scope?: object): Promise<IPaginated<TModel>>;
}
```

Um módulo CRUD que depende só dele é portável entre os dois bancos. Um módulo que depende de `IMongoRepository` ou `IPrismaRepository` está amarrado àquele banco — de propósito, e visível na assinatura.

Os dois módulos de referência mostram os dois lados:

| Módulo  | Banco    | Contrato           | Por quê                                                          |
| ------- | -------- | ------------------ | ---------------------------------------------------------------- |
| `users` | Postgres | `IBaseRepository`  | Entidade com forma fixa e relação; CRUD completo.                |
| `logs`  | Mongo    | `IMongoRepository` | `payload` de forma variável e ingestão em lote via `insertMany`. |

`DATABASE_URL` ou a URI do Mongo do ambiente (`MONGODB_URI` em produção, `MONGODB_URI_DEV` fora dela) vazias desligam a respectiva conexão — um projeto que use só um dos bancos não paga o custo do outro.

## Filtragem declarativa

O repositório concreto declara o que é filtrável; nenhum service escreve `if (query.x)`:

```ts
protected override readonly filterConfig: IFilterConfig = {
  equals: ['email'],
  search: { text: ['name', 'email'] },
  range: { createdAt: { gte: 'criadoDe', lte: 'criadoAte', as: 'date' } },
};
```

| Chave    | Efeito                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| `equals` | Igualdade exata. `{ field, as }` coage `boolean`/`number`; valor que não coage é ignorado.                          |
| `search` | `text` recebe busca por substring case-insensitive. `number`, quando o termo é numérico, substitui a busca textual. |
| `range`  | Mapeia um campo do model para as chaves de query do `gte`/`lte`, coagindo data ou número.                           |

`buildPrismaWhere` e `buildMongoWhere` consomem a **mesma** `filterConfig` e mudam só a gramática do operador: `contains`/`mode: 'insensitive'` contra `$regex`/`$options: 'i'`, `OR` contra `$or`, `gte`/`lte` contra `$gte`/`$lte`.

O segundo argumento de `list` é o `scope` — o filtro obrigatório que o cliente **não** pode sobrescrever pela query string (`{ userId }`, por exemplo). Ele é aplicado por cima do `where` montado.

## Injeção de dependência

```ts
// modules/users/container/index.ts
container.registerSingleton<IUsersRepository>('UsersRepository', UsersRepository);
```

Cada módulo tem seu `container/index.ts`, importado pelo container global em `shared/container/index.ts`, que por sua vez é importado uma única vez em `shared/infra/https/app.ts`. O token é uma string e é o nome da implementação sem sufixo de interface.

`reflect-metadata` é importado no topo de `app.ts`, antes de qualquer decorator ser avaliado.

## Autorização

Permissão é uma string `grupo:acao` (`users:read`). O usuário tem as permissões somadas dos perfis dele; o perfil `Administrador`, criado pelo seed, tem `todasPermissoes` e vale como `*`.

- O `verifyToken` valida o token, resolve as permissões pelo `sub` (porta `IResolvedorDePermissoes`, implementada no módulo `permissoes`, com uma consulta ao banco por requisição) e popula `req.user` com `id` e `abilities`. Usuário que não existe mais recebe 401. Ele é aplicado por `router.use()` no `Route` do módulo; rota pública fica **antes** dessa linha — é o caso de `POST /api/users`.
- `authorize('grupo:acao')` fica na rota, depois do `verifyToken` e antes de qualquer middleware que grave algo. Exige todas as permissões informadas; `*` passa em tudo.
- Permissão que depende do dado fica no service, que recebe `req.user`: "o próprio usuário, ou quem tem `users:update`".

Cada módulo declara as próprias permissões num enum `EPermissao<Modulo>.ts` na raiz do módulo, e o grupo entra em `modules/permissoes/catalogoPermissoes.ts`. O `pnpm db:seed` sincroniza o catálogo com o banco: cria o que falta e remove o que saiu do código, tirando a permissão dos perfis junto.

O último usuário com acesso total não pode ser removido nem perder o perfil — 409.

## Checklist de módulo novo

1. `dtos/<Nome>DTO.ts` — schema Zod, `IX` derivado dele, `IXCreate`/`IXUpdate` compondo `IAuditFields`.
2. `repositories/I<Nome>Repository.ts` — estende `IBaseRepository` (ou a extensão do banco).
3. `infra/prisma/repositories/` ou `infra/mongo/{models,repositories}/` — a implementação, com `filterConfig`. Coluna sensível de model Prisma entra no `omit` global do `prismaClient`.
4. `services/` — um arquivo por ação; subpasta por recurso quando o módulo tem mais de um.
5. `infra/https/controllers/<Nome>Controller.ts` — fino.
6. `infra/https/routes/<nome>Route.ts` — `new Controller()`, métodos registrados diretamente.
7. `container/index.ts` — registra o token.
8. Importar o container no `shared/container/index.ts` e a rota no `shared/infra/https/routes/router.ts`.
9. `tests/modules/<nome>/services/<Acao>Service.test.ts` — teste do service com o repositório mockado; `*.integration.test.ts` no caminho do repositório, dentro de `tests/`, quando o comportamento depende do banco real.
10. `EPermissao<Modulo>.ts` com as permissões do módulo, o grupo registrado em `catalogoPermissoes.ts`, e `authorize` nas rotas. Rodar `pnpm db:seed` para o banco conhecer as permissões novas.

## Anti-padrões

- Controller que conhece repositório, ou service que conhece `Request`/`Response`.
- Import da classe concreta de repositório de outro módulo — cruze pela interface, via token.
- `new` de service fora do container.
- Erro lançado fora do service (controller e repositório não lançam erro de negócio).
- Encadeamento de `if (query.x)` num `FindAllService` — isso é `filterConfig`.
- `refine`/`superRefine` cruzando campos no Zod — regra de negócio é do service.
- Método de controller sem `this: void` registrado na rota sem `.bind(controller)`.
- `as` para tipar `req.body`, `req.params` ou `res.locals` — isso é genérico de `Request`/`Response`.
- Service genérico que faz várias ações conforme um parâmetro.
