import type {
  IPerfilCreate,
  IPerfilPublico,
  IPerfilUpdate,
  IPermissoesResolvidas,
} from '@modules/permissoes/dtos/PerfilDTO';
import type { IListQuery, IPaginated } from '@shared/types/pagination';

/**
 * Perfis e o vínculo deles com usuários. É Prisma de forma declarada: perfil e
 * permissão são relações no Postgres, e o módulo não é portável para o Mongo.
 */
export default interface IPerfisRepository {
  create(data: IPerfilCreate): Promise<IPerfilPublico>;
  findById(id: string): Promise<IPerfilPublico | null>;
  update(id: string, data: IPerfilUpdate): Promise<IPerfilPublico | null>;
  delete(id: string): Promise<IPerfilPublico | null>;
  list(query: IListQuery): Promise<IPaginated<IPerfilPublico>>;
  /** Ids das permissões `grupo:acao` que existem no banco; a que não existe fica de fora. */
  idsDasPermissoes(chaves: string[]): Promise<string[]>;
  contarExistentes(perfilIds: string[]): Promise<number>;
  algumComAcessoTotal(perfilIds: string[]): Promise<boolean>;
  /** `null` quando o usuário não existe. */
  permissoesDoUsuario(userId: string): Promise<IPermissoesResolvidas | null>;
  /** Substitui os perfis do usuário; `false` quando o usuário não existe. */
  definirPerfisDoUsuario(userId: string, perfilIds: string[]): Promise<boolean>;
  contarUsuariosComAcessoTotal(excetoUserId: string): Promise<number>;
}
