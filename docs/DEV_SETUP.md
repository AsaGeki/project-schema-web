# Setup de desenvolvimento

| Metadado            | Valor                                              |
| ------------------- | -------------------------------------------------- |
| Prompt summary      | Documentar como levantar o ambiente do schema base |
| Creation date       | 2026-09-01                                         |
| Change count        | 0                                                  |
| Last update date    | 2026-09-01                                         |
| Last prompt summary | Documentar como levantar o ambiente do schema base |

## Requisitos

Node 20+, pnpm 9+. PostgreSQL e MongoDB são opcionais e independentes: cada um é ligado pela sua variável de conexão.

## Primeira execução

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

O `pnpm db:generate` é obrigatório mesmo sem banco no ar — o client do Prisma é gerado e não versionado, e sem ele o `typecheck` não encontra os tipos de `@prisma/client`.

## Variáveis de ambiente

Validadas por Zod em [`src/configs/envConfig.ts`](../src/configs/envConfig.ts). Configuração inválida derruba o processo no boot, com o erro impresso — não existe partida com ambiente incompleto.

| Variável                   | Default         | Observação                                                          |
| -------------------------- | --------------- | ------------------------------------------------------------------- |
| `NODE_ENV`                 | `dev`           | `dev`, `debug` ou `prod`. Controla nível de log, CORS e rate limit. |
| `PORT`                     | `3000`          |                                                                     |
| `URL`                      | `localhost`     | Só compõe a mensagem de boot.                                       |
| `CORS`                     | `*`             | Lista separada por vírgula, ou `*`.                                 |
| `JSON_LIMIT`               | `2mb`           | Corpo maior vira 413.                                               |
| `ENABLE_ROUTER_MONITORING` | `false`         | Liga o log por requisição.                                          |
| `HTTPS_KEY` / `HTTPS_CERT` | vazio           | Preencher os dois sobe o servidor em TLS. `HTTPS_CA` é opcional.    |
| `DATABASE_URL`             | vazio           | Postgres via Prisma. Vazio desliga.                                 |
| `MONGO_URL`                | vazio           | Mongo via Mongoose. Vazio desliga a conexão, com log em `debug`.    |
| `JWT_SECRET`               | **sem default** | Obrigatória.                                                        |
| `JWT_EXPIRES_IN`           | `1d`            |                                                                     |
| `JWT_REFRESH_SECRET`       | **sem default** | Obrigatória, e deve ser diferente de `JWT_SECRET`.                  |
| `JWT_REFRESH_EXPIRES_IN`   | `12h`           |                                                                     |

## Bancos

**Postgres.** Preencha `DATABASE_URL` e rode `pnpm db:migrate` para criar o schema a partir de [`prisma/schema.prisma`](../prisma/schema.prisma). `pnpm db:studio` abre o inspetor.

**Mongo.** Preencha `MONGO_URL`. Não há migration: o model do Mongoose cria a coleção e os índices no primeiro uso.

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

Winston com níveis próprios (`error`, `notice`, `warn`, `info`, `debug`). O nível ativo vem do `NODE_ENV`: `dev` → `info`, `debug` → `debug`, qualquer outro → `notice`.

O console recebe tudo do nível ativo. Em arquivo, com rotação diária, ficam só `logs/errors/` e `logs/notices/` — 10 MB por arquivo, 10 dias de retenção, compactado.

O rótulo colorido do console mostra o `prefix` do child logger quando existe (`[USERS]`), e o nível quando não (`[INFO]`).

## MCP

[`.mcp.json`](../.mcp.json) declara `prisma` e `mongodb`. O servidor do Mongo lê `MDB_MCP_CONNECTION_STRING` a partir de `${MONGO_URL}` — sem essa variável preenchida ele não conecta.

## Armadilhas de Windows

- **`prisma generate` com `EPERM`**: o `tsx watch` do `pnpm dev` mantém o engine do Prisma aberto. Pare o dev server antes de `pnpm db:migrate` ou `pnpm db:generate`.
- **`pnpm install` sobre `node_modules` de npm**: falha com `EPERM` ao mover pacotes para `.ignored`. Apague `node_modules` e reinstale.
- **Build scripts ignorados**: pnpm 10+ exige liberação explícita. Ela está em [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) (`onlyBuiltDependencies`) — o campo `pnpm` do `package.json` não é mais lido, e o pnpm avisa se ele estiver lá.
