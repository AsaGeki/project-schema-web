import type { IMongoRepository } from '@shared/infra/database/IBaseRepository';
import type { IFilterConfig } from '@shared/types/filter';
import type { IListQuery, IPaginated, IPaginationParams } from '@shared/types/pagination';
import { buildMongoWhere } from '@shared/utils/query/buildMongoWhere';

import type { Document, FilterQuery, Model, PopulateOptions, UpdateQuery } from 'mongoose';

/**
 * CRUD genérico sobre um model do Mongoose. O repositório de módulo estende esta
 * base, declara o `model` e implementa só o que é específico do domínio. Para um
 * caso específico, adicione o método no repositório concreto — não altere esta
 * base.
 */
export default abstract class BaseMongoRepository<
  TModel extends Document,
  TCreate,
  TUpdate = Partial<TCreate>,
> implements IMongoRepository<TModel, TCreate, TUpdate> {
  protected abstract readonly model: Model<TModel>;

  /** Ordenação default da paginação; sobrescreva no repositório concreto se precisar. */
  protected readonly defaultSort: Record<string, 1 | -1> = { createdAt: -1 };

  /** Whitelist de filtros da listagem genérica; cada repositório declara a sua. */
  protected readonly filterConfig: IFilterConfig = {};

  /** `populate` opcional aplicado nas leituras. */
  protected readonly populated: PopulateOptions[] = [];

  public async create(data: TCreate): Promise<TModel> {
    const document = await this.model.create(data as object);
    await document.populate(this.populated);
    return document;
  }

  public async findById(id: string): Promise<TModel | null> {
    return this.model.findById(id).populate(this.populated).exec();
  }

  public async findOne(filter: FilterQuery<TModel>): Promise<TModel | null> {
    return this.model.findOne(filter).populate(this.populated).exec();
  }

  public async update(id: string, data: TUpdate): Promise<TModel | null> {
    return this.model
      .findByIdAndUpdate(id, data as UpdateQuery<TModel>, { new: true })
      .populate(this.populated)
      .exec();
  }

  public async delete(id: string): Promise<TModel | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  public async count(where: FilterQuery<TModel> = {}): Promise<number> {
    return this.model.countDocuments(where).exec();
  }

  /**
   * Monta o filtro a partir da query + `filterConfig`, aplica o `scope`
   * obrigatório por cima (ex.: `{ userId }`, que o cliente não pode sobrescrever
   * via filtro) e pagina.
   */
  public async list(query: IListQuery, scope: object = {}): Promise<IPaginated<TModel>> {
    const filter = { ...buildMongoWhere<FilterQuery<TModel>>(query, this.filterConfig), ...scope };
    return this.paginate(filter, { page: query.page, limit: query.limit });
  }

  public async insertMany(data: TCreate[]): Promise<TModel[]> {
    return this.model.insertMany(data as object[]);
  }

  public async updateMany(filter: FilterQuery<TModel>, data: UpdateQuery<TModel>): Promise<number> {
    const result = await this.model.updateMany(filter, data).exec();
    return result.modifiedCount;
  }

  public async deleteMany(filter: FilterQuery<TModel>): Promise<void> {
    await this.model.deleteMany(filter).exec();
  }

  /**
   * Upsert em lote: `keys` são os campos que identificam o documento existente.
   * Cada item vira um `updateOne` com `upsert`, tudo num `bulkWrite` só.
   */
  public async bulkUpsert(keys: (keyof TCreate)[], data: TCreate[]): Promise<void> {
    if (data.length === 0) return;

    const operations = data.map(item => ({
      updateOne: {
        filter: Object.fromEntries(keys.map(key => [key, item[key]])) as FilterQuery<TModel>,
        update: { $set: item as object },
        upsert: true,
      },
    }));

    await this.model.bulkWrite(operations as never);
  }

  /** Recebe o filtro já montado, devolve os itens da página + os metadados. */
  protected async paginate(
    filter: FilterQuery<TModel>,
    { page, limit }: IPaginationParams,
    sort: Record<string, 1 | -1> = this.defaultSort,
  ): Promise<IPaginated<TModel>> {
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(this.populated)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
