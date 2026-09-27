# Setup de desenvolvimento

| Metadado            | Valor                                              |
| ------------------- | -------------------------------------------------- |
| Prompt summary      | Documentar como levantar o ambiente do schema base |
| Creation date       | 2026-09-01                                         |
| Change count        | 7                                                  |
| Last update date    | 2026-09-27                                         |
| Last prompt summary | Documentar as variáveis de upload                  |

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

Validadas por Zod em [`src/configs/envConfig.ts`](../src/configs/envConfig.ts), que é o ponto único de leitura de `process.env` (as exceções estão no fim desta seção). Configuração inválida derruba o processo no boot, com o erro impresso — não existe partida com ambiente incompleto.

O consumo é agrupado por domínio: `env.server.PORT`, `env.https.CERT`, `env.database.MONGODB_URI`, `env.auth.JWT_SECRET`. `isProduction` e o enum `ENodeEnv` também são exportados de lá.

Os nomes seguem o padrão dos backends da empresa (`avb_one_back`, `fbi_back`, `sso_back`), e o [`.env.example`](../.env.example) explica cada variável no próprio arquivo.

| Variável                      | Default         | Observação                                                                                           |
| ----------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                    | `development`   | `development`, `production` ou `test`. Controla nível de log, CORS, rate limit e a URI do Mongo.     |
| `PORT`                        | `3000`          |                                                                                                      |
| `SELF_HOST`                   | `localhost`     | Host deste backend, sem protocolo nem porta. Hoje só compõe a mensagem de boot.                      |
| `CORS`                        | `*`             | Lista separada por vírgula, ou `*`.                                                                  |
| `JSON_LIMIT`                  | `2mb`           | Corpo maior vira 413.                                                                                |
| `TRUST_PROXY`                 | `0`             | Número de proxies reversos na frente da API. `0` ignora o `x-forwarded-for`; atrás de um proxy, `1`. |
| `ENABLE_ROUTER_MONITORING`    | `false`         | Liga o log por requisição.                                                                           |
| `HTTPS_KEY` / `HTTPS_CERT`    | vazio           | Preencher os dois sobe o servidor em TLS. `HTTPS_CA` é opcional.                                     |
| `DATABASE_URL`                | vazio           | Postgres via Prisma, em qualquer ambiente. Vazio desliga.                                            |
| `MONGODB_URI`                 | vazio           | Mongo em produção.                                                                                   |
| `MONGODB_URI_DEV`             | vazio           | Mongo fora de produção. Vazia a do ambiente atual, a conexão é ignorada, com log em `debug`.         |
| `JWT_SECRET`                  | **sem default** | Obrigatória.                                                                                         |
| `JWT_EXPIRES_IN`              | `1d`            |                                                                                                      |
| `JWT_REFRESH_SECRET`          | **sem default** | Obrigatória, e deve ser diferente de `JWT_SECRET`.                                                   |
| `JWT_REFRESH_EXPIRES_IN`      | `12h`           |                                                                                                      |
| `API_KEYS_HMAC`               | vazio           | Chaves de integração server-to-server, `id:segredo,id2:segredo2`.                                    |
| `API_KEYS_HMAC_TOLERANCIA_MS` | `300000`        | Janela do timestamp assinado, em milissegundos.                                                      |
| `UPLOADS_DIR`                 | `./uploads`     | Raiz dos arquivos enviados. Em produção, pasta fora do projeto.                                      |
| `MAX_FILE_SIZE`               | `50MB`          | Por arquivo: número seguido de `B`, `KB`, `MB` ou `GB`. Acima dele, 413.                             |

Ficam fora do `envConfig`: `MEMORY_LIMIT_MB`, lida pelo `HealthService`; `npm_package_name`/`npm_package_version`, injetadas pelo pnpm e devolvidas no `GET /api/`; e `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, lidas pelo `prisma/seed.ts`.

## Bancos

**Postgres.** Preencha `DATABASE_URL` e rode `pnpm db:migrate` para criar o schema a partir de [`prisma/schema.prisma`](../prisma/schema.prisma). `pnpm db:studio` abre o inspetor.

O `pnpm db:seed` sincroniza o catálogo de permissões do código com o banco e cria o perfil `Administrador` para o usuário do seed. Rode de novo sempre que um módulo ganhar ou perder permissão.

**Mongo.** Preencha `MONGODB_URI_DEV` (ou `MONGODB_URI`, em produção). Não há migration: o model do Mongoose cria a coleção e os índices no primeiro uso.

Nenhum dos dois é exigido para o servidor subir. Com `DATABASE_URL` vazia o processo inicia, mas qualquer rota que toque o Postgres falha no runtime.

## Verificação

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm test
pnpm test:integration
```

Os seis rodam no CI a cada pull request ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)), com containers `postgres:18` e `mongo:8` para a integração. Typecheck, lint e format também rodam sozinhos após qualquer edição de `.ts`, pelo hook `PostToolUse` — que **bloqueia** a edição quando typecheck ou lint falham. Os testes não entram no hook.

## Testes

Vitest, configurado em [`vitest.config.mts`](../vitest.config.mts) com dois projetos.

| Comando                 | Roda                             | Precisa de banco                                      |
| ----------------------- | -------------------------------- | ----------------------------------------------------- |
| `pnpm test`             | `tests/**/*.test.ts`             | Não. `DATABASE_URL` e `MONGODB_URI_DEV` ficam vazias. |
| `pnpm test:watch`       | o mesmo, em modo observação      | Não.                                                  |
| `pnpm test:integration` | `tests/**/*.integration.test.ts` | Sim: `DATABASE_URL_TEST` e `MONGODB_URI_TEST`.        |

**Integração local.** Preencha no `.env` as duas URLs apontando para bancos cujo nome termine em `_test` (`project_schema_test`). Antes da suíte, o `prisma db push` aplica o schema no Postgres de teste e cria o banco se ele não existir; cada teste apaga os registros que usa; no fim, o banco Mongo de teste é removido. A execução para antes de tocar em qualquer banco quando a URL falta, é igual à de desenvolvimento ou não termina em `_test` ([`tests/ambienteDeTeste.mts`](../tests/ambienteDeTeste.mts)).

**Prisma e o Claude Code.** O Prisma detecta quando é chamado por um agente de IA e recusa comando destrutivo (`--force-reset`, `migrate reset`) sem consentimento explícito do usuário. Por isso o global setup usa `db push` sem reset, e a limpeza é feita pelos próprios testes.

**Segredos.** Os testes não leem o `JWT_SECRET` do `.env`: o `vitest.config.mts` injeta segredos próprios de teste.

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
