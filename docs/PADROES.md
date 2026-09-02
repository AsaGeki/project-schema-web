# Padrões do backend base

Documento vivo do padrão de código e arquitetura deste projeto. Ele nasce de um levantamento
sobre o código de autoria própria em sete repositórios: `api-finance-back`, `asageki-rpg-web`,
`avbot_back`, `backend_sig`, `crons_services`, `fbi_back` e `sso_back`.

A base de evidência é apenas o código efetivamente escrito por Arthur Gabriel: os projetos
`api-finance-back`, `asageki-rpg-web` e `avbot_back` por inteiro, mais os módulos `escoria`,
`document` e `estoqueLaminador` (backend_sig), `escoria` (crons_services), `institucional` e
`gases` (fbi_back), `emailConfirmation`, `src/configs/`, os helpers de busca e paginação e as
configurações de repositório (sso_back).

Dentro dos repositórios de terceiros, três módulos carregam voz própria e três seguiram o padrão
da casa. Impuseram estilo próprio: `backend_sig/escoria` (`private readonly` em 14 pontos, num
repositório onde o restante tem 2 em 536 services), `fbi/institucional` (`async execute` sem
`public`, contra 260 ocorrências com `public` no restante) e `fbi/gases` (`logger.child`, ausente
nos outros 282 services do repositório). Seguiram a casa: `sig/document`, `sig/estoqueLaminador`,
`crons/escoria` e `sso/emailConfirmation`.

---

## Estrutura de pastas

```
src/
  configs/                     fora de shared, plural
    envConfig.ts               única leitura de process.env, agrupada por domínio
    corsConfig.ts              configuração derivada, com lógica própria
    database/
      prismaClient.ts
      mongoClient.ts
  shared/
    container/index.ts
    errors/
      UniversalError.ts
      PrismaErrors.ts  MongoErrors.ts
    infra/
      database/
        IBaseRepository.ts     contrato agnóstico de banco
        prisma/BasePrismaRepository.ts
        mongo/BaseMongoRepository.ts
      https/
        app.ts                 classe AppServer
        sendResponse.ts
        rateLimiter.ts
        middlewares/
        routes/Router.ts       barrel global das rotas
    services/                  LoggerService, HashService
    types/                     response.ts  pagination.ts  filter.ts  audit.ts  global.d.ts
    utils/                     subpasta por domínio, um util por arquivo
      auth/  files/  pagination/  search/  time/  url/
  modules/
    <modulo>/
      dtos/
      repositories/            interfaces
      infra/
        <prisma|mongo>/
        https/
          controllers/
          routes/
      services/
      container/index.ts
  server.ts
```

Middlewares moram em `shared/infra/https/middlewares/` — middleware é infraestrutura HTTP, não
utilitário. `configs/` fica fora de `shared/`.

**`envConfig` é o único ponto que lê `process.env`**, e expõe as variáveis agrupadas por domínio
(`env.server.PORT`, `env.auth.JWT_SECRET`, `env.database.MONGO_URL`). Quem precisa de configuração
lê de lá, ou de um `*Config` que derive de lá.

Um arquivo em `configs/` só existe quando **faz algo além de repassar variável** — montar o
callback de origem do CORS, validar um formato, escolher um provedor. Objeto que apenas espelha
env em outro nome não é configuração: some, e o consumidor passa a ler o `envConfig` direto.
Constante que não vem de ambiente pertence a quem a usa, não a um arquivo de config.

## Nomenclatura

**Idioma.** Nomenclatura mista com preferência por português. Inglês fica reservado a termos
consolidados no domínio técnico. Comentários em português. Mensagens de erro voltadas ao usuário
final em português.

**Arquivos.** `dtos/` no plural. Arquivo de rota individual em PascalCase com sufixo `Route`
(`UserRoute.ts`). O sufixo `Router` pertence exclusivamente ao barrel global em
`shared/infra/https/routes/`. Service em PascalCase com sufixo `Service` (`CreateService.ts`,
nunca `Create.service.ts`).

**Export.** Um arquivo com uma única classe usa `export default`. Um arquivo que declara várias
classes usa named export — é o caso de `UniversalError.ts`, que reúne a classe base e as
subclasses por status. Nunca declarar a classe e exportá-la numa linha separada no fim do arquivo.

**Nome de classe de service.** Operação de CRUD recebe nome genérico e o contexto vem da pasta:
`services/caixinha/CreateService.ts`. Ação própria do domínio recebe nome descritivo:
`CreateAporteService`, `GetSaldoService`, `EnviarFormalizacaoService`, `SyncGroupMetadataService`,
`AppendSlagSplashingSampleService`.

**Nome de classe e nome de arquivo sempre coincidem.**

## Controller

```ts
export default class UsersController {
  public async create(this: void, req: Request<unknown, unknown, IUser>, res: Response): Promise<Response> {
    const service = container.resolve(CreateService);
    const result = await service.execute(req.body);
    return sendResponse(res, result);
  }
}
```

O controller é fino: resolve o service no container dentro do próprio método, executa e devolve.
Não é injetável — o router o instancia com `new`. Métodos são `public async` e retornam
`Promise<Response>`.

**Tipagem da entrada vem dos genéricos do Express, não de `as`.** `Request<Params, ResBody, ReqBody>`
tipa `req.params` e `req.body`; o segundo genérico de `Response` tipa `res.locals`, que é onde o
`validateQuery` deposita a query já coagida. Assim `req.body`, `req.params.id` e `res.locals.query`
chegam tipados no corpo do método, e o contrato fica na assinatura em vez de espalhado em casts.

**Método de controller declara `this: void`**, e por isso é registrado na rota sem `bind`. A marca
é verificada pelo compilador: tocar `this` num método assim não compila. Quando um controller
precisar de estado — cliente externo em campo, auxiliar privado de autorização — o método perde a
marca, e aí `@typescript-eslint/unbound-method` volta a exigir `.bind(controller)` no `Route`. O
`bind` deixa de ser ritual em toda rota e passa a marcar exatamente os métodos que dependem da
instância.

Ordem canônica dos métodos: `create`, `findAll`, `findById`, `update`, `delete`, e depois os
verbos de fluxo próprios do módulo.

Vocabulário fechado para CRUD: `create`, `findAll`, `findById`, `update`, `delete`. `findById`
busca exclusivamente por identificador. `findOne` permanece disponível para busca por critério
arbitrário — são operações distintas, não sinônimos.

## Service

```ts
const log = logger.child({ prefix: 'users' });

@injectable()
export default class CreateService {
  constructor(
    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  public async execute(data: IUser): Promise<IResponseEx<IUserPublic>> {
    // ...
  }
}
```

Um service equivale a uma ação. `execute` é o único método público; todo o resto é privado.
O retorno é sempre tipado.

**Campo injetado.** `repository` quando o service injeta um único repositório e ele é o da própria
entidade. Nome explícito (`empresaRepository`) quando há mais de um, ou quando o repositório
pertence a outra entidade.

**Modificador do campo.** Campo injetado pelo construtor é sempre `private readonly` — o container
nunca reatribui. Constante de configuração da classe também é `private readonly`. Campo que carrega
estado mutável de runtime — cliente que reconecta, flag de ciclo em andamento, referência de
listener — é `private` sem `readonly`, e é o único caso em que a omissão se justifica.

**Método auxiliar privado** só se justifica por repetição — o trecho aparece mais de uma vez dentro
do `execute` — ou por coesão, quando o trecho é grande e distinto o bastante para ficar melhor
separado. Fora desses dois casos a lógica fica dentro do `execute`, que não é um delegador vazio.

**Util não é service.** Função pura, sem dependência injetada, é uma função exportada em `utils/`,
sem classe e sem `execute`. `shared/utils/` se organiza em subpasta por domínio (`auth/`, `files/`,
`pagination/`, `search/`, `time/`, `url/`), com uma única funcionalidade por arquivo.

## Persistência

O projeto suporta Prisma e Mongoose simultaneamente. O contrato comum é enxuto e agnóstico:

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

Recursos exclusivos de cada banco ficam em interfaces de extensão (`IMongoRepository` com
`bulkUpsert`, `insertMany`; `IPrismaRepository` com `transaction`). Um módulo que depende da
extensão está declaradamente amarrado àquele banco, e isso fica visível na assinatura.

A filtragem da listagem é declarativa: o repositório concreto declara `filterConfig` — com
`equals`, `search` e `range` —, e a base traduz para `where` do Prisma ou para filtro do Mongo.
Nenhum service escreve encadeamento de `if` sobre a query.

## Resposta HTTP

```ts
export interface IResponseEx<T = unknown> {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
  meta?: IPaginationMeta;
  headers?: Record<string, string>;
}
```

Todo service chamado por controller devolve esse envelope. `sendResponse` é o tradutor único:
aplica o status na linha de status, os headers extras, e monta o corpo
`{ success, message, data, meta }`. Respostas 204 e 304 saem sem corpo.

Erro nunca volta como `success: false` a partir do service — erro se lança.

## Erros

`UniversalError` é a classe base, com subclasse por status HTTP. Aceita tanto uma string, que vira
a mensagem, quanto o objeto completo de opções (`title`, `message`, `status`, `code`, `details`,
`data`, `operation`, `originalError`). Expõe `toJSON()` e conta com `ErrorService` para título e
mensagem padrão por status.

O `errorMiddleware` é o único ponto de tratamento e cobre erro do ORM, erro do body-parser, erro de
validação do Zod, `UniversalError` e o caso não mapeado.

## Validação

O schema Zod é a fonte de verdade do formato de entrada, e o contrato de domínio deriva dele:

```ts
export const usuarioSchema = z.object({/* ... */});
export interface IUsuario extends z.infer<typeof usuarioSchema> {}
export const usuarioPartialSchema = usuarioSchema.partial();
```

O Zod valida campo isoladamente — tipo, obrigatoriedade, tamanho, enum, formato. Regra que cruza
campos ou depende do banco é regra de negócio e mora no service. Não usar `refine` nem
`superRefine` para validação cruzada.

Contrato de objeto é `interface` com prefixo `I`, inclusive quando derivado do Zod. `type` fica
reservado a união, alias curto e primitivo nomeado.

Nomes no singular dentro de `dtos/`.

## Logger

Winston com rotação diária de arquivo e níveis próprios (`error`, `notice`, `warn`, `info`,
`debug`). Todo arquivo que registra log declara o child logger no topo:

```ts
const log = logger.child({ prefix: 'users' });
```

## Injeção de dependência

tsyringe. A implementação recebe `@injectable()`, o service recebe `@inject('Token')` no construtor
e depende sempre da interface, nunca da classe concreta. Cada módulo tem seu
`container/index.ts`, importado pelo container global em `shared/container/index.ts`.

## Ferramental

ESLint em flat config, com `recommended-type-checked` e `projectService`, `import-x/order`
configurado com os aliases do projeto e ordenação corrigível automaticamente,
`consistent-type-imports` no formato separado, `naming-convention` exigindo prefixo `I` em
interface, e `no-unused-vars` ignorando o prefixo `_`.

Prettier com `printWidth` 120, aspas simples, `trailingComma` em `all`, `arrowParens` em `avoid`,
`endOfLine` em `lf`, indentação por espaço.

`scripts/generate-module.ts` gera o esqueleto do módulo a partir de template, recebendo a
persistência alvo. O pacote base de services do CRUD é `CreateService`, `FindAllService`,
`UpdateService` e `DeleteService`; `FindByIdService` não entra no esqueleto e é criado quando o
módulo precisar de busca por identificador. Hook `PostToolUse` roda typecheck, lint e format após
edição de arquivo `.ts`.

## Casos específicos — anotados, não generalizados

**Runtime vivo em memória.** `avbot_back` mantém processos contínuos dentro da aplicação
(`OpcUaManager`, `DataTagRuntime`, `AssemblerManager`, `MensagensComplexasManager`,
`MonitorDispatchService`, `WhatsAppClient`). Parte do sistema é requisição/resposta e parte é
processo contínuo. O padrão de CRUD não descreve esse código, e cada runtime documenta o próprio
contrato num `CLAUDE.md` do módulo.

**Múltiplas fontes de dados no mesmo módulo.** `backend_sig/escoria` mantém repositórios Mongo ao
lado de repositórios SQL Server, em `infra/SQL/` e `infra/sqlconnect/`. É o precedente real de
persistência combinada dentro de um módulo.

**Módulo de leitura sobre sistema externo.** `fbi/institucional` e `fbi/gases` consultam dados de
outro sistema e expõem apenas leitura.

**Dialeto imposto por repositório de terceiro.** Em `backend_sig/escoria` o export é named e o nome
da classe é descritivo mesmo no CRUD (`CreateEscoriaHistoricoService`), porque o named export torna
o nome genérico ambíguo. Registrado como consequência do contexto, não como padrão a replicar.

---

## Em aberto

- `scripts/generate-module.ts`, decidido e ainda não escrito.
