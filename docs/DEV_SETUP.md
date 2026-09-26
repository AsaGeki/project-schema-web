# Setup de desenvolvimento

| Metadado            | Valor                                              |
| ------------------- | -------------------------------------------------- |
| Prompt summary      | Documentar como levantar o ambiente do schema base |
| Creation date       | 2026-09-01                                         |
| Change count        | 1                                                  |
| Last update date    | 2026-09-26                                         |
| Last prompt summary | Alinhar as variáveis ao padrão dos projetos        |

## Requisitos

Node 22+, pnpm 12+ (fixado em `packageManager`, resolvido pelo corepack). PostgreSQL e MongoDB são opcionais e independentes: cada um é ligado pela sua variável de conexão.

## Primeira execução

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

O `pnpm db:generate` é obrigatório mesmo sem banco no ar — o client do Prisma é gerado e não versionado, e sem ele o `typecheck` não encontra os tipos de `@prisma/client`.

## Variáveis de ambiente

Validadas por Zod em [`src/configs/envConfig.ts`](../src/configs/envConfig.ts), que é o único arquivo do projeto que lê `process.env`. Configuração inválida derruba o processo no boot, com o erro impresso — não existe partida com ambiente incompleto.

O consumo é agrupado por domínio: `env.server.PORT`, `env.https.CERT`, `env.database.MONGODB_URI`, `env.auth.JWT_SECRET`. `isProduction` e o enum `ENodeEnv` também são exportados de lá.

Os nomes seguem o padrão dos backends da empresa (`avb_one_back`, `fbi_back`, `sso_back`), e o [`.env.example`](../.env.example) explica cada variável no próprio arquivo.

| Variável                      | Default         | Observação                                                                                       |
| ----------------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                    | `development`   | `development`, `production` ou `test`. Controla nível de log, CORS, rate limit e a URI do Mongo. |
| `PORT`                        | `3000`          |                                                                                                  |
| `SELF_HOST`                   | `localhost`     | Host deste backend, sem protocolo nem porta. Hoje só compõe a mensagem de boot.                  |
| `CORS`                        | `*`             | Lista separada por vírgula, ou `*`.                                                              |
| `JSON_LIMIT`                  | `2mb`           | Corpo maior vira 413.                                                                            |
| `TRUST_PROXY`                 | `0`             | Número de proxies reversos na frente da API. `0` ignora o `x-forwarded-for`.                     |
| `ENABLE_ROUTER_MONITORING`    | `false`         | Liga o log por requisição.                                                                       |
| `HTTPS_KEY` / `HTTPS_CERT`    | vazio           | Preencher os dois sobe o servidor em TLS. `HTTPS_CA` é opcional.                                 |
| `DATABASE_URL`                | vazio           | Postgres via Prisma, em qualquer ambiente. Vazio desliga.                                        |
| `MONGODB_URI`                 | vazio           | Mongo em produção.                                                                               |
| `MONGODB_URI_DEV`             | vazio           | Mongo fora de produção. Vazia a do ambiente atual, a conexão é ignorada, com log em `debug`.     |
| `JWT_SECRET`                  | **sem default** | Obrigatória.                                                                                     |
| `JWT_EXPIRES_IN`              | `1d`            |                                                                                                  |
| `JWT_REFRESH_SECRET`          | **sem default** | Obrigatória, e deve ser diferente de `JWT_SECRET`.                                               |
| `JWT_REFRESH_EXPIRES_IN`      | `12h`           |                                                                                                  |
| `API_KEYS_HMAC`               | vazio           | Chaves de integração server-to-server, `id:segredo,id2:segredo2`.                                |
| `API_KEYS_HMAC_TOLERANCIA_MS` | `300000`        | Janela do timestamp assinado, em milissegundos.                                                  |

Duas variáveis ficam fora do `envConfig`: `MEMORY_LIMIT_MB`, lida pelo `HealthService`, e `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, lidas pelo `prisma/seed.ts`.

## Bancos

**Postgres.** Preencha `DATABASE_URL` e rode `pnpm db:migrate` para criar o schema a partir de [`prisma/schema.prisma`](../prisma/schema.prisma). `pnpm db:studio` abre o inspetor.

**Mongo.** Preencha `MONGODB_URI_DEV` (ou `MONGODB_URI`, em produção). Não há migration: o model do Mongoose cria a coleção e os índices no primeiro uso.

Nenhum dos dois é exigido para o servidor subir. Com `DATABASE_URL` vazia o processo inicia, mas qualquer rota que toque o Postgres falha no runtime.

## Verificação

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Os quatro rodam no CI a cada pull request ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)). Os três primeiros também rodam sozinhos após qualquer edição de `.ts`, pelo hook `PostToolUse` — que **bloqueia** a edição quando typecheck ou lint falham.

## Logs

Winston com níveis próprios (`error`, `notice`, `warn`, `info`, `debug`). O nível ativo vem do `NODE_ENV`: `production` → `notice`, qualquer outro → `debug`.

O console recebe tudo do nível ativo. Em arquivo, com rotação diária, ficam só `logs/errors/` e `logs/notices/` — 10 MB por arquivo, 10 dias de retenção, compactado.

O rótulo colorido do console mostra o `prefix` do child logger quando existe (`[USERS]`), e o nível quando não (`[INFO]`).

## CORS

A allowlist vem de `CORS`, em lista separada por vírgula, e `*` libera qualquer origem. Requisição sem cabeçalho `Origin` — cliente HTTP, chamada server-to-server — passa sempre.

Origem fora da lista recebe **403** no formato de erro padrão da API, e não um 500 genérico: [`src/configs/corsConfig.ts`](../src/configs/corsConfig.ts) rejeita com `ForbiddenError`, não com `Error` cru.

`credentials` só é habilitado em produção.

## MCP

[`.mcp.json`](../.mcp.json) declara `prisma` e `mongodb`. O servidor do Mongo lê `MDB_MCP_CONNECTION_STRING` a partir de `${MONGODB_URI_DEV}` — sem essa variável no ambiente do shell ele não conecta.

## Armadilhas de Windows

- **`prisma generate` com `EPERM`**: o `tsx watch` do `pnpm dev` mantém o engine do Prisma aberto. Pare o dev server antes de `pnpm db:migrate` ou `pnpm db:generate`.
- **`pnpm install` sobre `node_modules` de npm**: falha com `EPERM` ao mover pacotes para `.ignored`. Apague `node_modules` e reinstale.
- **Build scripts ignorados**: o pnpm exige liberação explícita. Ela está em [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) (`allowBuilds`) — o campo `pnpm` do `package.json` não é lido. `onlyBuiltDependencies` é a chave equivalente até o pnpm 11, ignorada a partir do 12.
