import type { IListQuery, IPaginated } from '@shared/types/pagination';

/**
 * Contrato mínimo comum a qualquer persistência. É dele que as interfaces de
 * repositório de módulo herdam quando o módulo é portável entre bancos — o
 * service depende desta interface, nunca da classe concreta.
 */
export interface IBaseRepository<TModel, TCreate, TUpdate = Partial<TCreate>> {
  create(data: TCreate): Promise<TModel>;
  findById(id: string): Promise<TModel | null>;
  update(id: string, data: TUpdate): Promise<TModel | null>;
  delete(id: string): Promise<TModel | null>;
  count(where?: unknown): Promise<number>;
  list(query: IListQuery, scope?: object): Promise<IPaginated<TModel>>;
}

/**
 * Extensão para módulos que precisam do que só o Mongo oferece. Depender desta
 * interface amarra o módulo ao Mongo, e isso fica visível na assinatura.
 */
export interface IMongoRepository<TModel, TCreate, TUpdate = Partial<TCreate>> extends IBaseRepository<
  TModel,
  TCreate,
  TUpdate
> {
  findOne(filter: object): Promise<TModel | null>;
  insertMany(data: TCreate[]): Promise<TModel[]>;
  updateMany(filter: object, data: object): Promise<number>;
  deleteMany(filter: object): Promise<void>;
  bulkUpsert(keys: (keyof TCreate)[], data: TCreate[]): Promise<void>;
}

/**
 * Extensão para módulos que precisam do que só o Prisma oferece. Depender desta
 * interface amarra o módulo ao Prisma, e isso fica visível na assinatura.
 */
export interface IPrismaRepository<TModel, TCreate, TUpdate = Partial<TCreate>> extends IBaseRepository<
  TModel,
  TCreate,
  TUpdate
> {
  findOne(where: object): Promise<TModel | null>;
  transaction<TResult>(operation: (tx: unknown) => Promise<TResult>): Promise<TResult>;
}
