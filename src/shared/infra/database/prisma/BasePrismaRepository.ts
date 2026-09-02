import type { IBaseRepository } from '@shared/infra/database/IBaseRepository';
import type { IFilterConfig } from '@shared/types/filter';
import type { IListQuery, IPaginated, IPaginationParams } from '@shared/types/pagination';
import { buildPrismaWhere } from '@shared/utils/query/buildPrismaWhere';

/**
 * Estrutura mínima comum a todo delegate do Prisma (`prisma.user`, `prisma.bank`).
 * Os args são `any` de propósito: o type-safety público vem dos genéricos da
 * classe, não do delegate cru — que tem overloads demais para casar num contrato
 * único. `unknown` quebraria a assignability estrutural de `prisma.<model>`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface IPrismaDelegate<TModel> {
  create(args: { data: any }): Promise<TModel>;
  findUnique(args: { where: any }): Promise<TModel | null>;
  findFirst(args: { where?: any }): Promise<TModel | null>;
  findMany(args?: { where?: any; skip?: number; take?: number; orderBy?: any; include?: any }): Promise<TModel[]>;
  update(args: { where: any; data: any }): Promise<TModel>;
  delete(args: { where: any }): Promise<TModel>;
  count(args?: { where?: any }): Promise<number>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Código do Prisma para registro não encontrado em update/delete. */
const RECORD_NOT_FOUND = 'P2025';

/**
 * CRUD genérico sobre um delegate do Prisma. O repositório de módulo estende
 * esta base, declara o `delegate` e implementa só o que é específico do domínio.
 * Para um caso específico, adicione o método no repositório concreto — não
 * altere esta base.
 */
export default abstract class BasePrismaRepository<
  TModel,
  TCreate,
  TUpdate = Partial<TCreate>,
> implements IBaseRepository<TModel, TCreate, TUpdate> {
  protected abstract readonly delegate: IPrismaDelegate<TModel>;

  /** Ordenação default da paginação; sobrescreva no repositório concreto se precisar. */
  protected readonly defaultOrderBy: unknown = { createdAt: 'desc' };

  /** Whitelist de filtros da listagem genérica; cada repositório declara a sua. */
  protected readonly filterConfig: IFilterConfig = {};

  /** `include` opcional aplicado na listagem. */
  protected readonly listInclude: unknown = undefined;

  public async create(data: TCreate): Promise<TModel> {
    return this.delegate.create({ data });
  }

  public async findById(id: string): Promise<TModel | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  public async findOne(where: object): Promise<TModel | null> {
    return this.delegate.findFirst({ where });
  }

  public async update(id: string, data: TUpdate): Promise<TModel | null> {
    return this.handleNotFound(() => this.delegate.update({ where: { id }, data }));
  }

  public async delete(id: string): Promise<TModel | null> {
    return this.handleNotFound(() => this.delegate.delete({ where: { id } }));
  }

  public async count(where?: unknown): Promise<number> {
    return this.delegate.count({ where });
  }

  /**
   * Monta o `where` a partir da query + `filterConfig`, aplica o `scope`
   * obrigatório por cima (ex.: `{ userId }`, que o cliente não pode sobrescrever
   * via filtro) e pagina.
   */
  public async list(query: IListQuery, scope: object = {}): Promise<IPaginated<TModel>> {
    const where = { ...buildPrismaWhere<Record<string, unknown>>(query, this.filterConfig), ...scope };
    return this.paginate(where, { page: query.page, limit: query.limit });
  }

  /** Recebe o `where` já montado, devolve os itens da página + os metadados. */
  protected async paginate(
    where: unknown,
    { page, limit }: IPaginationParams,
    orderBy: unknown = this.defaultOrderBy,
  ): Promise<IPaginated<TModel>> {
    const [items, total] = await Promise.all([
      this.delegate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        ...(this.listInclude ? { include: this.listInclude } : {}),
      }),
      this.delegate.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Registro inexistente no update/delete devolve `null` em vez de lançar.
   * `protected` e genérico no retorno para o repositório concreto reusar o
   * tratamento numa query específica.
   */
  protected async handleNotFound<TResult>(operation: () => Promise<TResult>): Promise<TResult | null> {
    try {
      return await operation();
    } catch (error) {
      if ((error as { code?: string }).code === RECORD_NOT_FOUND) return null;
      throw error;
    }
  }
}
