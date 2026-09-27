# CLAUDE.md

Carregado automaticamente no início de cada sessão neste repositório. É o ponto de entrada de contexto — não precisa ser descoberto por exploração.

Este repositório é um **schema base de backend**: o ponto de partida para APIs Node/TypeScript, não uma aplicação de produção. O módulo `users` (Prisma) e o módulo `logs` (Mongoose) existem como referência do padrão, não como funcionalidade de negócio.

## Documentos relacionados

| Documento                                                      | Cobre                                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [`docs/PADROES.md`](docs/PADROES.md)                           | O padrão em si: estrutura, nomenclatura, anatomia de controller e service, persistência, e o levantamento que o originou. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                 | Camadas, direção de dependência, SOLID aplicado, injeção de dependência, checklist de módulo novo, anti-padrões.          |
| [`docs/RESPONSE_CONVENTIONS.md`](docs/RESPONSE_CONVENTIONS.md) | Contrato de sucesso (`IResponseEx` + `sendResponse`) e de erro (`UniversalError` + `errorMiddleware`).                    |
| [`docs/DECISOES.md`](docs/DECISOES.md)                         | Por que cada decisão de arquitetura foi tomada, e o que ela custa. É o documento a ler antes de propor mudar o padrão.    |
| [`docs/DEV_SETUP.md`](docs/DEV_SETUP.md)                       | Como levantar o ambiente, variáveis, bancos, e as armadilhas de Windows já encontradas.                                   |

## Stack e comandos

Node 22+, TypeScript, Express 5, tsyringe, Zod, Winston. Persistência dupla: PostgreSQL via Prisma e MongoDB via Mongoose. Gerenciador de pacote: pnpm.

```bash
pnpm dev           # tsx watch, servidor de desenvolvimento
pnpm build         # tsup, build de produção (cjs)
pnpm start         # roda o build (dist/server.js)
pnpm typecheck     # tsc --noEmit (src e tests/)
pnpm lint          # eslint .
pnpm lint:fix      # eslint . --fix
pnpm format        # prettier --write .
pnpm format:check  # prettier --check .
pnpm test          # vitest: unitários e HTTP, sem banco
pnpm test:integration  # vitest: integração com Postgres e Mongo de teste
pnpm db:generate   # prisma generate
pnpm db:migrate    # prisma migrate dev
pnpm db:studio     # prisma studio
```

## Idioma

- **Nomes** (variáveis, funções, classes, campos, arquivos): nomenclatura mista com **preferência por português**. Inglês fica reservado a termos consolidados no domínio técnico — `users`, `create`, `findById`, `Repository`, `Service`. Domínio de negócio é português.
- **Comentários**: português. Comentário explica o código como ele é hoje: fluxo, contrato, ou o motivo de algo não óbvio. Nunca changelog, nunca ensaio de decisão de design, nunca roadmap.
- **Mensagens de erro voltadas ao usuário** (`message` de `UniversalError`, mensagens de validação Zod): português.

## Aprovação obrigatória antes de mexer em contrato

Antes de **criar** ou **editar** enum, `type`, `interface` ou schema — Zod, `prisma/schema.prisma` ou Mongoose —, **pare antes de escrever**: explique o que muda e por quê, e só continue depois da aprovação explícita. Vale até para ajuste pequeno num que já existe.

## Padrão de service

Um service equivale a uma ação. `execute` é o único método público; todo o resto é privado. O retorno é sempre tipado.

Método auxiliar privado só se justifica por **repetição** — o trecho aparece mais de uma vez dentro do `execute` — ou por **coesão**, quando o trecho é grande e distinto o bastante para ficar melhor separado. Fora desses dois casos, a lógica fica dentro do `execute`, que não é um delegador vazio.

Função pura, sem dependência injetada, não é service: é uma função exportada em `utils/`, sem classe e sem `execute`.

## Contrato de resposta

Service chamado por controller devolve `IResponseEx<T>`; o controller repassa por `sendResponse` sem `if` de formatação. Erro é **lançado** (`throw new NotFoundError(...)`), nunca retornado como `success: false` — o `errorMiddleware` trata centralmente.

Service interno que não atravessa a fronteira HTTP — `HashService`, uma etapa usada só por outro service — devolve o valor puro.

## Persistência dupla

O contrato comum (`IBaseRepository`) é agnóstico de banco: um módulo CRUD normal depende dele e é portável. Recurso exclusivo de um banco mora na interface de extensão — `IMongoRepository` (`bulkUpsert`, `insertMany`) ou `IPrismaRepository` (`transaction`) —, e depender dela amarra o módulo àquele banco de forma visível na assinatura.

A filtragem da listagem é declarativa: o repositório concreto declara `filterConfig`, e a base traduz para `where` do Prisma ou filtro do Mongo. Nenhum service escreve encadeamento de `if` sobre a query.

## Autorização

Permissão `grupo:acao`, somada dos perfis do usuário e resolvida pelo `verifyToken` em `req.user.abilities`. Rota confere com `authorize(EPermissao<Modulo>.X)`; regra que depende do dado fica no service. Módulo novo declara o enum de permissões e registra o grupo em `modules/permissoes/catalogoPermissoes.ts`. O perfil `Administrador` (`todasPermissoes`) só muda pelo seed.

O token vem do `Authorization` ou, na falta dele, do cookie cifrado. Chamada do front que altera estado manda `X-Requested-By: <CSRF_HEADER_VALUE>`; rota HMAC fica sob `/api/internal/`.

## Arquivos e APIs externas

Arquivo vai para `IFileStorage` (token `FileStorage`) e o banco guarda só a key; formato é conferido pelos bytes (`detectarFormato`), nunca pelo `mimetype`. `authorize` vem antes do `upload(...)` na rota. API externa segue a seção "Client de API externa" do `docs/PADROES.md`: um client por API em `infra/clients/`, atrás de interface, com `code` estável por falha.

E-mail sai por `IMailer` (token `Mailer`); e-mail novo é uma flag em `EFlagEmail`, tokens em `catalogoFlags.ts` e um resolver no `SendService`.

## Git e commits

- **Conventional Commits em português**: `tipo: descrição` (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`).
- Fluxo de git é decisão do usuário, sempre. Não commitar, não fazer push e não criar branch sem pedido explícito.
- Nunca se incluir como autor ou coautor em commit ou PR.

## Dependências novas

Antes de rodar `pnpm add` ou `pnpm add -D`, **pergunte primeiro** — mesmo para lib pequena ou aparentemente óbvia.

## Exceção de lint

Nunca adicione `eslint-disable`, `eslint-disable-next-line` ou `eslint-disable-line` por conta própria, nem com justificativa no comentário. Se o lint acusa, corrija o código; se a exceção parecer o único caminho, **pare e pergunte explicitamente antes** de escrever.

## Testes

Vitest, em dois projetos configurados em [`vitest.config.mts`](vitest.config.mts):

- **`pnpm test`** — `tests/**/*.test.ts`, sem banco: services com repositório mockado (`vi.fn`), utils e o `AppServer` real numa porta livre, chamado com `fetch`. Os bancos ficam vazios de propósito nesse projeto.
- **`pnpm test:integration`** — `tests/**/*.integration.test.ts`, contra `DATABASE_URL_TEST` e `MONGODB_URI_TEST`. A execução recusa URL ausente, igual à de desenvolvimento ou de banco cujo nome não termine em `_test`. Cada teste limpa as tabelas e coleções que usa.

O teste mora em `tests/`, no mesmo caminho que o arquivo testado tem dentro de `src/` (`src/modules/users/services/CreateService.ts` → `tests/modules/users/services/CreateService.test.ts`), e importa o código pelos aliases (`@modules/...`). Assim `src/` fica só com código de produção. Arquivos de apoio (setup, global setup, trava de ambiente) ficam na raiz de `tests/`. Código novo com regra de negócio ganha teste do service; o que depende de banco real (projeção, índice, concorrência) ganha teste de integração.

## Checklist pós-edição

Depois de alterar qualquer arquivo `.ts`:

```bash
pnpm typecheck
pnpm lint
pnpm format
```

Isso também roda sozinho via hook `PostToolUse` ([`.claude/settings.json`](.claude/settings.json) → [`.claude/hooks/post-edit-check.sh`](.claude/hooks/post-edit-check.sh)), disparado após qualquer `Edit`/`Write` em `.ts`. O hook bloqueia a edição quando typecheck ou lint falham.

## Armadilhas de ambiente (Windows)

- **`prisma generate` falha com `EPERM`** se `pnpm dev` estiver rodando — o `tsx watch` mantém o engine do Prisma aberto. Pare o dev server antes de rodar `pnpm db:migrate` ou `pnpm db:generate`.
- **`pnpm install` sobre `node_modules` criado por npm** falha com `EPERM` ao mover pacotes para `.ignored`. Apague `node_modules` e reinstale.
- **Build scripts do Prisma são ignorados por padrão**. A liberação está em [`pnpm-workspace.yaml`](pnpm-workspace.yaml) (`allowBuilds`) — o campo `pnpm` do `package.json` não é lido, e `onlyBuiltDependencies` só vale até o pnpm 11.
