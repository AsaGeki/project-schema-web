# Decisões de arquitetura

| Metadado            | Valor                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Prompt summary      | Registrar o porquê de cada decisão arquitetural, não só o que ela é |
| Creation date       | 2026-09-01                                                          |
| Change count        | 0                                                                   |
| Last update date    | 2026-09-01                                                          |
| Last prompt summary | Registrar o porquê de cada decisão arquitetural, não só o que ela é |

[`PADROES.md`](PADROES.md) diz **o que** é o padrão e [`ARCHITECTURE.md`](ARCHITECTURE.md) diz **como** montar um módulo. Este documento diz **por quê**, e o que cada escolha custa.

A base de comparação não é teoria: é o código dos projetos próprios levantados para montar este schema. Onde há número, ele vem de contagem sobre esse código.

---

## Módulo como unidade, não camada

**Decisão.** `src/modules/<recurso>/` contém tudo daquele recurso — DTO, repositório, serviços, controller, rota, registro no container. Não existe `src/controllers/` nem `src/services/` na raiz.

**Por quê.** Mexer numa funcionalidade abre um diretório, não sete. A alternativa horizontal espalha uma mudança de "adicionar campo em usuário" por seis pastas distantes, e nada no código indica que aqueles arquivos andam juntos. Aqui, apagar um módulo é apagar um diretório e duas linhas de registro.

**Custo.** Código realmente compartilhado precisa de um lugar, e esse lugar (`shared/`) tende a virar depósito. A contenção é a regra de que `shared/` só recebe o que é infraestrutura transversal — nunca domínio.

---

## Service depende de interface, não de classe

**Decisão.** O service recebe `IUsersRepository` por token do container. A classe concreta só é conhecida no `container/index.ts` do módulo.

**Por quê.** É o que torna a persistência dupla possível sem reescrever regra de negócio. O módulo `users` fala com Postgres e o módulo `logs` com Mongo, e nenhum dos dois services sabe disso. Trocar o banco de um módulo é trocar a linha do container e escrever outro repositório concreto — os services não mudam.

Também é o que impede o vazamento silencioso: sem a interface, o primeiro `prisma.user.findMany()` dentro de um service passa despercebido no review, e a partir daí o módulo está casado com o ORM.

**Custo.** Uma interface a mais por repositório, e um token string que o compilador não verifica — errar o nome do token só aparece em runtime, quando o container não resolve.

---

## Um service por ação

**Decisão.** `CreateService`, `FindAllService`, `UpdateService`, `DeleteService` são arquivos separados. Não existe `UsersService` com quatro métodos.

**Por quê.** A classe com todas as ações da entidade cresce sem freio: injeta o que a ação mais exigente precisa, e todas as outras carregam junto. Um service por ação injeta exatamente suas dependências — o `CreateService` de `users` pede repositório e hash; o `DeleteService` pede só o repositório.

O efeito colateral é o que mais importa na prática: **o arquivo pequeno resiste ao inchaço**. Nos projetos levantados, o que adotou essa regra junto com o critério de método auxiliar tem 10 métodos privados em 63 services; o que não adotou tem 65 em 93. A regra não é sobre elegância, é sobre onde a lógica se acumula quando ninguém está olhando.

**Custo.** Mais arquivos. Um CRUD simples são quatro arquivos onde caberia um.

---

## Envelope de resposta em vez de `res.json` direto

**Decisão.** Service de fronteira devolve `IResponseEx`, e `sendResponse` traduz para HTTP.

**Por quê.** Sem envelope, o status HTTP fica na mão de quem escreve cada handler — e some. O padrão anterior devolvia `{ success, message, data }` sem status: **toda criação bem-sucedida respondia 200 em vez de 201**, porque `res.json()` sozinho não muda o status. O cliente não conseguia distinguir "criado" de "consultado" pela linha de status.

Com o envelope, o status é campo obrigatório do retorno do service — não dá para esquecer, porque o tipo exige. E convenção que vale para a API inteira (corpo vazio no 204, `Location` no 201, cookie de refresh) entra num arquivo só, em vez de ser replicada em cada controller.

**Custo.** O service passa a conhecer status HTTP, o que é uma concessão: uma regra de negócio pura não deveria saber o que é 409. A alternativa — o controller decidir o status — devolve o problema para o lugar onde ele se perde.

---

## Erro lançado, nunca retornado

**Decisão.** `throw new ConflictError(...)`. Nunca `return { success: false }`.

**Por quê.** Erro retornado precisa ser propagado à mão em cada nível, e basta um `if` esquecido para o fluxo seguir com dado inválido. Erro lançado interrompe o fluxo por construção e chega a um único ponto de tratamento, que é onde a formatação da resposta acontece uma vez só.

É também o que permite ao `errorMiddleware` normalizar o que vem de fora — código `P####` do Prisma, `ValidationError` do Mongoose, `ZodError`, falha de parse do body — para o mesmo formato do erro de negócio. Quem consome a API vê um contrato só.

**Custo.** O caminho de erro não aparece na assinatura: ler `execute(): Promise<IResponseEx<IUser>>` não diz que a função pode lançar 409. Isso fica no corpo do service e na documentação de status.

---

## Zod como fonte de verdade do tipo de entrada

**Decisão.** O schema é escrito primeiro, e o tipo é derivado dele: `interface IUser extends z.infer<typeof userSchema> {}`.

**Por quê.** Declarar a interface e o schema separados cria duas fontes de verdade que divergem no primeiro campo adicionado — e a divergência é silenciosa, porque o compilador valida contra a interface enquanto o runtime valida contra o schema. Derivando, mudar o schema propaga para o tipo, e esquecer um campo vira erro de compilação.

O projeto anterior não tinha validação alguma: DTO era interface pura e o controller fazia `req.body as IDTO`. O `as` é uma afirmação sem verificação — o dado do cliente entrava até o banco sem ninguém conferir.

**Custo.** O tipo fica acoplado a uma biblioteca. Trocar de validador significa reescrever os DTOs, não só os middlewares.

---

## Zod valida campo; regra cruzada mora no service

**Decisão.** Nada de `.refine()` ou `.superRefine()` cruzando campos.

**Por quê.** Dois motivos concretos. Primeiro, numa atualização parcial o payload sozinho não descreve o estado final do recurso — a regra "se tipo é X então Y é obrigatório" precisa do que já está no banco, então ela teria que ser reescrita no service de qualquer forma, e passaria a existir em dois lugares com status HTTP diferentes para a mesma violação. Segundo, regra escondida no schema é regra que quem lê o service não vê.

**Custo.** O schema fica deliberadamente simples, e parte da validação só é descoberta lendo o service.

---

## Filtro declarativo no repositório

**Decisão.** O repositório declara `filterConfig`; a base traduz para o banco.

**Por quê.** A alternativa é o encadeamento de `if (query.x)` dentro de cada `FindAllService` — que se repete integralmente em cada módulo novo, e onde cada cópia diverge um pouco. Além de volume, é superfície de risco: filtrar por qualquer campo que o cliente mandar expõe coluna que não deveria ser filtrável.

`filterConfig` é uma allowlist. O que não está declarado não vira filtro, e o `scope` — segundo argumento de `list` — é aplicado por cima, então o filtro obrigatório de posse não pode ser sobrescrito pela query string.

**Custo.** Filtro fora do que `equals`, `search` e `range` cobrem exige um método próprio no repositório concreto. A configuração declarativa cobre o comum, não o exótico.

---

## Contrato comum enxuto entre os dois bancos

**Decisão.** `IBaseRepository` tem só o que Prisma e Mongoose honram. `insertMany`, `bulkUpsert`, `updateMany` e `deleteMany` ficam em `IMongoRepository`; `transaction` fica em `IPrismaRepository`.

**Por quê.** Um contrato único com tudo obrigaria uma das implementações a ter métodos que só lançam — o que quebra a substituição: quem depende do contrato não pode confiar nele. Mantendo o comum pequeno, um módulo CRUD que depende só dele é de fato portável, e um módulo que precisa de mais **declara isso na assinatura**. O amarre ao banco fica legível, em vez de escondido no corpo do repositório.

É por isso que `BasePrismaRepository` implementa `IBaseRepository` e não `IPrismaRepository`: colocar `transaction` na base exigiria exatamente o método que só lança e que a decisão quer evitar.

**Custo.** Módulo que precisa de recurso específico não é portável, e trocar seu banco é reescrever o service junto. A decisão não elimina o acoplamento — torna-o visível.

---

## Controller fino, não injetável, com `this: void`

**Decisão.** O controller resolve o service dentro do método, é instanciado com `new` na rota, e seus métodos declaram `this: void`.

**Por quê.** Controller sem estado não precisa de container: registrar cada um seria cerimônia sem contrapartida. Resolver o service dentro do método, e não no construtor, mantém a instância vazia — é o que permite passar o método direto para a rota.

O `this: void` troca uma convenção por uma garantia. Antes, `.bind(controller)` era exigido em toda rota para proteger contra um caso raro. Agora o compilador recusa acesso a `this` no método marcado, e quando um controller de fato precisa de estado — cliente externo, auxiliar de autorização compartilhado por vários handlers — o método perde a marca e o lint volta a exigir o `bind`. **O `bind` deixou de ser ritual e passou a sinalizar exatamente os métodos que dependem da instância.**

**Custo.** `this: void` é construção pouco conhecida e alonga a assinatura. Quem lê pela primeira vez precisa deste parágrafo.

---

## Tipagem da entrada por genérico do Express

**Decisão.** `Request<Params, ResBody, ReqBody>` e o segundo genérico de `Response`, que é `locals`.

**Por quê.** O `as` espalhado pelo corpo do método afirma um tipo sem verificar nada, e some no meio da lógica. Movendo para a assinatura, a mesma afirmação vira contrato: quem lê o método vê o que ele espera receber antes de ler o que ele faz, e a rota logo abaixo mostra o middleware que sustenta essa expectativa.

Vale ser exato sobre o que isso garante. Para `req.params.id` a garantia é real — o Express sempre popula parâmetro declarado na rota. Para `req.body` e `res.locals.query` continua sendo afirmação: o tipo só se realiza porque o `validateSchema` ou o `validateQuery` rodou antes. A mudança é de legibilidade e de lugar, não de segurança.

**Custo.** Assinaturas mais longas, e dependência de conhecimento sobre genéricos do Express que quase ninguém usa.

---

## `envConfig` como única leitura de ambiente

**Decisão.** Nenhum arquivo além dele toca `process.env`. Arquivo em `configs/` só existe quando faz algo além de repassar variável.

**Por quê.** `process.env` espalhado significa que a resposta para "quais variáveis este projeto usa?" é um grep, e que uma variável ausente aparece como `undefined` no meio de uma requisição em vez de no boot. Centralizado e validado, ambiente incompleto derruba o processo na partida, com a lista do que falta.

A segunda metade da regra existe porque o repasse puro dá a ilusão de configuração: um arquivo que só reexporta `env.PORT` como `apiConfig.port` acrescenta um nome, um import e nenhuma decisão. Quando existiam, os dois arquivos assim somavam nove repasses e zero lógica.

**Custo.** Um arquivo grande, que cresce com o projeto e precisa ser reorganizado por domínio para continuar legível.

---

## O que este schema deliberadamente não tem

- **Framework de teste.** Não configurado, e não por esquecimento — ver [`CLAUDE.md`](../CLAUDE.md).
- **Spec OpenAPI.** O projeto não gera nem valida contrato de API.
- **Autenticação completa.** Há verificação de token, mas não há login, refresh nem revogação — o módulo `users` é referência de padrão, não de produto.
- **Soft delete, cache e cron.** Existem nos projetos que originaram este padrão. Não foram trazidos porque cada um carrega decisões próprias, que merecem ser tomadas no projeto que precisar deles.
